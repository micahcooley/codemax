// Syntax-only TypeScript parsing; deliberately NOT a Svelte build/typecheck.
import {createRequire} from 'node:module';
import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url), root=dirname(dirname(fileURLToPath(import.meta.url)));
let ts;
try {ts=require('typescript');} catch {
 const globalRoot=execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim();
 ts=require(join(globalRoot,'typescript'));
}
const files=[],errors=[];
function scan(path){for(const item of readdirSync(path,{withFileTypes:true})){
 const name=join(path,item.name);if(item.isDirectory()){scan(name);continue;}
 if(!/\.(?:ts|svelte)$/.test(name))continue;
 let code=readFileSync(name,'utf8');
 if(name.endsWith('.svelte'))code=code.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1]??'';
 const parsed=ts.createSourceFile(name+'.ts',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 files.push(relative(root,name));for(const d of parsed.parseDiagnostics)errors.push({file:relative(root,name),message:ts.flattenDiagnosticMessageText(d.messageText,'\n')});
}}
scan(join(root,'src'));
const report={scope:'TypeScript parser only, including script bodies extracted from Svelte files. NOT component compilation, type checking, HTML validation, or a native UI test.',files,status:errors.length?'FAIL':'PASS',errors};
writeFileSync(join(root,'tests/evidence/typescript-syntax.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));process.exit(errors.length?1:0);
