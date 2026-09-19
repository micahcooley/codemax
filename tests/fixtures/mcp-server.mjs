#!/usr/bin/env node
/* Deterministic stdio MCP test server, not a production tool integration.
   Reads ONLY fixture-note.txt under the explicitly supplied test directory. */
import readline from 'node:readline';
import {open, lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
const root=process.argv[2];
if(!root||!path.isAbsolute(root)){process.stderr.write('Expected absolute test directory\n');process.exit(64);}
const send=value=>process.stdout.write(JSON.stringify(value)+'\n');
const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
for await(const line of input){
 if(Buffer.byteLength(line)>32768){process.exitCode=65;break;}
 let m;try{m=JSON.parse(line);}catch{send({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid JSON'}});continue;}
 if(!('id'in m))continue;
 const reply=result=>send({jsonrpc:'2.0',id:m.id,result});
 if(m.method==='initialize')reply({protocolVersion:'2025-11-25',serverInfo:{name:'Codemax fixture server',version:'1'},capabilities:{tools:{}}});
 else if(m.method==='ping')reply({});
 else if(m.method==='tools/list')reply({tools:[{name:'read_fixture_note',description:'Test fixture only. Read the single synthetic fixture-note.txt, no other file.',inputSchema:{type:'object',properties:{path:{type:'string',enum:['fixture-note.txt']}},required:['path'],additionalProperties:false}}]});
 else if(m.method==='tools/call'){
  let handle;try{
   if(m.params?.name!=='read_fixture_note'||m.params?.arguments?.path!=='fixture-note.txt'||Object.keys(m.params.arguments).length!==1)throw Error('FIXTURE_SCOPE_DENIED');
   const stat=await lstat(root);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('FIXTURE_ROOT_DENIED');
   handle=await open(path.join(root,'fixture-note.txt'),constants.O_RDONLY|constants.O_NOFOLLOW);
   const st=await handle.stat();if(!st.isFile()||st.nlink!==1||st.size>4096)throw Error('FIXTURE_FILE_DENIED');
   const text=await handle.readFile({encoding:'utf8'});if(Buffer.byteLength(text)>4096)throw Error('FIXTURE_LIMIT');
   reply({content:[{type:'text',text}]});
  }catch{reply({isError:true,content:[{type:'text',text:'Synthetic fixture scope denied'}]});}finally{await handle?.close();}
 }else send({jsonrpc:'2.0',id:m.id,error:{code:-32601,message:'Method not found'}});
}
