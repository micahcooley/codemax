"""Actual compiled UI tests; native transport and provider facts are TEST DOUBLES.
Does not claim to exercise native admission, MCP protocol, tools, or website login.
"""
from __future__ import annotations
import json, os, pathlib, subprocess, time, traceback
from playwright.sync_api import sync_playwright, expect
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'tests/evidence'; SHOTS=ROOT/'screenshots'
modules=json.loads(subprocess.check_output(['node',str(ROOT/'tests/render-module-graph.mjs'),str(ROOT/'dist')],text=True))
results=[]; errors=[]
def record(name,fn):
 start=time.monotonic()
 try: fn(); results.append({'name':name,'status':'PASS','seconds':round(time.monotonic()-start,3)});print('PASS',name,flush=True)
 except Exception as exc: results.append({'name':name,'status':'FAIL','error':str(exc)});raise
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1500,'height':1020},device_scale_factor=1);page.set_default_timeout(7000)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Codemax compiled UI fixture verification</title></head><body><div id="app"></div></body></html>')
 page.add_style_tag(content=(ROOT/'dist/ui.css').read_text())
 page.evaluate('(html)=>window.__fixtureWebsite=html',(ROOT/'tests/fixtures/ui-website.html').read_text());page.evaluate((ROOT/'tests/fixtures/ui-host.js').read_text())
 page.evaluate('''(modules)=>{const imports={};for(const [key,code]of Object.entries(modules))imports[key]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);}''',modules)
 page.add_script_tag(type='module',content="import 'bridge/src/main.js';");page.wait_for_selector('.app-shell',timeout=20000)
 def route(label):
  page.get_by_role('button',name='Codemax menu',exact=True).click()
  page.get_by_role('menuitem',name=label,exact=True).click()
  page.wait_for_timeout(120)
 def ops(name):return page.evaluate('(op)=>window.__uiFixture.calls.filter(c=>c.op===op)',name)
 def dismiss():
  if page.get_by_role('button',name='Dismiss notification').count():page.get_by_role('button',name='Dismiss notification').click()
 try:
  def detection_filter():
   route('Providers');expect(page.locator('.provider-choice')).to_have_count(1)
   assert page.locator('.provider-choice').inner_text().startswith('LT\nLocal test provider') or 'Local test provider' in page.locator('.provider-choice').inner_text()
   assert not page.get_by_text('Advanced · overrides, mapping, and lifecycle',exact=True).locator('..').get_attribute('open')
   assert not page.get_by_role('button',name='Save overrides').is_visible()
   page.get_by_text('Other browser profiles · 2 not exposed',exact=True).click()
   assert page.get_by_text('No provider evidence; browsing only',exact=False).count()==2
   page.get_by_text('Other browser profiles · 2 not exposed',exact=True).click()
  record('Only detected profiles appear as providers; technical controls collapsed',detection_filter)
  def exposure():
   page.get_by_role('checkbox',name='Expose Mock Coder',exact=True).uncheck()
   assert ops('model.update')[-1]['params']=={'provider_id':1,'model':'p1/mock-coder','enabled':False}
   route('Connect a client');page.get_by_role('button',name='Save config').click();page.wait_for_function('window.__lastExport')
   v=json.loads(page.evaluate('window.__lastExport.content'));assert 'p1/mock-coder' not in v['provider']['bridge']['models']
   route('Providers');page.get_by_role('checkbox',name='Expose provider to harness',exact=True).uncheck()
   route('Connect a client');expect(page.get_by_role('button',name='Save config')).to_be_disabled()
   assert page.get_by_text('There are no ready, enabled models yet.',exact=False).count()
   route('Providers');page.get_by_role('checkbox',name='Expose provider to harness',exact=True).check();page.get_by_role('checkbox',name='Expose Mock Coder',exact=True).check()
  record('Per-model and per-provider exposure changes actual generated harness config',exposure)
  def policy():
   page.get_by_role('checkbox',name='Scan provider automatically',exact=True).uncheck();assert ops('provider.update')[-1]['params']['scan_enabled'] is False
   page.get_by_role('checkbox',name='Scan provider automatically',exact=True).check()
   page.get_by_text('Advanced · overrides, mapping, and lifecycle',exact=True).click();page.get_by_role('button',name='Treat as an ordinary website').click()
   expect(page.get_by_role('heading',name='Browse first. Providers follow.')).to_be_visible()
   page.get_by_text('Other browser profiles · 3 not exposed',exact=True).click();page.get_by_role('button',name='Resume discovery').click()
   expect(page.locator('.provider-choice')).to_have_count(1)
   page.get_by_role('checkbox',name='Expose provider to harness',exact=True).check()
  record('Pause, exclusion and resume controls send scoped policies without onboarding wizard',policy)
  def metadata():
   page.get_by_text('Detected capabilities · model, reasoning, and context',exact=True).click()
   page.evaluate("Object.assign(window.__uiFixture.snapshot.providers[0].models[1].context,{nominal:65536,source:'PROVIDER_METADATA'});window.__uiFixture.snapshot.providers[0].models[1].tokenizer.name='fixture-tokenizer';window.__uiFixture.push()")
   page.get_by_text('65,536 · website reported',exact=True).wait_for()
   assert page.get_by_text('Unknown',exact=True).count()>=2
   dismiss();page.locator('.screen').evaluate('(e)=>e.scrollTop=0');page.screenshot(animations='disabled',path=str(SHOTS/'09-provider-settings.png'))
  record('Provider-reported context separated from unknown limits and tokenizer execution',metadata)
  def harness():
   route('Connect a client');page.locator('.segmented button').filter(has_text='Claude Code').click()
   page.get_by_text('Manual connection details · endpoint and local access token',exact=True).click()
   page.get_by_role('button',name='Copy API endpoint').click();page.wait_for_function("window.__clipboard==='http://127.0.0.1:7331'")
   route('Providers');route('Connect a client');expect(page.locator('.segmented button.active')).to_have_text('Claude Code')
   page.locator('.segmented button').filter(has_text='OpenCode').click()
   page.evaluate("let p=window.__uiFixture.snapshot.providers[0];p.models.push({...p.models[0],id:'p1/new-observed',display_name:'New observed fixture model'});window.__uiFixture.push()")
   page.get_by_role('button',name='Save config').click();page.wait_for_function("window.__lastExport.content.includes('p1/new-observed')")
   assert 'google' not in page.evaluate('window.__lastExport.content')
   dismiss();page.locator('.screen').evaluate('(e)=>e.scrollTop=0');page.screenshot(animations='disabled',path=str(SHOTS/'10-harness-setup.png'))
  record('Harness choice persists; new registry events update config without reload',harness)
  def ordinary():
   page.keyboard.press('Control+l');page.get_by_role('textbox',name='Address bar').fill('google.com');page.keyboard.press('Enter')
   page.wait_for_function("window.__uiFixture.snapshot.providers.some(p=>p.origin==='https://google.com')")
   assert ops('provider.add')[-1]['params']['url']=='https://google.com/' or ops('provider.add')[-1]['params']['url']=='https://google.com'
   p=page.evaluate("window.__uiFixture.snapshot.providers.find(p=>p.origin==='https://google.com')");assert not p['detected'] and not p['models']
   route('Providers');expect(page.locator('.provider-choice')).to_have_count(1)
   assert not ops('connector.pick') and not ops('filesystem.prepare')
  record('Normal address navigation creates ordinary tab, not an exposed provider',ordinary)
  def import_config():
   route('Tools & MCP');expect(page.get_by_role('button',name='Start in website')).to_be_disabled()
   page.get_by_role('button',name='Add tool server').click()
   page.evaluate("window.__importDocument={mcpServers:{'Local fixture tools':{command:'node',args:['/UI-FIXTURE-ONLY/mcp-server.mjs'],env:{SECRET:'must-not-be-imported'}},remote:{url:'https://example.invalid/mcp'}}}")
   page.get_by_role('button',name='Import configuration',exact=True).click()
   expect(page.get_by_role('textbox',name='MCP server name')).to_have_value('Local fixture tools')
   page.get_by_role('button',name='Save server',exact=True).click()
   sent=ops('mcp.server.add')[-1]['params'];assert 'env' not in sent and sent['command']=='node' and 'SECRET' not in json.dumps(sent)
   assert not ops('mcp.server.connect')
  record('Import only command/argv; strips credential env and does not start process',import_config)
  def process_consent():
   page.get_by_role('button',name='Connect',exact=True).click()
   expect(page.get_by_role('button',name='Allow process and connect')).to_be_disabled()
   page.get_by_role('checkbox',name='Trust MCP executable',exact=True).check();page.get_by_role('button',name='Allow process and connect').click()
   page.get_by_role('checkbox',name='Enable MCP tool read_note',exact=True).wait_for()
   assert ops('mcp.server.connect')[-1]['params']['confirmed'] is True
   expect(page.get_by_role('checkbox',name='Enable MCP tool read_note')).not_to_be_checked()
   page.get_by_role('textbox',name='MCP task',exact=True).fill('Read the fixture note and summarize it. UI test only.')
   expect(page.get_by_role('button',name='Start in website')).to_be_disabled()
   page.get_by_role('checkbox',name='Enable MCP tool read_note').check()
   expect(page.get_by_role('button',name='Start in website')).to_be_enabled()
  record('Explicit local-process trust plus disabled-by-default per-tool exposure',process_consent)
  def approved_tool():
   page.get_by_role('checkbox',name='Automatically continue tool results').uncheck()
   page.get_by_role('button',name='Start in website').click();page.get_by_role('heading',name='Approve this tool call').wait_for()
   assert not ops('mcp.run.approve')
   assert ops('mcp.run.start')[-1]['params']['auto_continue'] is False
   assert page.locator('.tool-call pre').inner_text()=='{"path":"test-fixture.txt"}'
   dismiss();page.locator('.tool-call').scroll_into_view_if_needed();page.screenshot(animations='disabled',path=str(SHOTS/'11-mcp-permission.png'))
   page.get_by_role('button',name='Allow once',exact=True).click()
   assert ops('mcp.run.approve')[-1]['params']=={'run_id':'ui-run-1','call_id':'ui-call-1','confirmed':True,'allow_run':False}
   page.evaluate("Object.assign(window.__uiFixture.snapshot.mcp_run,{state:'RESULT_READY',last_result:'{\"content\":[{\"type\":\"text\",\"text\":\"UI fixture data, not a real file\"}]}'});window.__uiFixture.push()")
   page.get_by_role('button',name='Insert result and send').click();assert ops('mcp.run.continue')[-1]['params']['run_id']=='ui-run-1'
   page.get_by_role('button',name='Stop task and revoke permissions').click()
  record('Per-call approval binds run/call; optional manual result insertion continues same run',approved_tool)
  def deny_and_auto():
   before=len(ops('mcp.run.approve'))
   page.get_by_role('button',name='Start in website').click();page.get_by_role('button',name='Deny and stop',exact=True).click()
   assert len(ops('mcp.run.approve'))==before and ops('mcp.run.cancel')[-1]['params']['run_id']=='ui-run-1'
   page.get_by_role('button',name='Start in website').click();page.get_by_text('Advanced · automatic execution for this task',exact=True).click()
   page.get_by_role('checkbox',name='Allow MCP tool for task').check();page.get_by_role('button',name='Allow tool for this task').click()
   assert ops('mcp.run.approve')[-1]['params']['allow_run'] is True
   page.get_by_role('button',name='Stop task and revoke permissions').click()
  record('Deny submits no approval; broader per-task tool permission is explicit advanced opt-in',deny_and_auto)
  def escaping():
   page.evaluate("Object.assign(window.__uiFixture.snapshot.mcp_run,{state:'COMPLETED',answer:'<img src=x onerror=alert(1)>',last_result:'<script>window.__injected=true</script>'});window.__uiFixture.push()")
   expect(page.locator('.tool-answer')).to_have_text('<img src=x onerror=alert(1)>')
   assert page.locator('.tool-answer img').count()==0
   assert page.evaluate('window.__injected') is None
   page.set_viewport_size({'width':1050,'height':780});page.wait_for_timeout(100)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  record('Untrusted model/tool text escaped and compact viewport has no document overflow',escaping)
  record('No JavaScript runtime errors in new discovery/MCP screens',lambda: (_ for _ in ()).throw(AssertionError(errors)) if errors else None)
 except Exception:
  page.screenshot(path=str(OUT/'codemax-ui-failure.png'));traceback.print_exc()
 finally:
  report={'scope':'Actual compiled Svelte UI with explicitly mocked Tauri backend and provider facts. No native MCP/file/provider execution.','passed':sum(r['status']=='PASS' for r in results),'failed':sum(r['status']=='FAIL' for r in results),'tests':results,'runtime_errors':errors}
  (OUT/'codemax-ui.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));browser.close()
if report['failed'] or errors:raise SystemExit(1)
