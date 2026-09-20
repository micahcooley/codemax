#!/usr/bin/env python3
"""Black-box tests of the real compiled MCP executable and real kernel I/O.
No fake model, tool server or filesystem implementation is used.
"""
import hashlib, json, os, pathlib, select, shutil, subprocess, tempfile, time, unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
BINARY=pathlib.Path(os.environ.get('CODEMAX_TOOLS_BINARY',ROOT/'build/codemax-local-tools'))
META={'io.modelcontextprotocol/protocolVersion':'2026-07-28','io.modelcontextprotocol/clientInfo':{'name':'native-test','version':'1'},'io.modelcontextprotocol/clientCapabilities':{}}
class NativeProcess:
 def __init__(self, path, grants=(), legacy=False):
  self.seq=0; self.legacy=legacy
  kw={'user':65534,'group':65534,'extra_groups':[]} if os.geteuid()==0 else {}
  self.p=subprocess.Popen([str(BINARY),'--workspace',str(path),*grants],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1,env={'PATH':'/usr/bin:/bin','HOME':'/nonexistent','CANARY_SECRET':'must-not-leak'},**kw)
 def raw(self, value):
  self.p.stdin.write(value+'\n'); self.p.stdin.flush()
  ready,_,_=select.select([self.p.stdout],[],[],6)
  if not ready: raise AssertionError('native RPC exceeded 6s')
  line=self.p.stdout.readline()
  if not line: raise AssertionError('native process exited: '+self.p.stderr.read())
  return json.loads(line)
 def rpc(self,method,params=None):
  self.seq+=1; params=dict(params or {})
  if not self.legacy: params['_meta']=META
  return self.raw(json.dumps({'jsonrpc':'2.0','id':self.seq,'method':method,'params':params}))
 def call(self,name,**args):
  reply=self.rpc('tools/call',{'name':name,'arguments':args})
  if 'error' in reply: return {'ok':False,'rpc_error':reply['error']}
  return reply['result']['structuredContent']
 def close(self):
  self.p.stdin.close()
  try:self.p.wait(timeout=3)
  except subprocess.TimeoutExpired:self.p.kill();self.p.wait()
  err=self.p.stderr.read();self.p.stdout.close();self.p.stderr.close()
  if 'ERROR: AddressSanitizer' in err or 'runtime error:' in err:raise AssertionError(err)
  if self.p.returncode!=0:raise AssertionError(f'native process exited {self.p.returncode}: {err}')
