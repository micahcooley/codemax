import test from 'node:test';
import assert from 'node:assert/strict';
import {startMock, replyFor} from '../mock-provider/server.mjs';
test('mock provider binds loopback, serves UI, streams and rejects traversal', async () => {
 const mock = await startMock({port:0});
 try {
  assert.equal(mock.server.address().address,'127.0.0.1');
  const root=`http://127.0.0.1:${mock.port}`;
  assert.match(await (await fetch(root)).text(), /NOT A REAL MODEL/);
  const response=await fetch(root+'/stream',{method:'POST',body:JSON.stringify({prompt:'[[unicode]]',turn:2})});
  assert.match(response.headers.get('content-type'), /event-stream/);
  const stream=await response.text(); assert.match(stream,/data: \[DONE\]/); assert.match(stream,/🎯/);
  assert.equal((await fetch(root+'/..%2f..%2fetc/passwd')).status,404);
 } finally { await mock.close(); }
});
test('quota and login expiration are deterministic failure fixtures', async () => {
 const mock=await startMock({port:0});
 try {
  for (const [mode,status] of [['quota',429],['expired',401]]) {
   const response=await fetch(`http://127.0.0.1:${mock.port}/stream`,{method:'POST',body:JSON.stringify({prompt:'x',mode})});assert.equal(response.status,status);
  }
 } finally { await mock.close(); }
});
test('mock tool payload contains nested JSON and echoes a requested framing nonce', () => {
 const text=replyFor('[[tool]] FRAME_NONCE=1234567890abcdef',3);
 assert.match(text,/nonce="1234567890abcdef"/);
 const data=JSON.parse(text.slice(text.indexOf('>')+1,text.lastIndexOf('</')));
 assert.equal(data.name,'read_file');assert.equal(data.arguments.nested.array[1].text,'quoted } and " brace');
});
