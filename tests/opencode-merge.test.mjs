import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const script = path.join(root, 'scripts', 'opencode-merge.mjs');
const codemaxExport = {
  $schema: 'https://opencode.ai/config.json',
  model: 'codemax/p1/qwen',
  provider: { codemax: { npm: '@ai-sdk/openai-compatible', name: 'Codemax websites',
    options: { baseURL: 'http://127.0.0.1:7331/v1', apiKey: '{env:CODEMAX_API_KEY}' },
    models: { 'p1/qwen': { name: 'Qwen / Qwen' }, 'p1/glm': { name: 'Z.ai / GLM' } } } },
};
function run(args, cwd) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
}
function setup(existing) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode-merge-'));
  const from = path.join(dir, 'export.json');
  fs.writeFileSync(from, JSON.stringify(codemaxExport));
  const target = path.join(dir, 'opencode.json');
  if (existing !== undefined) fs.writeFileSync(target, existing);
  return { dir, from, target };
}
test('merge creates a fresh config with every selected model', () => {
  const { dir, from, target } = setup();
  try {
    const r = run(['--from', from, '--config', target], dir);
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(fs.readFileSync(target, 'utf8'));
    assert.deepEqual(Object.keys(out.provider.codemax.models), ['p1/qwen', 'p1/glm']);
    assert.equal(out.model, 'codemax/p1/qwen');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('merge preserves existing providers and default, backs up first', () => {
  const existing = JSON.stringify({ model: 'other-prov/model', provider: { other: { apiKey: 'x' } } });
  const { dir, from, target } = setup(existing);
  try {
    const r = run(['--from', from, '--config', target], dir);
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(fs.readFileSync(target, 'utf8'));
    assert.equal(out.model, 'other-prov/model');
    assert.deepEqual(out.provider.other, { apiKey: 'x' });
    assert.equal(Object.keys(out.provider.codemax.models).length, 2);
    assert.match(r.stdout, /backup: /);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('merge refuses model-less exports and broken targets', () => {
  const { dir, from, target } = setup();
  try {
    fs.writeFileSync(from, JSON.stringify({ model: 'codemax/x', provider: {} }));
    assert.notEqual(run(['--from', from, '--config', target], dir).status, 0);
    fs.writeFileSync(from, JSON.stringify(codemaxExport));
    fs.writeFileSync(target, '{broken');
    assert.notEqual(run(['--from', from, '--config', target], dir).status, 0);
    assert.ok(!JSON.parse(fs.readFileSync(from, 'utf8')).provider?.other);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
