/** Website-backed local provider. No provider credentials, model guesses or answer cache. */
import { closeSync, constants, fstatSync, lstatSync, openSync, readSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import type { ModelDef, ProviderConfig } from '@koryphaios/shared';
import type { Provider, ProviderEvent, ProviderMessage, StreamRequest } from './types';

export interface CodemaxConnection { baseUrl: string; token: string }
export interface CodemaxModel extends ModelDef {
  reasoningLevels: string[];
  reasoningModes: Array<{ value: string; label: string }>;
  contextSource: string;
  tokenizer: { name: string | null; exact_counting: boolean; mode: string };
}
const MAX_CATALOG_BYTES = 524288;
const MAX_FRAME_BYTES = 262144;
const TTL_MS = 15000;
const clean = (s: unknown, max = 256): s is string =>
  typeof s === 'string' && s.length > 0 && s.length <= max && !/[\x00-\x1f\x7f]/.test(s);
const record = (x: unknown): x is Record<string, any> => !!x && typeof x === 'object' && !Array.isArray(x);
const validLimit = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 128 && (n as number) <= 10000000;

export function normalizeCodemaxURL(value: string): string {
  if (!/^http:\/\/127\.0\.0\.1:\d+\/v1\/?$/.test(value)) throw new Error('Literal local URL required.');
  const url = new URL(value);
  // Literal loopback only: no DNS resolution, redirects, credentials or search parameters.
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port ||
      url.username || url.password || url.search || url.hash || !/^\/v1\/?$/.test(url.pathname))
    throw new Error('Codemax requires its literal 127.0.0.1 local gateway.');
  return url.origin + '/v1';
}

export function readCodemaxConnection(path = process.env.CODEMAX_CONNECTION_FILE ||
  join(process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share'),
    'com.micahcooley.codemax', 'connection.json')): CodemaxConnection | undefined {
  let fd: number | undefined;
  try {
    const uid = process.getuid?.();
    if (uid === undefined) return undefined; // This release is Linux native.
    const parent = lstatSync(dirname(path));
    if (!parent.isDirectory() || parent.isSymbolicLink() || parent.uid !== uid || (parent.mode & 0o022)) return undefined;
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.uid !== uid || stat.nlink !== 1 || (stat.mode & 0o077) || stat.size < 2 || stat.size > 4096) return undefined;
    const data=Buffer.alloc(4097);let count=0;
    while(count<data.length){const n=readSync(fd,data,count,data.length-count,count);if(n===0)break;count+=n;}
    if(count!==stat.size || count>4096)return undefined;
    const bytes = new TextDecoder('utf-8',{fatal:true}).decode(data.subarray(0,count));
    const after = fstatSync(fd);
    if (after.size !== stat.size || after.mtimeMs !== stat.mtimeMs || after.ctimeMs !== stat.ctimeMs) return undefined;
    const value: unknown = JSON.parse(bytes);
    if (!record(value) || value.version !== 1 || value.backend !== 'zag' || value.running !== true ||
        !clean(value.token, 160) || !/^sk-local-[a-f0-9]{64}$/.test(value.token) || !clean(value.base_url)) return undefined;
    return { baseUrl: normalizeCodemaxURL(value.base_url), token: value.token };
  } catch { return undefined; }
  finally { if (fd !== undefined) closeSync(fd); }
}

export function parseCodemaxModels(payload: unknown): CodemaxModel[] {
  if (!record(payload) || payload.object !== 'list' || payload.codemax_catalog_version !== 1 ||
      !Array.isArray(payload.data) || payload.data.length > 1024) throw new Error('Invalid Codemax model catalog.');
  const ids = new Set<string>();
  return payload.data.map((raw: unknown) => {
    if (!record(raw) || !clean(raw.id) || raw.object !== 'model' || ids.has(raw.id)) throw new Error('Invalid Codemax model entry.');
    ids.add(raw.id);
    const context = record(raw.context) ? raw.context : {};
    const reasoning = record(raw.reasoning) ? raw.reasoning : {};
    const tokenizer = record(raw.tokenizer) ? raw.tokenizer : {};
    const modes = reasoning.control_observed === true && Array.isArray(reasoning.modes) ? reasoning.modes.slice(0, 32).filter((m: unknown) =>
      record(m) && clean(m.value, 180) && clean(m.label, 240)).map((m: any) => ({value:m.value,label:m.label})) : [];
    const known = validLimit(context.nominal);
    return {
      id: raw.id, apiModelId: raw.id, name: clean(raw.display_name) ? raw.display_name : raw.id,
      provider: 'codemax', contextWindow: known ? context.nominal : 0,
      maxOutputTokens: validLimit(raw.max_output_tokens) ? raw.max_output_tokens : 0,
      contextVerified: known && context.source === 'WEBSITE_REPORTED',
      contextSource: clean(context.source) ? context.source : 'UNKNOWN',
      canReason: reasoning.control_observed === true && reasoning.supported === true, reasoningModes: modes, reasoningLevels: [...new Set(modes.map(m => m.value))],
      supportsStreaming: true, functionCall: raw.tools === 'emulated',
      supportsAttachments: raw.vision === true, vision: raw.vision === true,
      tokenizer: {name: clean(tokenizer.name) ? tokenizer.name : null, exact_counting: tokenizer.exact_counting === true,
        mode: clean(tokenizer.mode) ? tokenizer.mode : 'unknown'},
      // No fabricated cost, context size, output limit or tokenizer precision.
    };
  });
}

