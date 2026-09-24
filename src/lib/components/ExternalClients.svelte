<script lang="ts">
  import {onDestroy} from 'svelte';import {app} from '../state/app.svelte';import * as bridge from '../api/bridge';import Icon from './Icon.svelte';
  import {privateLaunch,buildOpencodeConfig} from '../launch-command';import {catalogLookup,formatTokens,formatPlans} from '../model-catalog';import {modelReady,modelStatus} from '../format';
 type Client='opencode'|'claude'|'chat'|'responses'|'messages'|'koryphaios';
 let alive=true;let setupBusy=$state(false),setupMessage=$state(''),setupError=$state(false);
 let probing=$state(false),probeMessage=$state(''),probeFailed=$state(false);let timer:ReturnType<typeof setTimeout>;
 const client=$derived<Client>(app.preferences.harness||'opencode');
 const sh=(value:string)=>"'"+value.replaceAll("'","'\\''")+"'";
 const endpoint=$derived(`http://127.0.0.1:${app.snapshot?.api.port??7331}`);
  const choice=$derived(app.clientModel?app.exposedModels.find(m=>m.id===app.clientModel):app.exposedModels.find(m=>m.id===app.preferences.default_model)||app.exposedModels[0]);
  const docs=$derived(choice?catalogLookup(choice.id,choice.display_name):null);
  const model=$derived(choice?.id||'');
  const running=$derived(app.ready&&app.snapshot?.api.running===true);
  const fallback=$derived(app.host.code==='FALLBACK_MODE');
 const formatNames:Record<Client,string>={koryphaios:'Koryphaios',opencode:'OpenCode',claude:'Claude Code',chat:'Chat API',responses:'Responses API',messages:'Messages API'};
 // Multi-choice opencode model set. Auto-selection mirrors the exposed
 // registry; once the user toggles anything explicitly, that manual set
 // rules (pruned only when models disappear). Explicit picks may include
 // observed-but-not-yet-servable models so fallback browsing can still
 // produce a config; the gateway refuses unservable models at request time.
 let picked=$state<string[]>([]);let pickerTouched=$state(false);
 $effect(()=>{
  const valid=new Set(app.models.map(m=>m.id));
  if(!pickerTouched){
   const auto=app.exposedModels.map(m=>m.id).filter(id=>valid.has(id));
   if(auto.join(' ')!==picked.join(' '))picked=auto;
  }else if(picked.some(id=>!valid.has(id)))picked=picked.filter(id=>valid.has(id));
 });
 const included=$derived(app.models.filter(m=>picked.includes(m.id)));
 // Default model for opencode.json. The provider always carries the whole
 // multi-selected set; the default is just a starting point. An explicit
 // single-model choice is never silently replaced: when it is set but
 // unavailable (or not included) there is no default and saving disables.
 // With no explicit choice the default is the auto choice when included,
 // otherwise the first included model.
 const opencodeDefault=$derived(app.clientModel?model:(model&&picked.includes(model)?model:picked[0]||''));
 const defaultIncluded=$derived(!opencodeDefault||included.some(m=>m.id===opencodeDefault));
 const opencodeValid=$derived(!!opencodeDefault&&included.length>0&&(!app.clientModel||defaultIncluded));
 const config=$derived.by(()=>{
  if(client!=='opencode'||!opencodeValid)return {$schema:'https://opencode.ai/config.json',model:'',provider:{codemax:{npm:'@ai-sdk/openai-compatible',name:'Codemax websites',options:{baseURL:`${endpoint}/v1`,apiKey:'{env:CODEMAX_API_KEY}'},models:{}}}};
  return buildOpencodeConfig(endpoint,opencodeDefault,included.map(m=>({id:m.id,providerLabel:m.provider.label,displayName:m.display_name})));
 });
 function togglePick(id:string,on:boolean){pickerTouched=true;picked=on?(picked.includes(id)?picked:[...picked,id]):picked.filter(x=>x!==id);}
 const filename=$derived(client==='koryphaios'?'Automatic local connection':client==='opencode'?'opencode.json':client==='claude'?'Start Claude Code · Bash':'Streaming request · Bash');
 const snippet=$derived.by(()=>{
  const id=client==='opencode'?opencodeDefault:model;
  if(!id)return '';
  if(client==='koryphaios')return '1. Keep Codemax and its local gateway running.\n2. Open Koryphaios with the included Codemax provider integration installed.\n3. Select Codemax websites, then your detected model.\n\nThe integration reads Codemax’s private connection file and refreshes its model catalog.\nNo provider key, terminal command, or secret copying is required.';
  if(client==='opencode')return JSON.stringify(config,null,2);
  if(client==='claude')return `read -rsp 'Codemax local key: ' ANTHROPIC_AUTH_TOKEN; echo\nexport ANTHROPIC_AUTH_TOKEN\nexport ANTHROPIC_BASE_URL='${endpoint}'\nexport ANTHROPIC_MODEL=${sh(model)}\nexport ANTHROPIC_DEFAULT_HAIKU_MODEL=${sh(model)}\nexport ANTHROPIC_DEFAULT_SONNET_MODEL=${sh(model)}\nexport ANTHROPIC_DEFAULT_OPUS_MODEL=${sh(model)}\nclaude`;
  const path=client==='chat'?'/v1/chat/completions':client==='responses'?'/v1/responses':'/v1/messages';
  const payload=client==='responses'?{model,input:'Explain how you will approach a code review.',stream:true}:client==='messages'?{model,max_tokens:1024,stream:true,messages:[{role:'user',content:'Explain how you will approach a code review.'}]}:{model,stream:true,messages:[{role:'user',content:'Explain how you will approach a code review.'}]};
  return `read -rsp 'Codemax local key: ' CODEMAX_API_KEY; echo\nexport CODEMAX_API_KEY\ncurl --no-buffer '${endpoint}${path}' \\\n  -H "Authorization: Bearer $CODEMAX_API_KEY" \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Bridge-Session: terminal-review' \\\n${client==='messages'?"  -H 'anthropic-version: 2023-06-01' \\\n":''}  --data ${sh(JSON.stringify(payload))}`;
 });
 const startCommand="read -rsp 'Codemax local key: ' CODEMAX_API_KEY; echo\nexport CODEMAX_API_KEY\nopencode";
 async function reveal(){if(app.secret){app.secret='';clearTimeout(timer);return;}const result=await app.perform<{token:string}>('key.reveal');if(result){app.secret=result.token;clearTimeout(timer);timer=setTimeout(()=>app.secret='',30000);}}
 async function copyKey(){const result=await app.perform<{token:string}>('key.reveal');if(result)await app.clipboard(result.token);}
 async function probe(){
  if(probing||!running)return;probing=true;probeMessage='';probeFailed=false;
  try{const result=await bridge.probe();if(!result.healthy)throw Error('GATEWAY_HEALTH_FAILED');probeMessage=`Local gateway reachable in ${result.round_trip_ms} ms. No website prompt was sent.`;}
  catch(error){probeFailed=true;probeMessage='The local connection check failed. Check the gateway settings and retry.';app.error=String(error);}finally{probing=false;}
 }
 function stop(){void app.ask('Stop the local gateway?','Connected client requests will be cancelled. Browser tabs and website logins will stay open.','Stop gateway',()=>app.perform('api.stop'));}
 // A port/host change invalidates the old health result; it is not a live probe.
 let checkedEndpoint='';$effect(()=>{const fingerprint=`${endpoint}:${running}`;if(checkedEndpoint!==fingerprint){checkedEndpoint=fingerprint;probeMessage='';probeFailed=false;}});

 async function prepareAndCopy(){
  const need=client==='opencode'?opencodeDefault:model;
  if(setupBusy||!app.ready||!need)return;
  if(client==='opencode'&&(!opencodeValid||(app.clientModel&&!choice)))return;
  const selected={client,model:need,endpoint,config};setupBusy=true;setupError=false;setupMessage='Checking the local connection…';
   try{
    if(fallback)throw Error('The local gateway needs the Zag backend, which runs on Linux x86_64. This Mac runs browsing-only mode: browse, sign in, and detect website models here.');
    if(!running&&await app.perform('api.start')===undefined)throw Error('Could not start the local connection.');
   const health=await bridge.probe();if(!health.healthy)throw Error('Local connection check failed.');
   if(!alive||!app.ready||selected.client!==client||selected.model!==need||selected.endpoint!==endpoint)throw Error('The connection changed. Review your selection and try again.');
   if(client==='opencode'&&!opencodeValid)throw Error('The selected opencode models changed. Review the include list and try again.');
   if(selected.client==='koryphaios'){setupMessage='Local gateway ready. In Koryphaios, select Codemax websites. Requires the included Koryphaios integration; no secret was copied.';return;}
   const credentials=await app.perform<{token:string}>('key.reveal');if(!credentials)throw Error('Local access key unavailable.');
   const command=privateLaunch(selected.client,selected.endpoint,selected.model,credentials.token,selected.config);
   if(!alive||!app.ready||selected.model!==need||selected.client!==client||selected.endpoint!==endpoint)throw Error('The connection changed before copying. Try again.');
   await bridge.copy(command);
   setupMessage='Launch command copied. Paste it into a terminal in your project. Keep Codemax open.';
  }catch(error){setupError=true;setupMessage=error instanceof Error?error.message:String(error);}
  finally{setupBusy=false;}
 }
 let selectionSignature='';$effect(()=>{const signature=`${client}|${model}|${endpoint}`;if(selectionSignature!==signature){selectionSignature=signature;if(!setupBusy)setupMessage='';}});
 onDestroy(()=>{alive=false;clearTimeout(timer);app.secret='';});
