#!/usr/bin/env python3
"""Native Zag gateway integration tests with a synthetic private-IPC browser.

This executes the supplied ELF; it never substitutes a Python gateway. It tests
HTTP/session/protocol plumbing, not Tauri, WebKit, a real provider or a harness.
"""
from __future__ import annotations
import argparse, concurrent.futures, http.client, json, os, pathlib, queue, re
import socket, subprocess, sys, tempfile, threading, time, traceback
ROOT=pathlib.Path(__file__).resolve().parents[1]
ORIGIN='https://fixture.example'

def observation():
    def node(id,tag,label,**kwargs):
        return dict(id=id,tag=tag,role='',label=label,visible=True,editable=False,disabled=False,
                    live='',busy=False,assistant=False,options=[],**{}) | kwargs
    return {'v':1,'type':'observation','origin':ORIGIN,'document_id':'fixture_document_1',
      'password_fields_present':False,'controls':[
        node(1,'textarea','Message',editable=True),node(2,'button','Send message'),
        node(3,'div','Assistant responses',role='log',assistant=True),
        node(4,'button','Stop generating',visible=False),node(5,'button','New chat'),
        node(6,'select','Model',options=[{'label':'Fixture Small','value':'fixture-small','selected':True,'disabled':False}])
      ]}

class FixtureHost:
    def __init__(self,binary:pathlib.Path,root:pathlib.Path,port:int):
        self.lock=threading.Lock();self.pending={};self.counter=0;self.hello=threading.Event()
        self.provider=0;self.model='';self.mode='normal';self.snapshot={};self.actions=[]
        self.stopped=threading.Event();self.reader_error=None;self.stopping=False
        state=root/'state.json';state.write_text(json.dumps({'schema':1,'port':port,'providers':[],'sessions':[]}));state.chmod(0o600)
        self.proc=subprocess.Popen([str(binary)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
          env={'BRIDGE_STATE_DIR':str(root)},bufsize=0)
        self.worker=threading.Thread(target=self.read,daemon=True);self.worker.start()
        if not self.hello.wait(8):raise RuntimeError('Native Zag did not complete its handshake')
        self.key=(root/'local-token').read_text()
        self.port=port
    def send(self,obj):
        encoded=json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode()+b'\n'
        if len(encoded)>1048576:raise ValueError('Test IPC frame exceeds contract')
        with self.lock:
            assert self.proc.stdin
            self.proc.stdin.write(encoded);self.proc.stdin.flush()
    def observe(self,event):
        self.send({'v':1,'id':0,'op':'observation','params':{'provider_id':self.provider,'event':event}})
    def call(self,op,params=None):
        with self.lock:
            self.counter+=1;ident=self.counter;q=queue.Queue(maxsize=1);self.pending[ident]=q
        try:
            self.send({'v':1,'id':ident,'op':op,'params':params or {}})
            reply=q.get(timeout=10)
            if not reply.get('ok'):raise RuntimeError(f"{op}: {reply.get('error')}")
            return reply.get('data')
        finally:
            with self.lock:self.pending.pop(ident,None)
    def emit_generation(self,action):
        rid=action['request_id'];base={'v':1,'origin':ORIGIN,'document_id':'fixture_document_1','request_id':rid}
        mode=self.mode
        if mode=='hold':return
        if mode=='quota':self.observe(base|{'type':'generation_error','code':'PROVIDER_RATE_LIMITED'});return
        if mode=='tool':
            match=re.search(r'<bridge-tool-call nonce="([A-Za-z0-9._-]+)">',action['prompt'])
            if not match:raise AssertionError('Tool-enabled prompt did not contain a nonce contract')
            body={'id':'call_fixture','name':'read_file','arguments':{'path':'fixture.txt'}}
            text=f'<bridge-tool-call nonce="{match[1]}">'+json.dumps(body)+'</bridge-tool-call>'
        else:text='Fixture answer 🎯漢字'
        for start in range(0,len(text),7):
            self.observe(base|{'type':'generation_delta','text':text[start:start+7]})
        self.observe(base|{'type':'generation_done'})
    def read(self):
        try:
            assert self.proc.stdout
            while line:=self.proc.stdout.readline(1048578):
                if len(line)>1048576:raise AssertionError('Native output frame exceeded limit')
                msg=json.loads(line)
                if msg.get('type')=='hello':
                    assert msg['protocol']==1 and msg['backend']=='zag';self.hello.set()
                elif msg.get('type')=='reply':
                    with self.lock:q=self.pending.get(msg['id'])
                    if q is not None:q.put(msg)
                elif msg.get('type')=='event' and msg.get('name')=='snapshot':self.snapshot=msg['data']
                elif msg.get('type')=='mcp':self.mcp_frame(msg)
                elif msg.get('type')=='host' and 'provider_id' in msg:
                    self.provider=msg['provider_id']
                    if msg['name'] in ('browser.open','browser.scan'):self.observe(observation())
                elif msg.get('type')=='action':
                    action=msg['action'];self.actions.append(action)
                    if action['type']=='generate':self.emit_generation(action)
                    elif action['type']=='stop':self.stopped.set()
                    elif action['type']=='new_chat':
                        self.observe({'v':1,'type':'action_result','origin':ORIGIN,'document_id':'fixture_document_1','request_id':action['request_id'],'status':'new_chat_opened'})
        except Exception as exc:
            if not self.stopping:self.reader_error=f'{type(exc).__name__}: {exc}'
    def mcp_frame(self,frame):
        raise AssertionError("MCP frame not expected in gateway-only suite")
    def http(self,path,body=None,headers=None,auth=True,method=None):
        connection=http.client.HTTPConnection('127.0.0.1',self.port,timeout=10)
        h={'Authorization':f'Bearer {self.key}'} if auth else {}
        if body is not None:h['Content-Type']='application/json'
        h.update(headers or {})
        raw=json.dumps(body,ensure_ascii=False).encode() if body is not None and not isinstance(body,(bytes,str)) else body
        try:
            connection.request(method or ('GET' if body is None else 'POST'),path,body=raw,headers=h)
            response=connection.getresponse();return response.status,dict(response.getheaders()),response.read()
        finally:connection.close()
    def ready(self):
        self.call('provider.add',{'url':ORIGIN,'label':'Synthetic test provider'})
        until=time.monotonic()+5
        while time.monotonic()<until:
            state=self.call('state.get');providers=state['providers']
            if providers and providers[0]['state']=='READY':
                self.provider=providers[0]['id'];self.model=providers[0]['models'][0]['id'];return
            time.sleep(.025)
        raise AssertionError('Synthetic observation did not produce READY')
    def end_sessions(self):
        for session in self.call('state.get')['sessions']:
            if session['status']!='EXPIRED':self.call('session.end',{'session_id':session['id']})
    def close(self):
        if self.proc.poll() is None:
            try:self.call('shutdown')
            except Exception:pass
            self.stopping=True
            if self.proc.stdin:self.proc.stdin.close()
            try:self.proc.wait(timeout=3)
            except subprocess.TimeoutExpired:self.proc.kill();self.proc.wait(timeout=3)
        self.worker.join(timeout=2)
        stderr=self.proc.stderr.read(65536).decode(errors='replace') if self.proc.stderr else ''
        if self.proc.returncode!=0:raise AssertionError(f'Native gateway exit={self.proc.returncode}; stderr={stderr}')
        if self.reader_error:raise AssertionError(self.reader_error)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--binary',required=True,type=pathlib.Path);args=parser.parse_args()
    result={'scope':'Actual supplied Zag ELF + private-IPC synthetic browser. NOT Tauri, a live website, or a coding-harness qualification.',
      'status':'BLOCKED','tests':[],'passed':0,'failed':0}
    if not args.binary.is_file():
        result['reason']='Native binary is missing; no Python fallback gateway is provided.'
    else:
        host=None
        try:
            with tempfile.TemporaryDirectory(prefix='bridge-native-') as temp:
                root=pathlib.Path(temp);root.chmod(0o700)
                with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
                host=FixtureHost(args.binary.resolve(),root,port)
                def test(name,fn):
                    started=time.monotonic()
                    try:fn();result['tests'].append({'name':name,'status':'PASS','seconds':round(time.monotonic()-started,3)});print('PASS',name)
                    except Exception as exc:result['tests'].append({'name':name,'status':'FAIL','error':str(exc)});raise
                def require(condition,detail='Assertion failed'):
                    if not condition:raise AssertionError(detail)
                test('native_loopback_health',lambda:require(host.http('/health',auth=False)[0]==200))
                test('models_requires_local_key',lambda:require(host.http('/v1/models',auth=False)[0]==401))
                test('reject_origin_header',lambda:require(host.http('/health',auth=False,headers={'Origin':'https://evil.example'})[0]>=400))
                test('reject_rebinding_host',lambda:require(host.http('/health',auth=False,headers={'Host':'evil.example'})[0]>=400))
                test('symbolic_fixture_observation',host.ready)
                test('native_model_registry',lambda:require(len(json.loads(host.http('/v1/models')[2])['data'])==1))
                chat={'model':host.model,'messages':[{'role':'user','content':'hello'}],'stream':False}
                test('invalid_json_rejected',lambda:require(host.http('/v1/chat/completions',b'{')[0]==400))
                test('duplicate_json_key_rejected',lambda:require(host.http('/v1/chat/completions',b'{"model":"x","model":"y"}')[0]==400))
                def turns():
                    for turn in range(22):
                        data=chat|{'messages':[{'role':'user','content':f'turn {turn}'}]}
                        status,_,body=host.http('/v1/chat/completions',data,headers={'X-Bridge-Session':'native-22-turns'})
                        require(status==200,body.decode(errors='replace'));require('🎯漢字' in json.loads(body)['choices'][0]['message']['content'])
                    current=next(s for s in host.call('state.get')['sessions'] if s['id']=='native-22-turns')
                    require(current['turn_count']==22,str(current));require(len([a for a in host.actions if a.get('type')=='generate' and a.get('new_chat')])==1)
                test('22_incremental_turns_one_conversation',turns);host.end_sessions()
                def stream(path,payload,marker):
                    status,_,body=host.http(path,payload);require(status==200,body.decode(errors='replace'));require(marker in body,body.decode(errors='replace'));host.end_sessions()
                test('chat_sse_frames',lambda:stream('/v1/chat/completions',chat|{'stream':True},b'data: [DONE]'))
                test('anthropic_sse_frames',lambda:stream('/v1/messages',chat|{'stream':True,'max_tokens':128},b'message_stop'))
                test('responses_sse_frames',lambda:stream('/v1/responses',{'model':host.model,'input':'hello','stream':True},b'response.completed'))
                def tools():
                    fixture=root/'fixture.txt';fixture.write_text('bounded tool result')
                    definition={'type':'function','function':{'name':'read_file','description':'Read fixture.txt only',
                      'parameters':{'type':'object','properties':{'path':{'type':'string'}},'required':['path']}}}
                    host.mode='tool'
                    status,_,body=host.http('/v1/chat/completions',chat|{'tools':[definition]},headers={'X-Bridge-Session':'native-tool'})
                    require(status==200,body.decode(errors='replace'));call=json.loads(body)['choices'][0]['message']['tool_calls'][0]
                    parameters=json.loads(call['function']['arguments']);require(parameters=={'path':'fixture.txt'})
                    # Intentionally fixed fixture path: no model-driven shell or arbitrary filesystem access.
                    output=fixture.read_text();host.mode='normal'
                    status,_,body=host.http('/v1/chat/completions',chat|{'tools':[definition],
                      'messages':[{'role':'tool','tool_call_id':call['id'],'content':output}]},headers={'X-Bridge-Session':'native-tool'})
                    require(status==200,body.decode(errors='replace'));host.end_sessions()
                test('bounded_tool_fixture_cycle',tools)
                def cancellation():
                    host.mode='hold';host.stopped.clear()
                    connection=http.client.HTTPConnection('127.0.0.1',host.port,timeout=8)
                    connection.request('POST','/v1/chat/completions',json.dumps(chat|{'stream':True}),
                      {'Authorization':f'Bearer {host.key}','Content-Type':'application/json'})
                    response=connection.getresponse();require(response.status==200);response.close();connection.close()
                    require(host.stopped.wait(5),'Client disconnect did not produce provider stop');host.mode='normal';host.end_sessions()
                test('disconnect_emits_provider_stop',cancellation)
                def rotation():
                    old=host.key;host.call('key.regenerate',{'confirmed':True})
                    require(host.http('/v1/models')[0]==401);host.key=host.call('key.reveal')['token'];require(old!=host.key)
                    require(host.http('/v1/models')[0]==200)
                test('token_rotation_invalidates_old_key',rotation)
                test('graceful_native_shutdown',host.close);host=None
                result['status']='PASS'
        except Exception as exc:
            result['status']='FAIL';result['error']=str(exc);result['traceback']=traceback.format_exc();traceback.print_exc()
        finally:
            if host:
                try:host.close()
                except Exception:pass
    result['passed']=sum(t['status']=='PASS' for t in result['tests']);result['failed']=sum(t['status']=='FAIL' for t in result['tests'])
    out=ROOT/'tests/evidence/native-gateway-tests.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,indent=2))
    print(json.dumps({k:v for k,v in result.items() if k!='tests'},indent=2))
    return 0 if result['status']=='PASS' else (77 if result['status']=='BLOCKED' else 1)
if __name__=='__main__':sys.exit(main())
