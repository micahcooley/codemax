#!/usr/bin/env python3
"""Execute the actual Zag MCP client against a real stdio fixture server.
The browser and Rust transport are substituted by bounded test-host plumbing.
This is NOT evidence of native Tauri, live AI websites or a coding harness.
Requires a real compiled Zag ELF; never starts a Python replacement backend.
"""
from __future__ import annotations
import argparse,json,os,pathlib,re,secrets,shutil,socket,subprocess,tempfile,threading,time
from native_gateway import FixtureHost,ORIGIN
ROOT=pathlib.Path(__file__).resolve().parents[1]
class McpHost(FixtureHost):
 def __init__(self,*args):
  self.children={};self.mcp_writes=[];self.model_turns=0;self.expected='';super().__init__(*args)
 def mcp_frame(self,frame):
  sid=frame['server_id'];epoch=frame['epoch'];action=frame['action']
  def event(kind,line=None):
   value={'server_id':sid,'epoch':epoch,'event':kind}
   if line is not None:value['line']=line
   self.send({'v':1,'id':0,'op':'mcp.transport','params':value})
  if action=='start':
   child=subprocess.Popen([frame['command'],*frame['args']],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,env={'PATH':os.environ.get('PATH','')},bufsize=0)
   self.children[sid]=child;event('connected')
   def read():
    try:
     assert child.stdout
     while raw:=child.stdout.readline(32770):
      if len(raw)>32769:raise ValueError('fixture frame too large')
      event('line',raw.decode().rstrip('\n'))
     if not self.stopping:event('closed')
    except (OSError,ValueError):
     if not self.stopping:event('error')
   threading.Thread(target=read,daemon=True).start()
  elif action=='write':
   child=self.children[sid];self.mcp_writes.append(json.loads(frame['line']));assert child.stdin
   child.stdin.write((frame['line']+'\n').encode());child.stdin.flush()
  elif action=='stop':
   child=self.children.pop(sid,None)
   if child and child.poll() is None:child.terminate();child.wait(timeout=3)
 def emit_generation(self,action):
  self.model_turns+=1;prompt=action['prompt'];match=re.search(r'<bridge-tool-call nonce="([A-Za-z0-9._-]+)">',prompt)
  if self.model_turns%2:
   if not match:raise AssertionError('Native normalized prompt omitted tool frame contract')
   alias=re.search(r'mcp_\d+_0',prompt)
   if not alias:raise AssertionError('MCP tool definitions not inserted')
   text=f'<bridge-tool-call nonce="{match[1]}">'+json.dumps({'id':f'fixture_call_{self.model_turns}','name':alias[0],'arguments':{'path':'fixture-note.txt'}})+'</bridge-tool-call>'
  else:
   if self.expected not in prompt:raise AssertionError('Native continuation omitted actual read bytes')
   text=self.expected
  base={'v':1,'origin':ORIGIN,'document_id':'fixture_document_1','request_id':action['request_id']}
  for i in range(0,len(text),11):self.observe(base|{'type':'generation_delta','text':text[i:i+11]})
  self.observe(base|{'type':'generation_done'})
 def close(self):
  super().close()
  for child in self.children.values():
   if child.poll() is None:child.terminate();child.wait(timeout=3)
 def wait_state(self,wanted):
  deadline=time.monotonic()+15
  while time.monotonic()<deadline:
   state=self.call('state.get')
   if self.reader_error:raise AssertionError(self.reader_error)
   if wanted(state):return state
   time.sleep(.03)
  raise AssertionError(f'Native state timeout: {state}')
def denied(fn):
 try:fn()
 except RuntimeError:return
 raise AssertionError('Expected native refusal')
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--binary',type=pathlib.Path,required=True);args=parser.parse_args()
 binary=args.binary.resolve();head=binary.read_bytes()[:20]
 if head[:5]!=b'\x7fELF\x02':raise SystemExit('A real ELF64 Zag backend is required')
 node=shutil.which('node')
 if not node:raise SystemExit('Node is required for the independent MCP fixture')
 with tempfile.TemporaryDirectory(prefix='codemax-native-mcp-') as tmp:
  root=pathlib.Path(tmp);root.chmod(0o700);state=root/'state';state.mkdir(mode=0o700);data=root/'fixture';data.mkdir(mode=0o700)
  nonce='CODEMAX_NATIVE_PROBE_'+secrets.token_hex(24);(data/'fixture-note.txt').write_text(nonce)
  with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
  h=McpHost(binary,state,port);checks=[]
  try:
   h.expected=nonce;h.ready();sid=h.call('mcp.server.add',{'label':'Native fixture','command':node,'args':[str(ROOT/'tests/fixtures/mcp-server.mjs'),str(data)]})['server_id'];checks.append('configure_without_execution')
   assert not h.children;denied(lambda:h.call('mcp.server.connect',{'server_id':sid,'confirmed':False}));checks.append('process_consent_refusal')
   h.call('mcp.server.connect',{'server_id':sid,'confirmed':True});s=h.wait_state(lambda s:s['mcp_servers'][0]['state']=='READY');tool=s['mcp_servers'][0]['tools'][0];assert not tool['enabled'];checks.append('real_stdio_negotiation_catalog_disabled')
   h.call('mcp.tool.update',{'tool':tool['alias'],'enabled':True});h.call('mcp.run.start',{'provider_id':h.provider,'model':h.model,'task':'Read fixture-note.txt and repeat its contents.','auto_continue':True})
   s=h.wait_state(lambda s:s['mcp_run']['state']=='PERMISSION_REQUIRED');run=s['mcp_run'];assert not any(x.get('method')=='tools/call' for x in h.mcp_writes);checks.append('automatic_instruction_insertion_no_preapproval_call')
   denied(lambda:h.call('mcp.run.approve',{'run_id':run['id'],'call_id':'wrong','confirmed':True}));checks.append('wrong_call_id_refused')
   h.call('mcp.run.approve',{'run_id':run['id'],'call_id':run['call_id'],'confirmed':True,'allow_run':False});s=h.wait_state(lambda s:s['mcp_run']['state'] in ('COMPLETED','FAILED'));assert s['mcp_run']['state']=='COMPLETED',s['mcp_run'];assert s['mcp_run']['answer']==nonce;checks.append('actual_synthetic_file_read_returned_in_same_native_session')
   assert sum(x.get('method')=='tools/call' for x in h.mcp_writes)==1;checks.append('one_tool_call_no_replay')
   h.wait_state(lambda s:all(x['status']=='EXPIRED' for x in s['sessions']));checks.append('task_completion_releases_session')
   h.call('mcp.run.start',{'provider_id':h.provider,'model':h.model,'task':'Read fixture-note.txt.','auto_continue':True});s=h.wait_state(lambda s:s['mcp_run']['state']=='PERMISSION_REQUIRED');run=s['mcp_run']
   h.call('model.update',{'provider_id':h.provider,'model':h.model,'enabled':False});denied(lambda:h.call('mcp.run.approve',{'run_id':run['id'],'call_id':run['call_id'],'confirmed':True}));assert sum(x.get('method')=='tools/call' for x in h.mcp_writes)==1;checks.append('disable_model_revokes_queued_approval')
   report={'scope':__doc__,'status':'PASS','checks':checks,'count':len(checks)}
   (ROOT/'tests/evidence/native-mcp.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
  finally:h.close()
if __name__=='__main__':main()
