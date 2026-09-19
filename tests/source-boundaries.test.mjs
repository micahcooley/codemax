// Static configuration/source checks only. These do NOT execute Tauri or Zag.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const read=p=>readFileSync(join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
test('static: trusted commands scoped to the main webview, not its window',()=>{
 const main=json('src-tauri/capabilities/main.json');assert.deepEqual(main.webviews,['main']);assert.equal(main.windows,undefined);
 assert.equal(main.remote,undefined);assert(main.permissions.includes('main-bridge'));
});
test('static: remote capability has only bounded observation permission',()=>{
 const remote=json('src-tauri/capabilities/providers.json');assert.deepEqual(remote.permissions,['provider-observation']);assert.equal(remote.local,false);assert.equal(remote.windows,undefined);
 const permissions=read('src-tauri/permissions/bridge.toml').split('identifier = "provider-observation"')[1];
 assert.match(permissions,/commands.allow = \["provider_observe"\]/);assert.doesNotMatch(permissions,/shell|filesystem|bridge_request/);
});
test('static: host events target main webview explicitly',()=>{
 for(const name of ['host.rs','views.rs']){
  const code=read('src-tauri/src/'+name);assert.doesNotMatch(code,/emit_to\("main"/);
  for(const line of code.split('\n').filter(l=>l.includes('.emit_to(')))assert.match(line,/EventTarget::Webview\s*\{\s*label:\s*"main"/);
 }
});
test('static: production entry points remain in Zag and no preview backend exists',()=>{
 assert.match(read('backend/zag.mod'),/edition\s*=\s*"2027"/);
 const backend=read('backend/app.zag');for(const path of ['/v1/chat/completions','/v1/messages','/v1/responses','/v1/models'])assert(backend.includes(path));
 const ts=read('src/lib/api/bridge.ts');assert.match(ts,/NATIVE_HOST_REQUIRED/);assert.doesNotMatch(ts,/setInterval|fetch\(/);
});
test('static: sidecar packaging and least-privilege CSP configured',()=>{
 const cfg=json('src-tauri/tauri.conf.json');assert.deepEqual(cfg.bundle.externalBin,['binaries/bridge-zag']);
 assert(cfg.app.security.csp.includes("frame-src 'none'"));assert(!cfg.app.security.csp.includes("script-src 'unsafe-eval'"));
 assert.match(read('src-tauri/src/main.rs'),/target_arch = "x86_64"/);
});
test('static: all Zag imports resolve inside the package',()=>{
 function scan(dir){for(const file of readdirSync(dir,{withFileTypes:true})){const path=join(dir,file.name);if(file.isDirectory())scan(path);else if(file.name.endsWith('.zag')){
  for(const match of readFileSync(path,'utf8').matchAll(/@import\("([^"]+)"\)/g))assert(existsSync(join(dirname(path),match[1])),`${path}: ${match[1]}`);
 }}}scan(join(root,'backend'));
});
test('static: seven real Svelte screens exist and unknowns are explicit',()=>{
 for(const name of ['Home','ProviderBrowser','Models','Harness','Sessions','Detector','Settings'])assert(read(`src/screens/${name}.svelte`).includes('<script lang="ts">'));
 assert.match(read('src/screens/Detector.svelte'),/detector.reason/);assert.match(read('src/screens/Models.svelte'),/Unknown/);
});
test('static: provider execution code has no credential extraction or shell calls',()=>{
 const agent=read('browser/agent.js');assert.doesNotMatch(agent,/document\.cookie|\.headers\.get\(['"](?:Authorization|Cookie)|child_process|execSync|window\.open\(/i);
 assert.match(read('backend/storage/files.zag'),/lock_state/);assert.match(read('backend/app.zag'),/STATE_LOCK_FAILED/);
});
test('static: every custom command is declared in AppManifest for capability enforcement',()=>{
 const main=read('src-tauri/src/main.rs');const names=main.match(/generate_handler!\[([^\]]+)\]/)[1].split(',').map(s=>s.trim().split('::').at(-1));
 const manifest=read('src-tauri/build.rs');for(const name of names)assert(manifest.includes(`"${name}"`),`Missing ACL declaration: ${name}`);
});
test('static: synthetic-file broker is Zag-only, one-use, expiry and exact-path bound',()=>{
 const code=read('backend/security/file_probe.zag');for(const check of ['!p.*.granted','p.*.reads!=0','_zag_clock_monotonic_ms()>=p.*.deadline','provider!=p.*.provider','!buf.eq(model,buf.view(&p.*.model))','!buf.eq(path,"bridge-probe.txt")','stat[2]==1'])assert(code.includes(check),check);
 assert.match(code,/131072 \| 524288 \| 2048/);assert.match(code,/p\.\*\.granted=false/);
 assert.doesNotMatch(code,/_zag_exec|sh -c|\/etc\/|\/home\//);
 const server=read('backend/app.zag');assert(!server.includes('/filesystem/'));assert(server.includes('_zag_raw_syscall(53,1,1 | 2048 | 524288'));
});
test('static: tab activity includes manual generation and no polling-based fake activity',()=>{
 const tab=read('src/lib/components/TabActivity.svelte');assert(tab.includes('provider.browser_busy'));assert(!tab.includes('setInterval'));
 const detector=read('backend/detector/symbolic.zag');assert(detector.includes('p.*.browser_busy = false'));assert(detector.includes('"disabled"'));
 assert(read('src/lib/design/app.css').includes('prefers-reduced-motion'));
});
