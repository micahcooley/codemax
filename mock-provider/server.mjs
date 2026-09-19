import http from 'node:http';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const page = new URL('./index.html', import.meta.url);
function frame(text) {
  const payload = Buffer.from(text);
  if (payload.length < 126) return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
  const head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(payload.length, 2);
  return Buffer.concat([head, payload]);
}
export function replyFor(prompt, turn = 1) {
  if (prompt.includes('[[tool]]')) {
    const nonce = /FRAME_NONCE=([a-f0-9]{16,64})/.exec(prompt)?.[1];
    const tag = nonce ? `<bridge-tool-call nonce="${nonce}">` : '<bridge-tool-call>';
    return `${tag}{"id":"call-${turn}","name":"read_file","arguments":{"path":"README.md","nested":{"array":[1,{"text":"quoted } and \\\" brace"}]}}}</bridge-tool-call>`;
  }
  if (prompt.includes('[[unicode]]')) return `Turn ${turn}: A🎯漢字 café — streamed correctly.`;
  return `Turn ${turn}: received your message. This is deterministic mock-provider output, not an AI model.`;
}
export async function startMock({port = 7340} = {}) {
  const sockets = new Set();
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
      res.end(await readFile(page)); return;
    }
    if (req.method === 'GET' && url.pathname === '/health') { res.writeHead(200, {'Content-Type': 'application/json'}); res.end('{"fixture":true}'); return; }
    if (url.pathname === '/stream' && ['GET', 'POST'].includes(req.method)) {
      let payload = {prompt: '', turn: 1, mode: 'normal'};
      if (req.method === 'POST') {
        let body = ''; let bytes = 0;
        try {
          for await (const chunk of req) {
            bytes += chunk.length; if (bytes > 131072) { res.writeHead(413); res.end(); return; }
            body += chunk.toString();
          }
          payload = JSON.parse(body);
        } catch { res.writeHead(400); res.end(); return; }
      } else {
        payload = {prompt: 'EventSource fixture', turn: Number(url.searchParams.get('turn') || 1), mode: 'normal'};
      }
      if (payload.mode === 'quota') { res.writeHead(429, {'Content-Type': 'application/json'}); res.end('{"error":"rate_limited"}'); return; }
      if (payload.mode === 'expired') { res.writeHead(401); res.end(); return; }
      if (typeof payload.prompt !== 'string') { res.writeHead(400); res.end(); return; }
      res.writeHead(200, {'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive'});
      res.flushHeaders();
      const text = replyFor(payload.prompt, payload.turn); let index = 0;
      const delay = payload.mode === 'slow' ? 100 : 8;
      const timer = setInterval(() => {
        if (payload.mode === 'broken' && index > 15) { clearInterval(timer); res.destroy(); return; }
        const slice = Array.from(text).slice(index, index + 5).join(''); index += 5;
        if (slice) res.write(`data: ${JSON.stringify({text: slice})}\n\n`);
        else { clearInterval(timer); res.end('data: [DONE]\n\n'); }
      }, delay);
      res.on('close', () => clearInterval(timer)); return;
    }
    res.writeHead(404); res.end('Not found');
  });
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  server.on('upgrade', (req, socket) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const key = req.headers['sec-websocket-key'];
    if (url.pathname !== '/ws' || typeof key !== 'string') { socket.destroy(); return; }
    const accept = createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    const text = replyFor('WebSocket fixture', Number(url.searchParams.get('turn') || 1)); let index = 0;
    const timer = setInterval(() => {
      if (socket.destroyed) { clearInterval(timer); return; }
      const part = text.slice(index, index + 5); index += 5;
      if (part) socket.write(frame(JSON.stringify({text: part})));
      else { socket.write(frame('[DONE]')); clearInterval(timer); }
    }, 8);
    socket.on('data', data => { if ((data[0] & 15) === 8) socket.end(Buffer.from([0x88, 0])); });
    socket.on('error', () => clearInterval(timer)); socket.on('close', () => clearInterval(timer));
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return {server, port: server.address().port, close: async () => { for (const s of sockets) s.destroy(); await new Promise(resolve => server.close(resolve)); }};
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const fixture = await startMock({port: Number(process.env.MOCK_PORT || 7340)});
  console.log(`Mock provider: http://127.0.0.1:${fixture.port} (fixture only)`);
  const stop = () => fixture.close().then(() => process.exit(0));
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
