/** Convert built ESM imports into bare, import-map keys for about:blank tests.
 * No server, navigation policy changes, or external network access is involved.
 */
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript');}catch{ts=require('/usr/local/lib/node_modules/typescript/lib/typescript.js');}
const root=path.resolve(process.argv[2]||'dist'),files=[path.join(root,'src/main.js')],seen=new Set(files);
const modules={};for(const file of files){let code=fs.readFileSync(file,'utf8');const ast=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];
 function add(node){if(!node||!ts.isStringLiteral(node))return;const spec=node.text;if(!spec.startsWith('.'))throw Error('Unexpected nonlocal import '+spec);const target=path.resolve(path.dirname(file),spec);if(!fs.existsSync(target))throw Error('Missing '+target);if(!seen.has(target)){seen.add(target);files.push(target);}edits.push({start:node.getStart(ast)+1,end:node.end-1,text:'bridge/'+path.relative(root,target).split(path.sep).join('/')});}
 function visit(node){if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node))add(node.moduleSpecifier);else if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword)add(node.arguments[0]);ts.forEachChild(node,visit);}visit(ast);
 for(const e of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,e.start)+e.text+code.slice(e.end);
 modules['bridge/'+path.relative(root,file).split(path.sep).join('/')]=code;
}console.log(JSON.stringify(modules));
