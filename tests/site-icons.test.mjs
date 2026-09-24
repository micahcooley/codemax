// Site icons are vendored: every mapped host resolves to a file that must
// exist under public/site-icons, SVGs must parse, and rasters must decode
// with sane dimensions. The component itself must never fetch: grep the
// source for network primitives.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {execSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const hosts = [
  'https://chat.z.ai/', 'https://chat.qwen.ai/', 'https://chat.deepseek.com/',
  'https://chatgpt.com/', 'https://chat.openai.com/', 'https://claude.ai/',
  'https://gemini.google.com/', 'https://grok.com/', 'https://kimi.moonshot.cn/',
  'https://kimi.ai/', 'https://chat.mistral.ai/', 'https://agent.minimax.io/',
  'https://chat.minimax.io/', 'https://chat.stepfun.com/', 'https://meta.ai/',
  'https://www.meta.ai/', 'https://perplexity.ai/', 'https://www.perplexity.ai/',
  'https://copilot.microsoft.com/', 'https://github.com/',
];
test('vendored icon map covers the supported sites', async () => {
  const {siteIcon} = await import('../dist/src/lib/site-icons.js');
  const missing = hosts.filter(h => siteIcon(h) === null);
  assert.deepEqual(missing, [], `all supported sites have icons, missing: ${missing.join(',')}`);
  for (const host of hosts) {
    const resolved = siteIcon(host);
    if (!resolved) continue;
    assert.match(resolved, /^\/site-icons\/[a-z0-9-]+\.(svg|png|ico|webp|jpg)$/);
    assert.ok(existsSync(join(root, 'public/site-icons', resolved.split('/').pop())), resolved);
  }
  assert.equal(siteIcon('https://CHAT.Z.AI/'), '/site-icons/zai.svg');
  assert.equal(siteIcon('notaurl'), null);
});
test('vendored icon files decode', () => {
  const out = execSync(`python3 - ${join(root, 'public/site-icons')}`, {
    input: `import os,struct,sys
d=sys.argv[1]
ok=True
for f in sorted(os.listdir(d)):
    p=os.path.join(d,f);b=open(p,'rb').read()
    if f.endswith('.svg'):
        ok = ok and b.lstrip().startswith(b'<') and b'<svg' in b[:600] and len(b)<65536
    elif f.endswith('.png'):
        w,h=struct.unpack('>II',b[16:24]);ok=ok and b[:8]==bytes([137,80,78,71,13,10,26,10]) and 8<=w<=512 and 8<=h<=512
    elif f.endswith('.jpg'):
        ok=ok and b[:2]==bytes([255,216]) and len(b)>1024
    elif f.endswith('.ico'):
        ok=ok and b[:4]==b'\\x00\\x00\\x01\\x00'
    elif f.endswith('.webp'):
        ok=ok and b[:4]==b'RIFF' and b[8:12]==b'WEBP'
    else: ok=False
    print(f, len(b))
print('ICONS_VALID' if ok else 'ICONS_INVALID')`,
  }).toString();
  assert.ok(out.includes('ICONS_VALID'), out);
});
test('favicon component performs no fetching', () => {
  const source = readFileSync(join(root, 'src/lib/components/Favicon.svelte'), 'utf8');
  assert.doesNotMatch(source, /https?:\/\//);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest/);
});
