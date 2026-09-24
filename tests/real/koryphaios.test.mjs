// Direct tests of production connection-file, catalog, message and SSE code.
// No synthetic HTTP provider or harness server; these are not an end-to-end integration claim.
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {normalizeCodemaxURL,readCodemaxConnection,parseCodemaxModels,encodeCodemaxMessages,codemaxSSE,CodemaxProvider} from '../../build/koryphaios/codemax.mjs';
const token='sk-local-'+ 'e'.repeat(64);
function descriptor(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'codemax-connection-'));fs.chmodSync(dir,0o700);const file=path.join(dir,'connection.json');const data={version:1,backend:'zag',running:true,base_url:'http://127.0.0.1:7331/v1',token};fs.writeFileSync(file,JSON.stringify(data),{mode:0o600});try{return fn(file,dir,data);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
const catalog=data=>({object:'list',codemax_catalog_version:1,data});
const model=fields=>({id:'p1/observed-model',object:'model',display_name:'Observed model',context:{nominal:null,source:'UNKNOWN'},reasoning:{supported:null,control_observed:false,modes:[]},tools:'emulated',...fields});
const stream=chunks=>new ReadableStream({start(c){for(const chunk of chunks)c.enqueue(typeof chunk==='string'?new TextEncoder().encode(chunk):chunk);c.close();}});
async function collect(s,signal){const out=[];for await(const e of codemaxSSE(s,signal))out.push(e);return out;}
test('connection: reads an actual private descriptor',()=>descriptor((file)=>assert.deepEqual(readCodemaxConnection(file),{baseUrl:'http://127.0.0.1:7331/v1',token})));
test('connection: private token rotation is observed without cache',()=>descriptor((file,dir,data)=>{assert.equal(readCodemaxConnection(file).token,token);data.token='sk-local-'+'a'.repeat(64);fs.writeFileSync(file,JSON.stringify(data));assert.equal(readCodemaxConnection(file).token,data.token);}));
test('connection: group-readable token refused',()=>descriptor(file=>{fs.chmodSync(file,0o640);assert.equal(readCodemaxConnection(file),undefined);}));
test('connection: group-writable parent refused',()=>descriptor((file,dir)=>{fs.chmodSync(dir,0o770);assert.equal(readCodemaxConnection(file),undefined);}));
test('connection: symlink and hardlink refused',()=>descriptor((file,dir)=>{const link=path.join(dir,'link');fs.symlinkSync(file,link);assert.equal(readCodemaxConnection(link),undefined);fs.unlinkSync(link);fs.linkSync(file,link);assert.equal(readCodemaxConnection(file),undefined);}));
test('connection: stopped and incompatible descriptors refused',()=>descriptor((file,dir,data)=>{for(const changes of [{running:false},{version:2},{backend:'preview'},{token:'sk-local-short'}]){fs.writeFileSync(file,JSON.stringify({...data,...changes}));assert.equal(readCodemaxConnection(file),undefined);}}));
test('connection: malformed, oversized and non-UTF8 bytes refused',()=>descriptor(file=>{for(const bytes of ['{', 'x'.repeat(4097),Buffer.from([255,254])]){fs.writeFileSync(file,bytes);assert.equal(readCodemaxConnection(file),undefined);}}));
test('connection: remote redirects cannot be configured',()=>{for(const url of ['https://127.0.0.1:7331/v1','http://localhost:7331/v1','http://example.com:7331/v1','http://user:pass@127.0.0.1:7331/v1','http://127.0.0.1:7331/v1?token=x','http://2130706433:7331/v1','http://127.1:7331/v1','http://127.0.0.1:7331/path/../v1'])assert.throws(()=>normalizeCodemaxURL(url),undefined,url);});
test('catalog: empty means empty, not a manufactured model',()=>assert.deepEqual(parseCodemaxModels(catalog([])),[]));
test('catalog: unknown context/output limits remain zero sentinels, not guessed sizes',()=>{const m=parseCodemaxModels(catalog([model({})]))[0];assert.equal(m.contextWindow,0);assert.equal(m.maxOutputTokens,0);assert.equal(m.contextVerified,false);assert.deepEqual(m.reasoningLevels,[]);assert.equal(m.tokenizer.exact_counting,false);});
test('catalog: exact observed reasoning values retained',()=>{const m=parseCodemaxModels(catalog([model({reasoning:{control_observed:true,supported:true,modes:[{value:'Deep Think',label:'Deep Think'},{value:'Max',label:'Max'}]}})]))[0];assert.deepEqual(m.reasoningLevels,['Deep Think','Max']);});
test('catalog: mode names without a discovered control do not become actions',()=>assert.deepEqual(parseCodemaxModels(catalog([model({reasoning:{supported:true,modes:[{value:'high',label:'high'}]}})]))[0].reasoningLevels,[]));
test('catalog: Auto Thinking Fast surface as the native reasoning toggle for each model',()=>{
  const modes=[{value:'Auto',label:'Auto'},{value:'Thinking',label:'Thinking'},{value:'Fast',label:'Fast'}];
  const models=parseCodemaxModels(catalog([
    model({id:'p1/glm-4.6',display_name:'GLM-4.6',reasoning:{control_observed:true,supported:true,modes}}),
    model({id:'p1/glm-4.5',display_name:'GLM-4.5',reasoning:{control_observed:true,supported:true,modes}}),
  ]));
  assert.equal(models.length,2,'two models, not five: modes are not models');
  for(const m of models){
    assert.equal(m.canReason,true,'reasoning toggle available');
    assert.deepEqual(m.reasoningLevels,['Auto','Thinking','Fast'],'harness native reasoning toggle');
    assert.deepEqual(m.reasoningModes,modes);
  }
  assert.ok(!models.some(m=>/^(auto|thinking|fast)$/i.test(m.id)),'no phantom Auto/Thinking/Fast models');
});
test('catalog: only observed numeric context is trusted, not a user override',()=>{for(const source of ['WEBSITE_REPORTED','USER_OVERRIDE']){const m=parseCodemaxModels(catalog([model({context:{nominal:131072,source}})]))[0];assert.equal(m.contextWindow,131072);assert.equal(m.contextVerified,source==='WEBSITE_REPORTED');}});
test('catalog: duplicate IDs and invalid framing rejected',()=>{assert.throws(()=>parseCodemaxModels(catalog([model({}),model({})])));assert.throws(()=>parseCodemaxModels({object:'list',data:[]}));assert.throws(()=>parseCodemaxModels(catalog([model({id:'unsafe\nname'})])));});
test('messages: real wire serialization preserves system, IDs and arguments',()=>{const m=encodeCodemaxMessages([{role:'assistant',content:'',tool_calls:[{id:'c1',name:'read_file',input:{path:'notes.txt'}}]},{role:'tool',content:[{type:'text',text:'actual tool output'}],tool_call_id:'c1'}]);assert.equal(m[1].tool_call_id,'c1');assert.equal(m[1].content,'actual tool output');assert.deepEqual(JSON.parse(m[0].tool_calls[0].function.arguments),{path:'notes.txt'});});
test('messages: unsupported non-text blocks are not silently dropped',()=>assert.throws(()=>encodeCodemaxMessages([{role:'user',content:[{type:'image',imageData:'data'}]}])));
test('provider: disabled means unavailable regardless of environment',()=>{const p=new CodemaxProvider({name:'codemax',disabled:true});assert.equal(p.isAvailable(),false);assert.deepEqual(p.listModels(),[]);} );
test('SSE: incremental Unicode, CRLF, keepalives and terminal framing',async()=>{const encoded=new TextEncoder().encode(': keepalive\r\n\r\ndata: {"message":"héllo 🌍"}\r\n\r\ndata: [DONE]\r\n\r\n');const parts=Array.from(encoded,b=>new Uint8Array([b]));assert.deepEqual(await collect(stream(parts)),[{message:'héllo 🌍'},{codemax_done:true}]);});
test('SSE: multiline data field decoding',async()=>assert.deepEqual(await collect(stream(['data: {"x":\ndata: 1}\n\ndata: [DONE]\n\n'])),[{x:1},{codemax_done:true}]));
test('SSE: incomplete event rejected',async()=>assert.rejects(collect(stream(['data: {"x":1}'])),/partial event/));
test('SSE: missing terminal event is not a success',async()=>assert.rejects(collect(stream(['data: {"x":1}\n\n'])),/without its terminal/));
test('SSE: malformed JSON and invalid UTF8 refused',async()=>{await assert.rejects(collect(stream(['data: invalid\n\n'])));await assert.rejects(collect(stream([new Uint8Array([255,254])])));});
test('SSE: event limits enforced',async()=>assert.rejects(collect(stream(['data: '+ 'x'.repeat(262145)])),/event limit/));
test('SSE: abort is observed and stream reader released',async()=>{const s=new ReadableStream();const abort=new AbortController();const pending=collect(s,abort.signal);abort.abort();await assert.rejects(pending,/cancelled/);assert.equal(s.locked,false);});
test('SSE: caller break cancels reader',async()=>{const s=stream(['data: {"x":1}\n\n']);for await(const e of codemaxSSE(s)){assert.deepEqual(e,{x:1});break;}assert.equal(s.locked,false);});
