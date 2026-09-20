import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context = {TextEncoder, URL};
vm.runInNewContext(readFileSync(new URL('../browser/semantics.js', import.meta.url), 'utf8'), context);
const api = context.__CODEMAX_SEMANTICS__;
test('network URL summaries exclude credentials, query secrets and identifiers', () => {
  assert.equal(api.safeURL('https://user:secret@example.com/api/conversation/secretid?token=private#oauth', 'https://example.com'), 'https://example.com/api/conversation/:segment');
  assert.equal(api.safeURL('file:///etc/passwd', 'https://example.com'), null);
  assert.equal(api.safeURL('javascript:alert(1)', 'https://example.com'), null);
});
test('network structural evidence contains no payload values or arbitrary keys', () => {
  const value = api.shape(JSON.stringify({model: 'private-model', password: 'secret', access_token: 'secret', confidential_key: 12, messages: ['private text']}));
  const json = JSON.stringify(value);
  assert.equal(json.includes('private'), false); assert.equal(json.includes('password'), false);
  assert.equal(json.includes('confidential'), false); assert.match(json, /model/); assert.match(json, /messages/);
});
test('Unicode stream splitting is byte bounded and lossless', () => {
  const text = 'A🎯漢字\n'.repeat(5000);
  for (const limit of [4, 7, 64, 3072]) {
    const chunks = api.splitText(text, limit);
    assert.equal(chunks.join(''), text);
    for (const chunk of chunks) assert.ok(Buffer.byteLength(chunk) <= limit);
  }
});
test('stream correction is not duplicated or silently appended', () => {
  assert.equal(api.appendDelta('Hello', 'Hello world'), ' world');
  assert.throws(() => api.appendDelta('Hello', 'Goodbye'), /RESPONSE_REWRITTEN/);
});
test('common token formats are redacted from semantic labels', () => {
  assert.equal(api.redact('key sk-test_123456789'), 'key [redacted]');
  assert.equal(api.redact('Bearer abcdef123456'), '[redacted]');
});
test('oversized and non-JSON network bodies remain opaque', () => {
  assert.equal(api.shape('x'.repeat(20000)).kind, 'string');
  assert.equal(api.shape('not json').kind, 'opaque');
});

test('capability extraction copies only explicit per-model facts, never messages or auth', () => {
 const data=api.metadata(JSON.stringify({model:'glm-5.3-flash',messages:[{content:'PRIVATE_PROJECT_TEXT'}],password:'DO_NOT_EXPORT',context_window:131072,tokenizer:'example-tokenizer',reasoning_effort:'high',api_key:'secret'}));
 assert.equal(data.length,1);assert.equal(data[0].model,'glm-5.3-flash');assert.equal(data[0].context_tokens,131072);assert.equal(data[0].selected,true);
 assert.equal(JSON.stringify(data).includes('PRIVATE_PROJECT'),false);assert.equal(JSON.stringify(data).includes('DO_NOT_EXPORT'),false);assert.equal(JSON.stringify(data).includes('api_key'),false);
});
test('model names alone do not invent context, tokenizer or selection',()=>{
 assert.equal(api.metadata({model:'glm-5.3-128k'}).length,0);
 const d=api.metadata({model:'glm-5.3',messages:[],context_window:'128K'});assert.equal(d[0].context_tokens,null);assert.equal(d[0].tokenizer,null);
});
test('metadata values and sample counts are bounded',()=>{
 assert.equal(api.metadata('a'.repeat(32769)).length,0);assert.equal(api.metadata({data:Array.from({length:50},(_,i)=>({id:'model-'+i,context_length:2048}))},'PROVIDER_METADATA').length,32);
 for(const x of [-1,0,127,10000001,1.5,Infinity,NaN])assert.equal(api.metadata({model:'m-1',messages:[],context_window:x})[0].context_tokens,null);
});
test('credential-shaped model or tokenizer identities are not exported',()=>{
 assert.equal(api.metadata({model:'sk-secret_123456789',messages:[]}).length,0);
 assert.equal(api.metadata({model:'m-1',messages:[],tokenizer:'Bearer secret-token'})[0].tokenizer,null);
});
test('model catalog metadata is not falsely marked as the current selection',()=>{
 const d=api.metadata({models:[{id:'m-1',context_window:2048,messages:['private']},{id:'m-2',context_length:4096}]},'PROVIDER_METADATA');assert.equal(d[0].selected,false);assert.equal(d[1].selected,false);
});

test('context labels require an explicit context field; model names are not limits',()=>{
 assert.equal(api.contextEvidence('GLM-5.3-128k'),null);
 assert.equal(api.contextEvidence('128,000 context tokens').context_tokens,128000);
 assert.equal(api.contextEvidence('Context window: 131072 tokens').context_tokens,131072);
 assert.equal(api.contextEvidence('Context window: 128K tokens').context_tokens,null);
 assert.equal(api.contextEvidence('Context window: 128K tokens').context_display,'Context window: 128K tokens');
 assert.equal(api.contextEvidence('Context window: 1,28,000').context_tokens,null);
});
test('automatic inspection forbids authentication and billing actions',()=>{
 for(const label of ['Sign in','Authorize account','Continue with Google','Grant access','Upgrade plan','Delete account'])assert(api.isSensitive(label),label);
 for(const label of ['Select a model','Deep Think','Max','Send Message'])assert(!api.isSensitive(label),label);
});
