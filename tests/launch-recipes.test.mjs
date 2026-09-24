import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {privateLaunch,shellQuote,buildOpencodeConfig} from '../dist/src/lib/launch-command.js';
import {recipeDefinition,toolRecipes} from '../dist/src/lib/tool-recipes.js';

// Execute generated Bash against a temporary local argument capture executable.
// This verifies argument/env transport, NOT actual OpenCode or Claude compatibility.
function execute(command,program='opencode') {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'codemax-command-test-'));
 try {
  fs.writeFileSync(path.join(root,program),'#!/usr/bin/env node\nconsole.log(JSON.stringify({env:process.env,argv:process.argv.slice(2)}));\n',{mode:0o700});
  fs.writeFileSync(path.join(root,'opencode.json'),'existing-user-config');
  const result=spawnSync('/bin/bash',['-c',command],{cwd:root,encoding:'utf8',timeout:3000,env:{PATH:root+path.delimiter+process.env.PATH}});
  assert.equal(result.status,0,result.stderr);
  assert.equal(fs.readFileSync(path.join(root,'opencode.json'),'utf8'),'existing-user-config');
  assert.equal(fs.existsSync(path.join(root,'INJECTED')),false);
  return JSON.parse(result.stdout);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
}
const endpoint='http://127.0.0.1:7331';
const key="sk-local-' ; touch INJECTED; #";
const model="p1/model';touch INJECTED;#";
test('OpenCode launch preserves special characters and existing config via real Bash with temporary executable',()=>{
 const config={model:'codemax/'+model,provider:{codemax:{options:{baseURL:endpoint+'/v1',apiKey:'{env:CODEMAX_API_KEY}'}}}};
 const out=execute(privateLaunch('opencode',endpoint,model,key,config));
 assert.equal(out.env.CODEMAX_API_KEY,key);assert.deepEqual(JSON.parse(out.env.OPENCODE_CONFIG_CONTENT),config);
});
test('Claude launch passes the selected model to each named model tier without shell injection',()=>{
 const out=execute(privateLaunch('claude',endpoint,model,key,{}),'claude');
 assert.equal(out.env.ANTHROPIC_AUTH_TOKEN,key);
 for(const name of ['MODEL','DEFAULT_HAIKU_MODEL','DEFAULT_SONNET_MODEL','DEFAULT_OPUS_MODEL'])assert.equal(out.env['ANTHROPIC_'+name],model);
});
test('All three protocol request examples preserve auth, model and correct path as separate curl arguments',()=>{
 for(const [format,route] of [['chat','/v1/chat/completions'],['responses','/v1/responses'],['messages','/v1/messages']]){
  const out=execute(privateLaunch(format,endpoint,model,key,{}),'curl');
  assert(out.argv.includes(endpoint+route));assert(out.argv.includes('Authorization: Bearer '+key));
  const body=JSON.parse(out.argv[out.argv.indexOf('--data')+1]);assert.equal(body.model,model);assert.equal(body.stream,true);
 }
});
test('OpenCode config carries every selected model with one default, not a single model',()=>{
 const models=[{id:'p1/glm-4.6',providerLabel:'Z.ai',displayName:'GLM-4.6'},{id:'p1/glm-4.5',providerLabel:'Z.ai',displayName:'GLM-4.5'},{id:'p1/sonar',providerLabel:'Perplexity',displayName:'Sonar'}];
 const config=buildOpencodeConfig(endpoint,'p1/glm-4.6',models);
 assert.equal(config.model,'codemax/p1/glm-4.6');
 assert.deepEqual(Object.keys(config.provider.codemax.models),['p1/glm-4.6','p1/glm-4.5','p1/sonar']);
 assert.equal(config.provider.codemax.models['p1/sonar'].name,'Perplexity / Sonar');
 const out=execute(privateLaunch('opencode',endpoint,'p1/glm-4.6',key,config));
 assert.deepEqual(JSON.parse(out.env.OPENCODE_CONFIG_CONTENT),config);
});
test('OpenCode config refuses empty selection, unknown default and non-loopback endpoint',()=>{
 const models=[{id:'p1/a',providerLabel:'P',displayName:'A'}];
 assert.throws(()=>buildOpencodeConfig(endpoint,'p1/a',[]));
 assert.throws(()=>buildOpencodeConfig(endpoint,'p1/missing',models));
 assert.throws(()=>buildOpencodeConfig(endpoint,'',models));
 assert.throws(()=>buildOpencodeConfig('https://example.org:7331','p1/a',models));
 assert.throws(()=>buildOpencodeConfig(endpoint,'',[]));
});
test('Launch refuses non-loopback endpoint, missing data and header-breaking credentials',()=>{
 for(const url of ['https://example.org:7331','http://0.0.0.0:7331',endpoint+'/bad'])assert.throws(()=>privateLaunch('chat',url,model,key,{}));
 for(const token of ['', 'x\ny','x\ry','x\0y'])assert.throws(()=>privateLaunch('chat',endpoint,model,token,{}));
 assert.throws(()=>privateLaunch('chat',endpoint,'',key,{}));assert.equal(shellQuote(''),"''");
});
test('Tool recipes are pinned definitions, not executable shell commands or automatic effects',()=>{
 assert.equal(toolRecipes.length,6);
 assert.deepEqual(Object.fromEntries(toolRecipes.map(r=>[r.id,r.version])),{native:'0.2.0',files:'2026.8.31',git:'2026.8.18',fetch:'2026.8.18',memory:'2026.8.31',browser:'0.0.82'});
 for(const recipe of toolRecipes){const config=recipeDefinition(recipe.id,'/tmp/project');if(recipe.bundled){assert.equal(config.command,'builtin:local-tools');assert(config.args.includes('/tmp/project'));}else{assert(['npx','uvx'].includes(config.command));assert(config.args.some(a=>a.includes(recipe.version)));}assert(!config.args.includes('-c'));}
 assert(recipeDefinition('browser').args.includes('--isolated'));
});
test('Folder recipe refuses root, dot-root, relative paths, control bytes and traversal',()=>{
 for(const p of ['/','////','/.','/././','relative','/tmp/../secret','/tmp/a\nb','/tmp/\0'])assert.throws(()=>recipeDefinition('files',p));
 const folder="/tmp/Project with 'quotes' $(not-a-command)";assert.equal(recipeDefinition('git',folder).args.at(-1),folder);
 assert.throws(()=>recipeDefinition('unknown','/tmp/project'));
});
test('Remote provider capability never receives directory picker, MCP process or general filesystem permission',()=>{
 const permissions=JSON.parse(fs.readFileSync(new URL('../src-tauri/capabilities/providers.json',import.meta.url),'utf8'));
 assert.deepEqual(permissions.permissions,['provider-observation']);
 const platform=fs.readFileSync(new URL('../src-tauri/src/platform.rs',import.meta.url),'utf8');
 assert.match(platform,/directory_pick\(webview: Webview\)[\s\S]*?views::trusted_main\(&webview\)\?/);
 const host=fs.readFileSync(new URL('../src-tauri/src/main.rs',import.meta.url),'utf8');assert.match(host,/"mcp.transport"[\s\S]*?INTERNAL_OPERATION/);
});
