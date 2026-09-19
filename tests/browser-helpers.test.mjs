import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context = {__BRIDGE_BOOT__: {testOnly: true}, TextEncoder, URL};
vm.runInNewContext(readFileSync(new URL('../browser/agent.js', import.meta.url), 'utf8'), context);
const api = context.__BRIDGE_TEST_API__;
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