class RealNativeTools(unittest.TestCase):
 def setUp(self):
  self.root=pathlib.Path(tempfile.mkdtemp(prefix='codemax-real-'));os.chmod(self.root,0o700)
  if os.geteuid()==0:os.chown(self.root,65534,65534)
  self.clients=[];self.c=self.client('--allow-write','--allow-trusted-commands')
 def tearDown(self):
  for c in self.clients:c.close()
  shutil.rmtree(self.root)
 def client(self,*grants,legacy=False):
  c=NativeProcess(self.root,grants,legacy);self.clients.append(c);return c
 def seed(self,path,text):
  p=self.root/path;p.write_bytes(text.encode() if isinstance(text,str) else text);os.chmod(p,0o600)
  if os.geteuid()==0:os.chown(p,65534,65534)
  return hashlib.sha256(p.read_bytes()).hexdigest()
 def test_current_discover(self):
  r=self.c.rpc('server/discover')['result'];self.assertEqual(r['resultType'],'complete');self.assertIn('2026-07-28',r['supportedVersions'])
 def test_current_catalog(self):
  r=self.c.rpc('tools/list')['result'];self.assertEqual(len(r['tools']),9);self.assertEqual(r['cacheScope'],'private');self.assertEqual(r['ttlMs'],30000)
 def test_legacy(self):
  c=self.client(legacy=True);self.assertIn('error',c.rpc('tools/list'))
  self.assertEqual(c.rpc('initialize',{'protocolVersion':'2025-11-25','capabilities':{},'clientInfo':{'name':'test','version':'1'}})['result']['protocolVersion'],'2025-11-25')
  c.p.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');c.p.stdin.flush()
  self.assertEqual(len(c.rpc('tools/list')['result']['tools']),3)
 def test_read_real_bytes(self):
  h=self.seed('notes.txt','hello\nκόσμος');r=self.c.call('read_file',path='notes.txt');self.assertTrue(r['ok']);self.assertEqual(r['sha256'],h);self.assertEqual(r['text'],'hello\nκόσμος')
 def test_create_and_replace(self):
  r=self.c.call('write_file',path='new.txt',text='one');self.assertTrue(r['ok']);self.assertEqual((self.root/'new.txt').read_text(),'one')
  self.assertFalse(self.c.call('write_file',path='new.txt',text='bad')['ok'])
  self.assertTrue(self.c.call('write_file',path='new.txt',text='two',expected_sha256=r['sha256'])['ok']);self.assertEqual((self.root/'new.txt').read_text(),'two')
 def test_edit_real_file(self):
  h=self.seed('a','abc def');r=self.c.call('edit_file',path='a',old_text='def',new_text='ghi',expected_sha256=h);self.assertTrue(r['ok']);self.assertEqual((self.root/'a').read_text(),'abc ghi')
 def test_ambiguous_edit_refused(self):
  h=self.seed('a','same same');self.assertFalse(self.c.call('edit_file',path='a',old_text='same',new_text='other',expected_sha256=h)['ok']);self.assertEqual((self.root/'a').read_text(),'same same')
 def test_overlapping_edit_refused(self):
  h=self.seed('a','aaa');self.assertFalse(self.c.call('edit_file',path='a',old_text='aa',new_text='other',expected_sha256=h)['ok']);self.assertEqual((self.root/'a').read_text(),'aaa')
 def test_executable_mode_preserved(self):
  h=self.seed('a','original');os.chmod(self.root/'a',0o700)
  self.assertTrue(self.c.call('write_file',path='a',text='replacement',expected_sha256=h)['ok']);self.assertEqual((self.root/'a').stat().st_mode&0o777,0o700)
 def test_move_real_file(self):
  h=self.seed('a','hello');self.assertTrue(self.c.call('create_directory',path='dir')['ok']);self.assertTrue(self.c.call('move_file',path='a',destination='dir/b',expected_sha256=h)['ok']);self.assertFalse((self.root/'a').exists());self.assertEqual((self.root/'dir/b').read_text(),'hello')
 def test_move_no_overwrite(self):
  h=self.seed('a','a');self.seed('b','b');self.assertFalse(self.c.call('move_file',path='a',destination='b',expected_sha256=h)['ok']);self.assertEqual((self.root/'b').read_text(),'b')
 def test_delete_is_recoverable(self):
  h=self.seed('a','recover me');r=self.c.call('delete_file',path='a',expected_sha256=h,confirm=True);self.assertTrue(r['ok']);self.assertFalse((self.root/'a').exists());self.assertEqual((self.root/'.codemax-trash'/r['recovery_id']).read_text(),'recover me')
 def test_delete_confirmation(self):
  h=self.seed('a','keep');self.assertFalse(self.c.call('delete_file',path='a',expected_sha256=h,confirm=False)['ok']);self.assertTrue((self.root/'a').exists())
 def test_readonly_grant(self):
  c=self.client();self.assertEqual(len(c.rpc('tools/list')['result']['tools']),3);self.assertFalse(c.call('write_file',path='a',text='bad')['ok']);self.assertFalse(c.call('run_command',command='pwd')['ok'])
 def test_search_and_list(self):
  self.seed('a','find this needle');self.seed('b','nothing');r=self.c.call('search_files',query='needle');self.assertEqual(r['matches'][0]['path'],'a');self.assertEqual([e['name'] for e in self.c.call('list_directory')['entries']],['a','b'])
 def test_traversal(self):
  for p in ['../etc/passwd','/etc/passwd','a/../b','./a','a\\b','a//b','a/','\x01a']:
   with self.subTest(path=p):self.assertFalse(self.c.call('read_file',path=p)['ok'])
 def test_secret_paths(self):
  for p in ['.env','.env.local','.ssh/id_rsa','.git-credentials','.codemax-trash/a']:
   with self.subTest(path=p):self.assertFalse(self.c.call('read_file',path=p)['ok'])
 def test_symlink_denied(self):
  (self.root/'link').symlink_to('/etc/passwd');self.assertFalse(self.c.call('read_file',path='link')['ok']);self.assertFalse(self.c.call('write_file',path='link',text='bad')['ok'])
 def test_directory_symlink_denied(self):
  (self.root/'sub').symlink_to('/tmp',target_is_directory=True);self.assertFalse(self.c.call('write_file',path='sub/new',text='bad')['ok'])
 def test_hardlink_denied(self):
  self.seed('a','private');os.link(self.root/'a',self.root/'b');self.assertFalse(self.c.call('read_file',path='a')['ok'])
 def test_fifo_denied_without_block(self):
  os.mkfifo(self.root/'pipe');self.assertFalse(self.c.call('read_file',path='pipe')['ok'])
 def test_non_utf8_refused(self):
  self.seed('a',b'\xff\x00\xfe');self.assertFalse(self.c.call('read_file',path='a')['ok'])
 def test_ranges(self):
  self.seed('a','aéz');self.assertEqual(self.c.call('read_file',path='a',offset=0,length=2)['text'],'a');self.assertFalse(self.c.call('read_file',path='a',offset=2)['ok']);self.assertEqual(self.c.call('read_file',path='a',offset=1,length=2)['text'],'é')
 def test_revision_conflict(self):
  h=self.seed('a','before');self.seed('a','new');self.assertFalse(self.c.call('write_file',path='a',text='lost',expected_sha256=h)['ok']);self.assertEqual((self.root/'a').read_text(),'new')
 def test_invalid_arguments(self):
  self.assertFalse(self.c.call('read_file',path='a',unrecognized=True)['ok']);self.assertFalse(self.c.call('read_file',path='a',offset='0')['ok'])
 def test_duplicate_keys(self):
  r=self.c.raw('{"jsonrpc":"2.0","id":1,"method":"tools/call","method":"server/discover"}');self.assertEqual(r['error']['code'],-32700)
 def test_duplicate_escaped_keys(self):
  r=self.c.raw('{"jsonrpc":"2.0","id":1,"method":"server/discover","m\\u0065thod":"tools/list"}');self.assertEqual(r['error']['code'],-32700)
 def test_unsupported_version(self):
  r=self.c.raw('{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"3000"}}}');self.assertIn('error',r)
 def test_actual_command(self):
  r=self.c.call('run_command',command="printf 'created by a real child' > command.txt; cat command.txt");self.assertTrue(r['ok'],r);self.assertEqual(r['output'],'created by a real child');self.assertEqual((self.root/'command.txt').read_text(),r['output'])
 def test_command_environment(self):
  r=self.c.call('run_command',command='printf "%s" "$CANARY_SECRET"');self.assertTrue(r['ok']);self.assertEqual(r['output'],'')
 def test_command_timeout(self):
  t=time.monotonic();r=self.c.call('run_command',command='sleep 4',timeout_ms=120);self.assertTrue(r['timed_out']);self.assertLess(time.monotonic()-t,2)
 def test_command_output_limit(self):
  r=self.c.call('run_command',command='yes x',timeout_ms=1000);self.assertTrue(r['output_limited']);self.assertLessEqual(len(r['output']),16000)
 def test_command_nonzero(self):
  r=self.c.call('run_command',command='exit 7');self.assertFalse(r['ok']);self.assertEqual(r['exit_code'],7)
 def test_file_limit(self):
  self.seed('large',b'x'*1048577);self.assertFalse(self.c.call('read_file',path='large')['ok'])
 def test_sha256_boundaries(self):
  for n in [0,1,3,55,56,63,64,65,119,120,127,128,1000,65535,1048576]:
   with self.subTest(length=n):
    expected=self.seed('vector',bytes((32+i%95 for i in range(n))))
    r=self.c.call('read_file',path='vector');self.assertTrue(r['ok'],r);self.assertEqual(r['sha256'],expected)
 def test_current_requires_capabilities(self):
  r=self.c.raw(json.dumps({'jsonrpc':'2.0','id':1,'method':'tools/list','params':{'_meta':{'io.modelcontextprotocol/protocolVersion':'2026-07-28'}}}))
  self.assertEqual(r['error']['code'],-32602)
 def test_discover_cache_and_identity(self):
  r=self.c.rpc('server/discover')['result'];self.assertEqual(r['ttlMs'],30000);self.assertEqual(r['cacheScope'],'private')
  self.assertEqual(r['_meta']['io.modelcontextprotocol/serverInfo']['name'],'codemax-local-tools')
 def test_tool_results_are_not_cached(self):
  self.seed('a','first');r=self.c.rpc('tools/call',{'name':'read_file','arguments':{'path':'a'}})['result']
  self.assertNotIn('ttlMs',r);self.assertNotIn('cacheScope',r)
  self.seed('a','second');self.assertEqual(self.c.call('read_file',path='a')['text'],'second')
 def test_reconstruct_large_unicode_file(self):
  original=('one \U0001f40b café\n'*2000);self.seed('long',original);parts=[];offset=0
  while True:
   r=self.c.call('read_file',path='long',offset=offset);self.assertTrue(r['ok'],r)
   parts.append(r['text']);self.assertGreater(r['next_offset'],offset);offset=r['next_offset']
   self.assertLess(len(json.dumps(r).encode()),16000)
   if not r['truncated']:break
  self.assertEqual(''.join(parts),original);self.assertEqual(offset,len(original.encode()))
 def test_no_temporary_files_after_conflict(self):
  h=self.seed('a','first');self.seed('a','second');self.c.call('write_file',path='a',text='third',expected_sha256=h)
  self.assertEqual(sorted(p.name for p in self.root.iterdir()),['a'])
 def test_wrong_revision_does_not_trash(self):
  self.seed('a','keep');r=self.c.call('delete_file',path='a',expected_sha256='0'*64,confirm=True)
  self.assertFalse(r['ok']);self.assertTrue((self.root/'a').exists())
 def test_no_implicit_process_permission(self):
  c=self.client('--allow-write');names={t['name'] for t in c.rpc('tools/list')['result']['tools']}
  self.assertNotIn('run_command',names);self.assertFalse(c.call('run_command',command='touch denied')['ok']);self.assertFalse((self.root/'denied').exists())
 def test_same_file_reads_do_not_leak_descriptors(self):
  self.seed('a','read');fdpath=pathlib.Path('/proc')/str(self.c.p.pid)/'fd'
  self.assertTrue(self.c.call('read_file',path='a')['ok'])
  before=len(list(fdpath.iterdir()))
  for _ in range(75):self.assertTrue(self.c.call('read_file',path='a')['ok'])
  self.assertEqual(len(list(fdpath.iterdir())),before)
 def test_catalog_annotations_match_grants(self):
  tools={t['name']:t for t in self.c.rpc('tools/list')['result']['tools']}
  self.assertTrue(tools['read_file']['annotations']['readOnlyHint'])
  self.assertTrue(tools['run_command']['annotations']['openWorldHint'])
  self.assertTrue(tools['delete_file']['annotations']['destructiveHint'])
 def test_version_error_includes_negotiation_data(self):
  r=self.c.raw(json.dumps({'jsonrpc':'2.0','id':7,'method':'server/discover','params':{'_meta':{'io.modelcontextprotocol/protocolVersion':'2099-01-01','io.modelcontextprotocol/clientCapabilities':{}}}}))
  self.assertEqual(r['error']['code'],-32022);self.assertEqual(r['error']['data'],{'supported':['2026-07-28'],'requested':'2099-01-01'})
 def test_modern_has_no_initialize(self):
  r=self.c.rpc('initialize',{'protocolVersion':'2025-11-25'});self.assertEqual(r['error']['code'],-32601)
 def test_discover_requires_metadata(self):
  r=self.c.raw('{"jsonrpc":"2.0","id":1,"method":"server/discover"}');self.assertEqual(r['error']['code'],-32602)
 def test_no_implicit_multi_round_replay(self):
  for field in ('requestState','inputResponses'):
   r=self.c.rpc('tools/call',{'name':'write_file','arguments':{'path':'not-created','text':'bad'},field: [] if field=='inputResponses' else 'opaque'})
   self.assertEqual(r['error']['code'],-32602);self.assertFalse((self.root/'not-created').exists())
 def test_omitted_empty_arguments(self):
  r=self.c.rpc('tools/call',{'name':'list_directory'});self.assertTrue(r['result']['structuredContent']['ok'])
 def test_unknown_catalog_cursor(self):
  self.assertEqual(self.c.rpc('tools/list',{'cursor':'stale'})['error']['code'],-32602)
 def start_command(self,command):
  self.c.seq+=1;ident=self.c.seq
  frame={'jsonrpc':'2.0','id':ident,'method':'tools/call','params':{'_meta':META,'name':'run_command','arguments':{'command':command,'timeout_ms':5000}}}
  self.c.p.stdin.write(json.dumps(frame)+'\n');self.c.p.stdin.flush()
  until=time.monotonic()+2
  while not (self.root/'started').exists():
   if time.monotonic()>until:raise AssertionError('real child did not start')
   time.sleep(.005)
  return ident
 def next_frame(self):
  ready,_,_=select.select([self.c.p.stdout],[],[],2)
  if not ready:raise AssertionError('native reply deadline')
  return json.loads(self.c.p.stdout.readline())
 def cancel_notification(self,ident):
  return json.dumps({'jsonrpc':'2.0','method':'notifications/cancelled','params':{'requestId':ident}})+'\n'
 def test_mcp_cancellation_stops_real_command(self):
  ident=self.start_command('echo started > started; sleep 4; echo wrong > completed');began=time.monotonic()
  self.c.p.stdin.write(self.cancel_notification(ident));self.c.p.stdin.flush()
  r=self.next_frame();self.assertEqual(r['id'],ident);data=r['result']['structuredContent']
  self.assertTrue(data['cancelled']);self.assertFalse(data['timed_out']);self.assertFalse(data['ok']);self.assertLess(time.monotonic()-began,1)
  self.assertFalse((self.root/'completed').exists());self.assertEqual(len(self.c.rpc('tools/list')['result']['tools']),9)
 def test_unrelated_cancel_does_not_stop_command(self):
  ident=self.start_command('echo started > started; sleep .15; printf done')
  self.c.p.stdin.write(self.cancel_notification(ident+100));self.c.p.stdin.flush()
  data=self.next_frame()['result']['structuredContent'];self.assertTrue(data['ok']);self.assertFalse(data['cancelled']);self.assertEqual(data['output'],'done')
 def test_cancel_with_queued_rpc_preserves_frame_order(self):
  ident=self.start_command('echo started > started; sleep 4');self.c.seq+=1;second=self.c.seq
  request={'jsonrpc':'2.0','id':second,'method':'tools/list','params':{'_meta':META}}
  self.c.p.stdin.write(json.dumps(request)+'\n'+self.cancel_notification(ident));self.c.p.stdin.flush()
  first=self.next_frame();self.assertEqual(first['id'],ident);self.assertTrue(first['result']['structuredContent']['cancelled'])
  # TextIO may already have buffered the following complete frame after readline.
  second_frame=json.loads(self.c.p.stdout.readline());self.assertEqual(second_frame['id'],second);self.assertEqual(len(second_frame['result']['tools']),9)
if __name__=='__main__':unittest.main(verbosity=2)