export function encodeCodemaxMessages(messages: ProviderMessage[]): Record<string, unknown>[] {
  return messages.map(message => {
    if (Array.isArray(message.content) && message.content.some(b => b.type !== 'text'))
      throw new Error('Codemax requires text tool results; this message contains an unsupported content block.');
    const content = typeof message.content === 'string' ? message.content : message.content.map(b => b.text ?? '').join('\n');
    return {
      role: message.role, content,
      ...(message.tool_call_id && {tool_call_id: message.tool_call_id}),
      ...(message.tool_calls?.length && {tool_calls: message.tool_calls.map(call => ({
        id: call.id, type: 'function', function: {name: call.name, arguments: JSON.stringify(call.input)},
      }))}),
    };
  });
}

/** Bounded SSE decoding with CRLF normalization and real cancellation of the reader. */
export async function* codemaxSSE(body: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<unknown> {
  const reader = body.getReader(); const decoder = new TextDecoder('utf-8', {fatal:true});
  let pending = ''; let total = 0; let inactivity: ReturnType<typeof setTimeout> | undefined;
  let stopped = false; const abort = () => { stopped = true; void reader.cancel().catch(() => {}); };
  const reset = () => { clearTimeout(inactivity); inactivity = setTimeout(abort, 300000); };
  signal?.addEventListener('abort', abort, {once:true}); reset();
  try {
    while (true) {
      if (signal?.aborted || stopped) throw new Error('Codemax stream cancelled or idle deadline reached.');
      const next = await reader.read();
      if (signal?.aborted || stopped) throw new Error('Codemax stream cancelled or idle deadline reached.');
      if (next.done) break;
      total += next.value.byteLength;
      if (total > 16777216) throw new Error('Codemax stream byte limit reached.');
      reset(); pending += decoder.decode(next.value, {stream:true});
      pending = pending.replace(/\r\n/g, '\n');
      for (let at = pending.indexOf('\n\n'); at >= 0; at = pending.indexOf('\n\n')) {
        const frame = pending.slice(0, at); pending = pending.slice(at + 2);
        if (Buffer.byteLength(frame) > MAX_FRAME_BYTES) throw new Error('Codemax event limit reached.');
        const data = frame.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).replace(/^ /, '')).join('\n');
        if (!data) continue;
        if (data === '[DONE]') { yield {codemax_done:true}; return; }
        yield JSON.parse(data);
      }
      if (Buffer.byteLength(pending) > MAX_FRAME_BYTES) throw new Error('Codemax event limit reached.');
    }
    pending += decoder.decode();
    if (pending.trim()) throw new Error('Codemax stream ended in a partial event.');
    throw new Error('Codemax stream ended without its terminal event.');
  } finally { clearTimeout(inactivity); signal?.removeEventListener('abort',abort); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export class CodemaxProvider implements Provider {
  readonly name = 'codemax';
  private models: CodemaxModel[] = [];
  private expiry = 0; private etag = ''; private identity = '';
  private retryDiscoveryAfter = 0;
  private discoveryError: string | undefined;
  private refreshInFlight: Promise<void> | undefined;
  private sessions = new Map<string, string>();
  private active = new Set<string>();
  constructor(readonly config: ProviderConfig) {}

  private connection(): CodemaxConnection | undefined {
    if (this.config.disabled) return undefined;
    const explicit = this.config.apiKey || process.env.CODEMAX_LOCAL_TOKEN;
    if (explicit) {
      try {
        if (!/^sk-local-[a-f0-9]{64}$/.test(explicit)) return undefined;
        return {token:explicit,baseUrl:normalizeCodemaxURL(this.config.baseUrl || process.env.CODEMAX_BASE_URL || 'http://127.0.0.1:7331/v1')};
      } catch { return undefined; }
    }
    return readCodemaxConnection();
  }
  isAvailable(): boolean { return !!this.connection(); }
  getModelDiscoveryError(): string | undefined {
    return this.discoveryError || (!this.connection() ? 'Start Codemax and its local gateway. No provider API key is needed.' : undefined);
  }
  listModels(): CodemaxModel[] {
    const connection = this.connection();
    if (connection && createHash('sha256').update(connection.baseUrl+'\0'+connection.token).digest('hex') !== this.identity) {this.models=[];this.expiry=0;this.etag='';this.sessions.clear();}
    if (!connection) { this.models = []; this.expiry = 0; return []; }
    if (Date.now() >= this.expiry) { void this.refreshModels(); return []; }
    return this.models.map(m => ({...m,reasoningModes:m.reasoningModes.map(x=>({...x})),tokenizer:{...m.tokenizer},reasoningLevels:[...m.reasoningLevels]}));
  }
  async refreshModels(force = false): Promise<void> {
    if (this.refreshInFlight) return this.refreshInFlight;
    if (!force && (Date.now() < this.expiry || Date.now() < this.retryDiscoveryAfter)) return;
    this.refreshInFlight = this.refreshCatalog().catch(() => {
      this.models = []; this.expiry = 0; this.etag = ''; this.retryDiscoveryAfter = Date.now() + 5000;
      this.discoveryError = 'Codemax catalog is unavailable or invalid. Open Codemax and refresh discovery.';
    }).finally(() => {this.refreshInFlight = undefined;});
    return this.refreshInFlight;
  }
  private async refreshCatalog(): Promise<void> {
    this.retryDiscoveryAfter = 0;
    const c = this.connection(); if (!c) throw new Error('Missing local connection');
    const identity = createHash('sha256').update(c.baseUrl + '\0' + c.token).digest('hex');
    if (identity !== this.identity) {this.models=[];this.etag='';this.expiry=0;this.sessions.clear();this.identity=identity;}
    const headers = new Headers({Authorization:`Bearer ${c.token}`});
    if (this.etag) headers.set('If-None-Match',this.etag);
    const response = await fetch(c.baseUrl+'/models',{headers,redirect:'error',signal:AbortSignal.timeout(5000)});
    if (response.status === 304 && this.etag) {
      const current=this.connection(); if(!current || current.baseUrl!==c.baseUrl || current.token!==c.token)throw new Error('Connection changed');
      this.expiry=Date.now()+TTL_MS;this.discoveryError=undefined;return;
    }
    if (!response.ok || !response.body || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Catalog rejected');
    const reader=response.body.getReader(); let size=0; const chunks:Uint8Array[]=[];
    try {for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>MAX_CATALOG_BYTES)throw new Error('Catalog limit');chunks.push(part.value);}}
    finally {await reader.cancel().catch(()=>{});reader.releaseLock();}
    const parsed=parseCodemaxModels(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks))));
    const current=this.connection();if(!current || current.baseUrl!==c.baseUrl || current.token!==c.token)throw new Error('Connection changed');
    this.models=parsed; const etag=response.headers.get('etag');this.etag=etag && /^"[a-f0-9]{64}"$/.test(etag)?etag:'';
    this.expiry=Date.now()+TTL_MS;this.discoveryError=undefined;
  }
  async *streamResponse(request: StreamRequest): AsyncGenerator<ProviderEvent> {
    const lock = request.sessionId || '';
    if (lock && this.active.has(lock)) {yield {type:'error',error:'This Codemax conversation already has an active request.'};return;}
    if (lock) this.active.add(lock);
    let controller:AbortController|undefined;
    try {
      await this.refreshModels(true);
      const model=this.models.find(m=>m.id===request.model);
      const c=this.connection();if(!c||!model||Date.now()>=this.expiry||createHash('sha256').update(c.baseUrl+'\0'+c.token).digest('hex')!==this.identity)throw new Error('Unavailable model or changed local connection');
      const requested = request.reasoningLevel?.trim().toLowerCase();
      const candidates = requested ? model.reasoningModes.filter(m=>m.value.toLowerCase()===requested) : [];
      if(requested && candidates.length!==1)throw new Error('Unobserved or ambiguous reasoning level');
      const reasoningValue=candidates[0]?.value;
      if(request.fastMode || request.temperature !== undefined)throw new Error('Unobserved generation parameter');
      const key=request.sessionId?request.sessionId+'\0'+request.model+'\0'+(request.providerConversationRevision??0):'';
      if(request.forceFreshConversation && key)this.sessions.delete(key);
      const headers=new Headers({Authorization:`Bearer ${c.token}`,'Content-Type':'application/json'});
      const session=key?this.sessions.get(key):undefined;if(session)headers.set('X-Bridge-Session',session);
      const messages=encodeCodemaxMessages(request.messages);
      if(request.systemPrompt)messages.unshift({role:'system',content:request.systemPrompt});
      const payload={model:request.model,messages,stream:true,
        ...(request.maxTokens && {max_tokens:request.maxTokens}),
        ...(reasoningValue && {reasoning_effort:reasoningValue}),
        ...(request.tools?.length && {tools:request.tools.map(t=>({type:'function',function:{name:t.name,description:t.description,parameters:t.inputSchema}}))})};
      const body=JSON.stringify(payload);if(Buffer.byteLength(body)>262144)throw new Error('Request limit');
      controller=new AbortController();
      const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(3600000),...(request.signal?[request.signal]:[])]);
      const response=await fetch(c.baseUrl+'/chat/completions',{method:'POST',headers,body,signal,redirect:'error'});
      if(!response.ok||!response.body||!response.headers.get('content-type')?.includes('text/event-stream'))throw new Error('Generation rejected');
      const returned=response.headers.get('x-bridge-session');
      if(key&&returned&&/^[A-Za-z0-9_-]{1,128}$/.test(returned)){
        this.sessions.delete(key);this.sessions.set(key,returned);
        if(this.sessions.size>256)this.sessions.delete(this.sessions.keys().next().value!);
      }
      const offered = new Set((request.tools ?? []).map(tool => tool.name));
      const tools=new Map<number,{id:string;name:string;bytes:number;arguments:string}>();let finish:ProviderEvent['finishReason'];let done=false;
      for await(const event of codemaxSSE(response.body,signal)){
        if(!record(event))throw new Error('Invalid stream event');
        if(event.codemax_done){done=true;break;}
        if(event.error)throw new Error('Gateway error');
        if(Array.isArray(event.choices))for(const choice of event.choices){
          if(!record(choice)||choice.index!==0)continue;
          const delta=record(choice.delta)?choice.delta:{};
          if(typeof delta.content==='string')yield {type:'content_delta',content:delta.content};
          if(typeof delta.reasoning_content==='string')yield {type:'thinking_delta',thinking:delta.reasoning_content};
          if(Array.isArray(delta.tool_calls))for(const call of delta.tool_calls){
            if(!record(call)||!Number.isSafeInteger(call.index)||call.index<0||call.index>31)throw new Error('Invalid tool index');
            let tool=tools.get(call.index);const fn=record(call.function)?call.function:{};
            if(!tool){
              if(!clean(call.id,128)||!clean(fn.name,128)||!offered.has(fn.name)||[...tools.values()].some(t=>t.id===call.id))throw new Error('Invalid or unoffered tool identity');
              tool={id:call.id,name:fn.name,bytes:0,arguments:''};tools.set(call.index,tool);
              yield {type:'tool_use_start',toolCallId:tool.id,toolName:tool.name};
            } else if((call.id&&call.id!==tool.id)||(fn.name&&fn.name!==tool.name))throw new Error('Tool identity changed');
            if(typeof fn.arguments==='string'){
              tool.bytes+=Buffer.byteLength(fn.arguments);if(tool.bytes>65536)throw new Error('Tool argument limit');
              tool.arguments+=fn.arguments;
              yield {type:'tool_use_delta',toolCallId:tool.id,toolInput:fn.arguments};
            }
          }
          if(choice.finish_reason!=null){
            if(!['stop','tool_calls','length'].includes(choice.finish_reason))throw new Error('Unsupported finish reason');
            finish=choice.finish_reason==='tool_calls'?'tool_use':choice.finish_reason==='length'?'max_tokens':'end_turn';
          }
        }
        // The gateway currently estimates tokens. Do not feed estimates into Kory's provider-reported billing channel.
      }
      if(!done||!finish)throw new Error('Unfinished generation');
      if ((tools.size>0) !== (finish==='tool_use')) throw new Error('Incomplete or inconsistent tool finish');
      for(const tool of tools.values())if(!record(JSON.parse(tool.arguments)))throw new Error('Tool arguments must be a complete JSON object');
      for(const tool of tools.values())yield {type:'tool_use_stop',toolCallId:tool.id};
      yield {type:'complete',finishReason:finish};
    } catch {
      yield {type:'error',error:request.signal?.aborted?'Codemax generation cancelled.':'Codemax could not complete this request. Check the website, selected model, and connection; no request was replayed.'};
    } finally {controller?.abort();if(lock)this.active.delete(lock);}
  }
}
