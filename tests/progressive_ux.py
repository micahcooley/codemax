"""Actual compiled UI interactions. Native transport, websites and MCP results
are labelled test doubles. Does NOT execute native Zag, Tauri or real MCP tools.
"""
from __future__ import annotations
import pathlib,re,json,os
from playwright.sync_api import sync_playwright,expect
# Shared boot fixture; do not execute the legacy suite on import.
exec(compile((pathlib.Path(__file__).with_name('ux_audit.py')).read_text().split('with sync_playwright() as pw:')[0],__file__,'exec'))
def route(page,name):
 page.get_by_role('button',name='Codemax menu',exact=True).click();page.get_by_role('menuitem',name=name,exact=True).click();page.wait_for_timeout(170)
def tools_seed(p):
 p.evaluate('(s)=>{window.__uiFixture.snapshot.mcp_servers=[s];window.__uiFixture.push()}',SERVER)
def library(p):
 route(p,'Tools & MCP');p.get_by_role('button',name='Tool library',exact=True).click()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 def shelf(p):
  open_site(p);expect(p.locator('.shelf-row')).to_have_count(1);expect(p.get_by_role('tablist')).to_have_count(1)
  expect(p.locator('.shelf-row [role=tab]')).to_have_count(0);expect(p.locator('.shelf-row .tab-close')).to_have_count(0)
  assert p.evaluate('window.__uiFixture.bounds.x')==194
  assert not p.locator('.inspector').count()
 run(browser,'Default shelf shows only registered providers and never duplicates tab controls',shelf)
 def collapse(p):
  open_site(p);p.keyboard.press('Control+Shift+b');p.wait_for_function('window.__uiFixture.bounds.x===0')
  p.evaluate('window.__app.restoreLayout()');expect(p.get_by_label('Registered providers',exact=True)).to_have_count(0)
  assert p.evaluate('window.__uiFixture.bounds.width')==1500
  p.get_by_role('button',name='Toggle provider sidebar',exact=True).click();expect(p.locator('.provider-shelf')).to_be_visible()
 run(browser,'Sidebar collapse fills the native surface and persists independently of the inspector',collapse)
 def reopened(p):
  open_site(p);p.get_by_role('button',name='Close Local test provider tab',exact=True).click()
  expect(p.get_by_role('tab',name='Local test provider',exact=True)).to_have_count(0)
  p.get_by_role('button',name='Open registered provider Local test provider',exact=True).click()
  expect(p.get_by_role('tab',name='Local test provider',exact=True)).to_have_count(1)
  p.get_by_role('button',name='Open registered provider Local test provider',exact=True).click()
  expect(p.get_by_role('tab',name='Local test provider',exact=True)).to_have_count(1)
 run(browser,'Closing and reopening a website leaves one saved provider and one browser tab',reopened)
 def provider_details(p):
  p.get_by_role('button',name='Settings for Local test provider',exact=True).click()
  expect(p.get_by_role('heading',name='Providers',exact=True)).to_be_visible()
  expect(p.locator('.provider-choice')).to_have_count(0);expect(p.get_by_role('combobox',name='Provider to configure')).to_be_visible()
  expect(p.get_by_role('textbox',name='Provider display name')).not_to_be_visible()
  expect(p.get_by_role('checkbox',name='Scan provider automatically')).not_to_be_visible()
 run(browser,'Provider settings open on demand without a second provider list or advanced controls',provider_details)
 def ordinary(p):
  p.get_by_role('textbox',name='Address bar').fill('google.com');p.keyboard.press('Enter')
  p.wait_for_function("window.__uiFixture.snapshot.providers.some(p=>p.origin==='https://google.com')")
  expect(p.locator('.shelf-row')).to_have_count(1)
 run(browser,'Ordinary browsing never creates a registered sidebar provider in the fixture flow',ordinary)
 def states(p):
  open_site(p);ring=p.locator('.provider-shelf .tab-activity')
  expect(ring).to_have_attribute('data-state','idle')
  p.evaluate('window.__uiFixture.snapshot.providers[0].browser_busy=true;window.__uiFixture.push()')
  expect(ring).to_have_attribute('data-state','working')
  p.emulate_media(reduced_motion='reduce');assert ring.locator('.activity-ring').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
  p.evaluate('window.__uiFixture.snapshot.providers[0].browser_busy=false;window.__uiFixture.snapshot.providers[0].exposed=false;window.__uiFixture.push()')
  expect(p.locator('.shelf-row')).to_have_count(1)
 run(browser,'Registry activity rings track real state fields, reduced motion and disabled exposure',states)
 def simple(p):
  route(p,'Connect a client');expect(p.locator('.quick-connect select')).to_have_count(2)
  expect(p.get_by_role('button',name='Copy private launch command',exact=True)).to_be_visible()
  expect(p.locator('pre:visible')).to_have_count(0)
  expect(p.get_by_role('button',name='Reveal API key')).not_to_be_visible()
  assert not ops(p,'key.reveal') and not ops(p,'api.start')
 run(browser,'Client setup initially exposes only client, model and one private-launch action',simple)
 def launch(p):
  p.evaluate('window.__uiFixture.snapshot.api.running=false;window.__uiFixture.push()');route(p,'Connect a client')
  p.get_by_role('button',name='Copy private launch command',exact=True).click();expect(p.locator('.setup-result')).to_contain_text('Launch command copied')
  calls=p.evaluate('window.__uiFixture.calls');start=next(i for i,c in enumerate(calls) if c.get('op')=='api.start');probe=next(i for i,c in enumerate(calls) if c.get('command')=='gateway_probe');key=next(i for i,c in enumerate(calls) if c.get('op')=='key.reveal')
  assert start<probe<key
  cmd=p.evaluate('window.__clipboard');assert 'OPENCODE_CONFIG_CONTENT' in cmd and 'sk-local-ui-fixture' in cmd
  assert not any(c.get('command')=='document_export' for c in calls)
  assert not re.search(r'client connected',p.locator('.setup-result').inner_text(),re.I)
 run(browser,'Private launch starts then probes then copies; no config overwrite or false client-connected claim',launch)
 def negative(p):
  p.evaluate("const old=window.__TAURI_INTERNALS__.invoke;window.__TAURI_INTERNALS__.invoke=(c,a)=>c==='gateway_probe'?Promise.resolve({healthy:false,round_trip_ms:2}):old(c,a);true")
  route(p,'Connect a client');p.get_by_role('button',name='Copy private launch command',exact=True).click()
  expect(p.locator('.setup-result')).to_contain_text('failed');assert not ops(p,'key.reveal');assert not p.evaluate('Boolean(window.__clipboard)')
 run(browser,'Failed gateway probe does not retrieve or copy a key',negative)
 def copy_error(p):
  p.evaluate("navigator.clipboard.writeText=async()=>{throw Error('Clipboard denied')};true")
  route(p,'Connect a client');p.get_by_role('button',name='Copy private launch command',exact=True).click()
  expect(p.locator('.setup-result')).to_contain_text('Clipboard denied');assert 'sk-local-ui-fixture' not in p.locator('body').inner_text()
 run(browser,'Clipboard failure is actionable and never renders the local key',copy_error)
 def leave(p):
  p.evaluate("const old=window.__TAURI_INTERNALS__.invoke;window.__TAURI_INTERNALS__.invoke=async(c,a)=>{if(c==='gateway_probe'){await new Promise(r=>setTimeout(r,500));}return old(c,a)};true")
  route(p,'Connect a client');p.get_by_role('button',name='Copy private launch command',exact=True).click();route(p,'Providers');p.wait_for_timeout(650)
  assert not ops(p,'key.reveal') and not p.evaluate('Boolean(window.__clipboard)')
 run(browser,'Navigating away cancels late credential retrieval and clipboard side effects',leave)
 def model_race(p):
  p.evaluate("const old=window.__TAURI_INTERNALS__.invoke;window.__TAURI_INTERNALS__.invoke=async(c,a)=>{if(c==='gateway_probe'){await new Promise(r=>setTimeout(r,180));window.__uiFixture.snapshot.providers[0].exposed=false;window.__uiFixture.push();await new Promise(r=>setTimeout(r,30));}return old(c,a)};true")
  route(p,'Connect a client');p.get_by_role('button',name='Copy private launch command',exact=True).click()
  expect(p.locator('.setup-result')).to_contain_text('changed');assert not ops(p,'key.reveal')
 run(browser,'Losing model exposure while connecting prevents a stale launch command',model_race)
 def optional_library(p):
  route(p,'Tools & MCP');expect(p.get_by_role('region',name='Tool library',exact=True)).to_have_count(0)
  expect(p.get_by_role('textbox',name='MCP executable')).to_have_count(0);expect(p.get_by_role('spinbutton',name='Task turn budget')).not_to_be_visible()
  p.get_by_role('button',name='Tool library',exact=True).click();expect(p.locator('.recipe-row')).to_have_count(5)
  assert not ops(p,'mcp.server.add') and not ops(p,'mcp.server.connect')
 run(browser,'Tool library and technical task settings are opt-in; browsing recipes never installs code',optional_library)
 def file_recipe(p):
  library(p);p.get_by_role('button',name=re.compile('^Project files')).click()
  expect(p.get_by_role('button',name='Use this definition',exact=True)).to_be_disabled()
  p.evaluate('window.__folderPick="/tmp/My Project"');p.get_by_role('button',name='Choose folder…',exact=True).click()
  expect(p.get_by_role('textbox',name='Tool folder')).to_have_value('/tmp/My Project')
  p.get_by_role('button',name='Use this definition',exact=True).click()
  expect(p.get_by_role('textbox',name='MCP arguments')).to_have_value('[\n  "-y",\n  "@modelcontextprotocol/server-filesystem@2026.8.31",\n  "/tmp/My Project"\n]')
  p.get_by_role('button',name='Save server',exact=True).click()
  assert ops(p,'mcp.server.add')[-1]['params']['args'][-1]=='/tmp/My Project' and not ops(p,'mcp.server.connect')
  p.get_by_role('button',name='Connect',exact=True).click();expect(p.get_by_role('button',name='Allow process and connect')).to_be_disabled()
 run(browser,'Folder picker fills one quoted argument; saving a recipe still requires separate process consent',file_recipe)
 def cancelled_picker(p):
  library(p);p.get_by_role('button',name=re.compile('^Git repositories')).click();p.get_by_role('textbox',name='Tool folder').fill('/tmp/my-repo')
  p.get_by_role('button',name='Choose folder…').click();expect(p.get_by_role('textbox',name='Tool folder')).to_have_value('/tmp/my-repo')
  assert not ops(p,'mcp.server.add')
 run(browser,'Cancelling the native folder dialog preserves the typed folder without effects',cancelled_picker)
 def root_refusal(p):
  library(p);p.get_by_role('button',name=re.compile('^Project files')).click();p.get_by_role('textbox',name='Tool folder').fill('/')
  p.get_by_role('button',name='Use this definition').click();expect(p.locator('.recipe-review .form-error')).to_contain_text('specific absolute folder')
  assert not ops(p,'mcp.server.add')
 run(browser,'Simple file recipe refuses a filesystem-root share or parent traversal',root_refusal)
 def catalog(p):
  tools_seed(p);route(p,'Tools & MCP');expect(p.get_by_role('checkbox',name='Enable MCP tool read_note')).not_to_be_visible()
  p.locator('.tool-catalog summary').click();p.get_by_role('searchbox',name='Filter Local fixture tools tools').fill('missing')
  expect(p.get_by_role('checkbox',name='Enable MCP tool read_note')).to_have_count(0)
  p.get_by_role('button',name='Clear filter',exact=True).click();expect(p.get_by_role('checkbox',name='Enable MCP tool read_note')).to_be_visible()
 run(browser,'Tool catalogs are collapsed and searchable; clearing a filter restores choices',catalog)
 def budget(p):
  tools_seed(p);route(p,'Tools & MCP');p.get_by_role('textbox',name='MCP task').fill('Summarize the permitted note')
  p.get_by_text('Task options',exact=True).click();expect(p.get_by_role('spinbutton',name='Task turn budget')).to_have_value('100');expect(p.get_by_role('spinbutton',name='Task work minutes')).to_have_value('30')
  p.get_by_role('spinbutton',name='Task turn budget').fill('9');expect(p.get_by_role('button',name='Start in website')).to_be_disabled()
  p.get_by_role('spinbutton',name='Task turn budget').fill('200');p.get_by_role('spinbutton',name='Task work minutes').fill('60');p.get_by_role('button',name='Start in website').click()
  sent=ops(p,'mcp.run.start')[-1]['params'];assert sent['turn_budget']==200 and sent['work_minutes']==60 and sent['auto_continue']
 run(browser,'Task options validate budgets and forward automatic result continuation to Zag',budget)
 def active_minimal(p):
  seed_task(p);route(p,'Tools & MCP');expect(p.get_by_role('heading',name='Approve this tool call')).to_be_visible()
  expect(p.get_by_role('button',name='Tool library',exact=True)).to_have_count(0);expect(p.get_by_role('heading',name='Tool servers')).to_have_count(0);expect(p.get_by_role('textbox',name='MCP task')).to_have_count(0)
  expect(p.get_by_role('checkbox',name='Allow MCP tool for task')).not_to_be_visible()
 run(browser,'Active tasks replace configuration panels with the relevant approval and stop controls',active_minimal)
 def pause_resume(p):
  seed_task(p);p.evaluate("Object.assign(window.__uiFixture.snapshot.mcp_run,{state:'PAUSED',can_resume:true,error:'WORK_BUDGET_REACHED',turns:100,calls:73,last_result:'saved result'});window.__uiFixture.push()")
  route(p,'Tools & MCP');expect(p.get_by_role('button',name='Continue task',exact=True)).to_be_enabled();expect(p.locator('.task-pause')).to_contain_text('No completed tool is replayed')
  p.get_by_role('button',name='Continue task',exact=True).click();expect(p.get_by_role('button',name='Allow once',exact=True)).to_be_visible()
  assert ops(p,'mcp.run.resume')[-1]['params']=={'run_id':'ux-run-1'} and not ops(p,'mcp.run.start') and not ops(p,'mcp.run.approve')
  assert p.evaluate('window.__uiFixture.snapshot.mcp_run.calls')==73
 run(browser,'Budget pause resumes the same run without starting over or replaying an approval',pause_resume)
 def unsupported_resume(p):
  seed_task(p);p.evaluate("Object.assign(window.__uiFixture.snapshot.mcp_run,{state:'PAUSED',can_resume:false});window.__uiFixture.push()")
  route(p,'Tools & MCP');expect(p.get_by_role('button',name='Continue task')).to_be_disabled()
  p.get_by_role('button',name='Stop task and revoke permissions').click();assert ops(p,'mcp.run.cancel') and not ops(p,'mcp.run.resume')
 run(browser,'Non-resumable state cannot be forced through UI; cancellation remains available',unsupported_resume)
 def quiet_progress(p):
  open_site(p);seed_task(p);p.evaluate("window.__uiFixture.snapshot.mcp_run.state='GENERATING';window.__uiFixture.push()")
  expect(p.locator('.task-attention')).to_have_count(0)
  expect(p.locator('.toolbar .mini-working')).to_have_count(1)
  p.evaluate("window.__uiFixture.snapshot.mcp_run.state='PAUSED';window.__uiFixture.snapshot.mcp_run.can_resume=true;window.__uiFixture.push()")
  expect(p.get_by_label('Task needs attention',exact=True)).to_be_visible()
 run(browser,'Routine task progress is quiet; a safe pause still surfaces attention while browsing',quiet_progress)
 def progress_text(p):
  seed_task(p);p.evaluate("window.__uiFixture.snapshot.mcp_run.state='EXECUTING_TOOL';window.__uiFixture.snapshot.mcp_servers[0].progress_message='Reading item 4 of 12';window.__uiFixture.push()")
  route(p,'Tools & MCP');expect(p.locator('.task-running')).to_contain_text('Reading item 4 of 12');assert not ops(p,'mcp.run.approve')
 run(browser,'Current MCP progress is visible as untrusted text without granting execution',progress_text)
 def sizing(p):
  for width,height in [(1500,980),(1000,680),(800,640)]:
   p.set_viewport_size({'width':width,'height':height});route(p,'Connect a client')
   assert p.locator('.screen').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
   route(p,'Tools & MCP');p.get_by_role('button',name='Tool library',exact=True).click()
   assert p.locator('.screen').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
   p.get_by_role('button',name='Close library').click();open_site(p)
   p.wait_for_function('window.__uiFixture.bounds.width+window.__uiFixture.bounds.x===innerWidth')
 run(browser,'Clean connection, library and browser layouts remain bounded at three window sizes',sizing)
 report={'scope':'Compiled Svelte and real Chromium; native-host and provider doubles. No native runtime or real external client/tool execution.','passed':sum(t['status']=='PASS' for t in results),'failed':sum(t['status']=='FAIL' for t in results),'runtime_errors':all_errors,'tests':results}
 (OUT/'progressive-ux.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='tests'},indent=2));browser.close()
if report['failed'] or all_errors:raise SystemExit(1)
