#!/usr/bin/env node
/** Merge a Codemax-exported opencode.json into a persistent opencode config.
 *
 * Usage:
 *   node scripts/opencode-merge.mjs --from ./opencode.json [--config ~/.config/opencode/opencode.json]
 *
 * Merges ONLY the `provider.codemax` entry (every model from your Codemax
 * multi-select) and sets top-level `model` only when the target has none, so
 * your existing providers and default are never stolen. The previous target
 * is backed up next to itself before any write. The local key is never
 * stored: keep `export CODEMAX_API_KEY=...` in your shell profile.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function usage() {
  console.error('usage: opencode-merge.mjs --from <codemax-export.json> [--config <opencode.json>]');
  process.exit(2);
}
const argv = process.argv.slice(2);
const fromIdx = argv.indexOf('--from');
const configIdx = argv.indexOf('--config');
if (fromIdx < 0 || !argv[fromIdx + 1]) usage();
const fromPath = argv[fromIdx + 1];
const targetPath = (configIdx >= 0 && argv[configIdx + 1])
  ? argv[configIdx + 1]
  : path.join(os.homedir(), '.config', 'opencode', 'opencode.json');

function fail(message) { console.error(`opencode-merge: ${message}`); process.exit(1); }
if (!fs.existsSync(fromPath)) fail(`export not found: ${fromPath}`);
let exported;
try { exported = JSON.parse(fs.readFileSync(fromPath, 'utf8')); }
catch { fail(`export is not valid JSON: ${fromPath}`); }
const entry = exported?.provider?.codemax;
if (!entry || typeof entry !== 'object' || !entry.models || !Object.keys(entry.models).length)
  fail('export has no provider.codemax models; re-export from Codemax first');
if (typeof exported.model !== 'string' || !exported.model.startsWith('codemax/'))
  fail('export has no codemax default model; re-export from Codemax first');

let target = {};
if (fs.existsSync(targetPath)) {
  try { target = JSON.parse(fs.readFileSync(targetPath, 'utf8')); }
  catch { fail(`existing config is not valid JSON: ${targetPath}`); }
  if (!target || typeof target !== 'object' || Array.isArray(target)) fail(`existing config is not an object: ${targetPath}`);
  const backup = `${targetPath}.bak-${new Date().toISOString().replaceAll(/[:.]/g, '-')}`;
  fs.copyFileSync(targetPath, backup);
  console.log(`backup: ${backup}`);
} else {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}
target.provider = { ...(target.provider || {}), codemax: entry };
if (typeof target.model !== 'string' || !target.model) target.model = exported.model;
fs.writeFileSync(targetPath, JSON.stringify(target, null, 2) + '\n');
const count = Object.keys(entry.models).length;
console.log(`merged: ${targetPath} (codemax provider with ${count} model${count === 1 ? '' : 's'}, default ${target.model})`);
console.log('next: export CODEMAX_API_KEY=<your local key> in your shell profile, then just run `opencode`.');