</script>
<section class="quick-connect" aria-label="Simple client connection">
  <div class="quick-connection-status"><span class="dot" class:online={running}></span><span>{!app.ready?'Reconnect Codemax to continue':running?'Local gateway ready':fallback?'No gateway in browsing-only mode':'Ready to set up'}</span></div>
 <label class="field"><span>Coding client</span><select aria-label="Quick coding client" value={client} disabled={!app.ready||setupBusy} onchange={e=>app.settings({harness:e.currentTarget.value as Client})}><option value="koryphaios">Koryphaios</option><option value="opencode">OpenCode</option><option value="claude">Claude Code</option><option value="chat">Other · Chat Completions</option><option value="responses">Other · Responses API</option><option value="messages">Other · Messages API</option></select></label>
  <label class="field"><span>Website model</span><select aria-label="Quick website model" value={app.clientModel||model} disabled={!app.ready||setupBusy||!app.exposedModels.length} onchange={e=>app.clientModel=e.currentTarget.value}>{#if !model}<option value="">Choose an available model</option>{/if}{#each app.exposedModels as m(m.id)}<option value={m.id}>{m.provider.label} / {m.display_name}</option>{/each}</select></label>
  {#if docs&&(docs.contextTokens||docs.reasoning!==null)}<p class="field-hint">Vendor docs{docs.contextSource?` · ${docs.contextSource.retrieved}`:''}:{#if docs.contextTokens} {formatTokens(docs.contextTokens)} context (advertised; website budget unmeasured){/if}{#if docs.reasoning!==null} · reasoning {docs.reasoning?'supported':'not advertised'}{#if docs.reasoningNote} · {docs.reasoningNote}{/if}{/if}{#if docs.plans} · exposed on {formatPlans(docs.plans)}{#if docs.planNote} ({docs.planNote}){/if}{/if}.</p>{/if}
 {#if app.clientModel&&!choice}<p class="note warning">Your selected model is unavailable. Choose another explicitly; no automatic replacement.</p>{/if}
  {#if fallback}<div class="note"><Icon name="globe" size={16}/><div>The local gateway needs the Zag backend (Linux x86_64). On this Mac, Codemax browses, signs in, and lists observed website models; coding-client connections stay off.</div></div>{/if}
  {#if !app.models.length}<p class="connect-empty">Visit an AI chat website and sign in. Your available models appear here automatically.</p><button class="secondary" onclick={()=>app.newTab()}>Browse a website</button>{:else}
  <button class="primary launch-connect" disabled={!app.ready||setupBusy||fallback||(client==='opencode'?!opencodeValid:!model)} title={fallback?'Unavailable in browsing-only mode':undefined} onclick={prepareAndCopy}>{#if setupBusy}<span class="spinner"></span>{:else}<Icon name="copy" size={15}/>{/if}{setupBusy?'Preparing…':client==='koryphaios'?'Connect Koryphaios':client==='opencode'||client==='claude'?'Copy private launch command':'Copy private test request'}</button>
 {#if client==='koryphaios'}<p class="field-hint">The included Koryphaios integration discovers this gateway and its available models on this computer. Existing installations need the integration applied first.</p>{:else}
 <p class="field-hint">Starts and checks the gateway. Requires {client==='opencode'?'OpenCode':client==='claude'?'Claude Code':'curl'} installed. No provider key, no config file editing.</p>
 <p class="private-command-note"><Icon name="lock" size={12}/>Includes your local access key. Paste only into your terminal; clipboard and terminal history may retain it.</p>{/if}
 {/if}
 {#if setupMessage}<p class="setup-result" class:danger-text={setupError} role="status">{setupMessage}</p>{/if}
 {#if client==='claude'}<p class="field-hint compatibility-note">Non-Claude website models may not support every Claude Code feature. This does not certify vendor compatibility.</p>{/if}
 <div class="connect-checklist"><Icon name="globe" size={14}/><span>Website account → Codemax → your coding client</span></div>
</section>
<details class="connection-advanced" aria-label="Advanced client configuration"><summary>Advanced setup and connection details</summary>
<div class="connection-layout">
 <div class="connection-main">
 <section class="section"><div class="section-title"><h2>1. Choose your client</h2><span class="tag">Website quota</span></div>
  <div class="segmented" aria-label="Client format">{#each ['koryphaios','opencode','claude'] as id}<button class:active={client===id} aria-pressed={client===id} disabled={!app.ready||app.busy('settings.update')} onclick={()=>app.settings({harness:id as Client})}>{formatNames[id as Client]}</button>{/each}</div>
  <details class="advanced-client client-formats" open={['chat','responses','messages'].includes(client)}><summary>Other clients · protocol examples</summary><div class="segmented">{#each ['chat','responses','messages'] as id}<button class:active={client===id} aria-pressed={client===id} disabled={!app.ready||app.busy('settings.update')} onclick={()=>app.settings({harness:id as Client})}>{formatNames[id as Client]}</button>{/each}</div><p class="field-hint">Use a protocol your client supports. These are example requests, not one-click installers.</p></details>
  <label class="field"><span>Website model</span><select aria-label="Client model" value={app.clientModel||model} disabled={!app.ready||!app.exposedModels.length} onchange={e=>app.clientModel=e.currentTarget.value}>{#if !model}<option value="">Select an available model</option>{/if}{#each app.exposedModels as m(m.id)}<option value={m.id}>{m.provider.label} / {m.display_name}</option>{/each}</select></label>
  {#if app.clientModel&&!choice}<div class="note warning" role="status">Your previous selection is no longer available. Choose a model above; Codemax will not switch it silently.</div>{/if}
  {#if !app.exposedModels.length}<div class="note"><Icon name="globe" size={16}/><div>There are no ready, enabled models yet. <button class="text-button" onclick={()=>app.navigate('providers')}>Review providers</button> or <button class="text-button" onclick={()=>app.newTab()}>open a website</button>.</div></div>{/if}
 </section>
  <section class="section"><div class="section-title"><h2>2. Start the local connection</h2><span class="tag" class:ready={running}><span class="dot" class:online={running}></span>{!app.ready?'Disconnected':running?'Ready':fallback?'Unavailable':'Stopped'}</span></div>
   {#if fallback}<p>The local gateway is part of the Zag backend, which runs on Linux x86_64. In browsing-only mode there is nothing to start here; website browsing and model detection above keep working.</p>{:else}
   <p>Your client talks to Codemax on this computer. Codemax sends requests through your signed-in website—not a paid provider API.</p>
   <div class="button-group" style="margin-top:15px">{#if running}<button class="secondary" onclick={probe} disabled={probing}>{probing?'Checking…':'Check connection'}</button><button class="text-button" onclick={stop} disabled={app.busy('api.stop')}>Stop gateway</button>{:else}<button class="primary" disabled={!app.ready||app.busy('api.start')} onclick={()=>app.perform('api.start')}>{app.busy('api.start')?'Starting…':'Start gateway'}</button>{/if}<button class="text-button" onclick={()=>app.settingsPage('gateway')}>Gateway settings</button></div>
   {/if}
  {#if probeMessage}<p class="connection-result" class:danger-text={probeFailed} role="status">{probeMessage} Website access and client interoperability are separate checks.</p>{/if}
 </section>
  <section class="section"><div class="section-title"><h2>3. Configure {formatNames[client]}</h2>{#if client==='opencode'}<button class="text-button" disabled={!app.ready||!opencodeValid} onclick={()=>app.export('opencode.json',config)}><Icon name="download" size={14}/>Save config</button>{/if}</div>
  {#if client==='opencode'&&app.models.length}
  <div class="field"><span>Models to include in opencode.json</span>
  <p class="field-hint">Choose every website model OpenCode may use — the provider carries the whole set. An explicitly chosen default above must stay included and is never replaced silently; otherwise the first included model is the default.</p></div>
  {#each app.models as m(m.id)}
  {@const servable=modelReady(m,m.provider)}
  {@const badge=servable?'Ready':fallback?'Observed on this Mac · unverified':modelStatus(m,m.provider)}
  {@const locked=!fallback&&!(m.enabled&&m.provider.exposed)}
  <label class="setting-line"><div><strong>{m.provider.label} / {m.display_name}</strong><p>{badge}{m.provider.state!=='READY'&&!fallback?` · ${m.provider.state==='CANDIDATE'?'inspecting chat controls':m.provider.state.toLowerCase()}`:''}</p></div><input type="checkbox" aria-label={`Include ${m.display_name} in opencode config`} checked={picked.includes(m.id)} disabled={locked||!app.ready} onchange={e=>togglePick(m.id,e.currentTarget.checked)} /></label>
  {/each}
  {#if included.length>0&&!included.some(m=>modelReady(m,m.provider))}<p class="note warning">None of the selected models are currently servable by the local gateway. The config still saves; requests will fail until a website session is ready.</p>{/if}
  {#if opencodeDefault&&!defaultIncluded}<p class="note warning">The default website model is not included above. Include it or choose another default.</p>{/if}
  {/if}
  {#if client==='opencode'?opencodeDefault:model}
   <p class="connection-instruction">{client==='koryphaios'?'The gateway publishes a private connection descriptor for Koryphaios. Metadata is refreshed with a short, authorization-scoped cache.':client==='opencode'?'Save this in your project, or merge the provider entry into your existing opencode.json. Do not replace an existing configuration without reviewing it.':client==='claude'?'Run this in a Bash terminal, then paste the copied local key at the prompt. It only changes that terminal’s environment.':'Run this example in a Bash terminal and paste the copied local key at the prompt.'}</p>
   {#if client==='opencode'}<p class="field-hint">To skip launch commands: save the config once, merge it with <code>node scripts/opencode-merge.mjs --from opencode.json</code> (backs up first, keeps your other providers), and export <code>CODEMAX_API_KEY</code> once in your shell profile.</p>{/if}
   <div class="code-panel"><div class="code-heading"><Icon name={client==='opencode'?'folder':'terminal'} size={13}/><span>{filename}</span><button class="text-button" disabled={!app.ready} onclick={()=>app.clipboard(snippet)}><Icon name="copy" size={13}/>Copy</button></div><pre>{snippet}</pre></div>
   {#if client==='chat'||client==='responses'||client==='messages'}
   <label class="field"><span>Endpoint URL</span><div class="readout"><code>{client==='messages'?endpoint:`${endpoint}/v1`}</code><button class="icon-button" aria-label="Copy custom API endpoint" disabled={!app.ready} onclick={()=>app.clipboard(client==='messages'?endpoint:`${endpoint}/v1`)}><Icon name="copy" size={14}/></button></div><span class="field-hint">{client==='messages'?'Anthropic-compatible clients append /v1/messages themselves.':'OpenAI-compatible clients use this base URL directly.'}</span></label>
   <div class="field"><span>API key · local gateway token</span><div class="readout"><code>{app.secret||'Hidden — reveal or copy explicitly'}</code><button class="icon-button" aria-label={app.secret?'Hide custom API key':'Reveal custom API key'} disabled={!app.ready} onclick={reveal}><Icon name={app.secret?'close':'eye'} size={15}/></button><button class="icon-button" aria-label="Copy custom API key" disabled={!app.ready} onclick={copyKey}><Icon name="copy" size={14}/></button></div><span class="field-hint">Send as <code>Authorization: Bearer</code> — the same key the example request uses. Revealed keys disappear after 30 seconds or when you leave this page.</span></div>
   {/if}
  {#if client==='opencode'}<div class="code-panel launch-command"><div class="code-heading"><Icon name="terminal" size={13}/><span>Start OpenCode · Bash</span><button class="text-button" disabled={!app.ready} onclick={()=>app.clipboard(startCommand)}>Copy setup command</button></div><pre>{startCommand}</pre></div>{/if}
  {#if client!=='koryphaios'}<div class="button-group" style="margin-top:14px"><button class="secondary" disabled={!app.ready||app.busy('key.reveal')} onclick={copyKey}><Icon name="key" size={14}/>Copy local key</button><span class="field-hint">Paste at the terminal prompt. It will not be displayed or saved in the config.</span></div>{/if}
  {#if client==='claude'}<div class="note"><Icon name="alert" size={16}/><span>This non-Claude model connection is not vendor-supported. Actual compatibility depends on the website model and Claude Code’s protocol requirements.</span></div>{/if}
 {:else}<p class="muted">Configuration appears when a website model is ready. Nothing needs to be copied yet.</p>{/if}
 <details class="advanced-client"><summary>Manual connection details · endpoint and local access token</summary>
  <label class="field"><span>Local gateway endpoint</span><div class="readout"><code>{client==='claude'||client==='messages'?endpoint:`${endpoint}/v1`}</code><button class="icon-button" aria-label="Copy API endpoint" disabled={!app.ready} onclick={()=>app.clipboard(client==='claude'||client==='messages'?endpoint:`${endpoint}/v1`)}><Icon name="copy" size={14}/></button></div></label>
  <div class="field"><span>Local access token · not a provider credential</span><div class="readout"><code>{app.secret||'Hidden — reveal or copy explicitly'}</code><button class="icon-button" aria-label={app.secret?'Hide API key':'Reveal API key'} disabled={!app.ready} onclick={reveal}><Icon name={app.secret?'close':'eye'} size={15}/></button><button class="icon-button" aria-label="Copy API key" disabled={!app.ready} onclick={copyKey}><Icon name="copy" size={14}/></button></div><span class="field-hint">Revealed keys disappear after 30 seconds or when you leave this page.</span></div>
  <p class="field-hint">Use the same session identifier for continuation. Some clients cache their model catalog; refresh or update their config after changing exposed models.</p>
 </details></section>
 </div>
 <aside class="connection-help"><h3>What happens next</h3><p>Keep Codemax running. Select your website model in the client and send a request.</p><p>The website tab’s ring spins while working and stays still when idle.</p><button class="text-button" onclick={()=>app.navigate('sessions')}>View client sessions<Icon name="arrow" size={13}/></button><hr/><h3>Who runs tools?</h3><p>Your coding client runs tools using its own permissions. Codemax’s separate website tool tasks require MCP setup and your approval.</p><button class="text-button" onclick={()=>app.navigate('tools')}>Tools & permissions<Icon name="arrow" size={13}/></button><hr/><p class="field-hint">Website quotas still apply. No sign-in credentials are copied out of the browser.</p></aside>
</div>

</details>
