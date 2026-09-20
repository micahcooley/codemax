#!/usr/bin/env node
// Compile the actual provider module for direct execution of its pure and filesystem boundaries.
// This is not a build of Koryphaios and does not substitute any upstream runtime types.
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const require=createRequire(import.meta.url);let ts;
try{ts=require('typescript');}catch{ts=require(path.join(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript/lib/typescript.js'));}
const filename='integrations/koryphaios/overlay/backend/src/providers/codemax.ts';
const result=ts.transpileModule(fs.readFileSync(path.join(root,filename),'utf8'),{fileName:filename,reportDiagnostics:true,
 compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,strict:true,verbatimModuleSyntax:true}});
if(result.diagnostics?.some(d=>d.category===ts.DiagnosticCategory.Error))throw Error(ts.formatDiagnosticsWithColorAndContext(result.diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
const out=path.join(root,'build/koryphaios');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'codemax.mjs'),result.outputText);
console.log(JSON.stringify({status:'TRANSPILED',typescript:ts.version,scope:'Syntax and runnable provider module; upstream Koryphaios type/build graph not compiled',diagnostics:result.diagnostics?.length??0}));
