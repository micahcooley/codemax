#!/usr/bin/env node
/** Compile the real Svelte interface with an explicitly supplied local compiler.
 * This is an offline verification path; `npm run build` remains the Vite path.
 * No fixture host or mock website is included in the distribution.
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const runtime=process.env.SVELTE_RUNTIME_DIR;
if(!runtime||!fs.existsSync(path.join(runtime,'svelte_compiler.js')))throw new Error('Set SVELTE_RUNTIME_DIR to a trusted, local Svelte ESM distribution.');
const compiler=await import(pathToFileURL(path.join(runtime,'svelte_compiler.js')).href);
let ts;try{ts=require('typescript');}catch{const {execFileSync}=require('node:child_process');ts=require(path.join(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript/lib/typescript.js'));}
const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
// Removed/renamed source modules must not linger in a new distribution.
fs.rmSync(path.join(out,'src'),{recursive:true,force:true});
const warnings=[],modules=[];let css=fs.readFileSync(path.join(root,'src/lib/design/app.css'),'utf8');
const all=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else all.push(p);}}
walk(path.join(root,'src'));
function target(source){return source.endsWith('.ts')?source.slice(0,-3)+'.js':source.endsWith('.svelte')?source+'.js':source;}
function resolveImport(spec,file){
 if(spec==='svelte')return path.join(out,'runtime/svelte_svelte.js');
 if(spec.startsWith('svelte/'))return path.join(out,'runtime/'+spec.replaceAll('/','_')+'.js');
 if(!spec.startsWith('.'))throw new Error(`Unexpected external import ${spec} in ${file}`);
 const base=path.resolve(path.dirname(file),spec);
 const found=[base,base+'.ts',base+'.js',base+'.svelte',path.join(base,'index.ts')].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
 if(!found)throw new Error(`Unresolved import ${spec} in ${file}`);
 return path.join(out,target(path.relative(root,found)));
}
function imports(code,source,dest){
 const ast=ts.createSourceFile(dest,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];
 function add(node){if(!node||!ts.isStringLiteral(node))return;const spec=node.text;if(spec.endsWith('.css'))return;
  const resolved=resolveImport(spec,source);let relative=path.relative(path.dirname(dest),resolved).split(path.sep).join('/');if(!relative.startsWith('.'))relative='./'+relative;
  edits.push({start:node.getStart(ast)+1,end:node.end-1,text:relative});
 }
 function visit(node){if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node))add(node.moduleSpecifier);
  else if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword)add(node.arguments[0]);
  ts.forEachChild(node,visit);
 }visit(ast);for(const e of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,e.start)+e.text+code.slice(e.end);return code;
}

for(const file of all.filter(f=>f.endsWith('.svelte')||f.endsWith('.ts'))){
 let code=fs.readFileSync(file,'utf8');
 const name=path.relative(root,file),dest=path.join(out,target(name));
 try{
  if(file.endsWith('.svelte')){
   const compiled=compiler.compile(code,{filename:name,generate:'client',css:'external',dev:false});code=compiled.js.code;
   if(compiled.css)css+='\n'+compiled.css.code;
   warnings.push(...compiled.warnings.map(w=>({file:name,code:w.code,message:w.message,start:w.start})));
  }else{
   const result=ts.transpileModule(code,{fileName:name,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,verbatimModuleSyntax:true,isolatedModules:true},reportDiagnostics:true});
   if(result.diagnostics?.some(d=>d.category===ts.DiagnosticCategory.Error))throw new Error(ts.formatDiagnosticsWithColorAndContext(result.diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
   code=result.outputText;
   if(file.endsWith('.svelte.ts')){const result=compiler.compileModule(code,{filename:name,generate:'client',dev:false});code=result.js.code;warnings.push(...result.warnings.map(w=>({file:name,code:w.code,message:w.message})));}
  }
  code=code.replace(/^import\s+["'][^"']+\.css["'];?\s*$/gm,'');
  code=imports(code,file,dest);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,code);modules.push(path.relative(out,dest));
 }catch(error){console.error(`COMPILE FAILED: ${name}\n${error.message}`);if(error.frame)console.error(error.frame);process.exitCode=1;}
}
if(process.exitCode)process.exit(process.exitCode);
fs.mkdirSync(path.join(out,'runtime'),{recursive:true});
for(const name of fs.readdirSync(runtime).filter(n=>n.endsWith('.js')&&!n.includes('compiler'))){fs.copyFileSync(path.join(runtime,name),path.join(out,'runtime',name));modules.push('runtime/'+name);}
fs.writeFileSync(path.join(out,'ui.css'),css);
fs.writeFileSync(path.join(out,'index.html'),'<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="dark light"><title>Codemax — Browser</title><link rel="stylesheet" href="./ui.css"></head><body><div id="app"></div><script type="module" src="./src/main.js"></script></body></html>\n');
const report={compiler:'Svelte',version:compiler.VERSION,typescript:ts.version,compiled_modules:modules.filter(m=>m.startsWith('src/')).length,warnings,fixture_code_in_distribution:false,entry:'src/main.js'};
fs.mkdirSync(path.join(root,'tests/evidence'),{recursive:true});fs.writeFileSync(path.join(root,'tests/evidence/frontend-build.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
