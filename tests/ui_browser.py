"""Render and interact with the ACTUAL compiled Svelte UI in Chromium.

The Tauri IPC surface and the provider surface are explicit test doubles.
This is not a native desktop, provider-login, or Zag execution test.
No HTTP navigation or network-policy modifications are performed.
"""
# Navigation updated for the registry shelf and nested disclosures. All prior
# behavioral assertions remain; default-visibility checks are in progressive_ux.py.
from __future__ import annotations
import json, os, pathlib, subprocess, time, traceback
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'tests/evidence';SHOTS=ROOT/'screenshots';OUT.mkdir(exist_ok=True);SHOTS.mkdir(exist_ok=True)
modules=json.loads(subprocess.check_output(['node',str(ROOT/'tests/render-module-graph.mjs'),str(ROOT/'dist')],text=True))
results=[];errors=[]
def record(name,fn):
    before=time.monotonic()
    try:fn();results.append({'name':name,'status':'PASS','seconds':round(time.monotonic()-before,3)});print('PASS',name,flush=True)
    except Exception as exc:results.append({'name':name,'status':'FAIL','error':str(exc)});print('FAIL',name,str(exc),flush=True);raise
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1500,'height':940},device_scale_factor=1)
 page.set_default_timeout(7000)
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.set_content('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Bridge compiled UI verification</title></head><body><div id="app"></div></body></html>')
 page.add_style_tag(content=(ROOT/'dist/ui.css').read_text())
 page.evaluate('(html)=>window.__fixtureWebsite=html',(ROOT/'tests/fixtures/ui-website.html').read_text())
 page.evaluate((ROOT/'tests/fixtures/ui-host.js').read_text())
 page.evaluate('''(modules)=>{const imports={};for(const [key,code] of Object.entries(modules))imports[key]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);}''',modules)
 page.add_script_tag(type='module',content="import 'bridge/src/main.js';")
 page.wait_for_selector('.app-shell',timeout=20000)
 def route(label):
  page.get_by_role('button',name='Codemax menu',exact=True).click()
  page.get_by_role('menuitem',name=label,exact=True).click()
  page.wait_for_timeout(120)
  if label=='Connect a client':page.get_by_text('Advanced setup and connection details',exact=True).click()
  if label=='Tools & MCP' and page.get_by_text('More setup',exact=True).count():page.get_by_text('More setup',exact=True).click()
 try:
  record('compiled Svelte startup, real runes and native-transport handshake',lambda:page.get_by_role('heading',name='Open a website.',exact=False).wait_for())
  def open_provider():
   page.locator('.tab-open').first.click();page.wait_for_function('window.__uiFixture.bounds.visible===true');page.wait_for_timeout(180)
   r=page.locator('#__fixture_provider').bounding_box();assert r and r['width']>1250 and r['height']>700 and r['x']==194,r
   assert len(page.locator('iframe').all())==1
   assert not page.locator('.inspector').count()
  record('browser-first layout with separately positioned provider surface',open_provider)
  page.screenshot(animations='disabled',path=str(SHOTS/'01-browser-workspace.png'))
  def keyboard():
   page.keyboard.press('Control+l');assert page.get_by_role('textbox',name='Address bar').evaluate('(el)=>document.activeElement===el')
   page.keyboard.press('Control+k');page.get_by_role('dialog').wait_for();page.wait_for_function('window.__uiFixture.bounds.visible===false')
   page.get_by_role('textbox',name='Search commands').fill('connect a client');page.keyboard.press('Enter');page.get_by_role('heading',name='Connect a client').wait_for();assert not page.get_by_role('dialog').count()
  record('Ctrl-L address focus and keyboard command palette with provider hiding',keyboard)
  page.screenshot(animations='disabled',path=str(SHOTS/'03-client-setup.png'))
  def client_controls():
   page.get_by_text('Advanced setup and connection details',exact=True).click()
   page.get_by_text('Manual connection details · endpoint and local access token',exact=True).click()
   page.get_by_role('button',name='Copy API endpoint').click();page.wait_for_function("window.__clipboard==='http://127.0.0.1:7331/v1'")
   page.get_by_role('button',name='Reveal API key').click();page.get_by_text('sk-local-ui-fixture-not-a-real-key',exact=True).wait_for()
   page.get_by_role('button',name='Hide API key').click();assert not page.get_by_text('sk-local-ui-fixture-not-a-real-key',exact=True).count()
   page.get_by_role('button',name='Copy API key',exact=True).click();page.wait_for_function("window.__clipboard==='sk-local-ui-fixture-not-a-real-key'")
   page.get_by_role('button',name='Save config').click();page.wait_for_function("window.__lastExport.name==='opencode.json'")
   value=json.loads(page.evaluate('window.__lastExport.content'));assert value['provider']['bridge']['npm']=='@ai-sdk/openai-compatible'
   page.get_by_text('Other clients · protocol examples',exact=True).click()
   for label in ['Claude Code','Chat API','Responses API','Messages API','OpenCode']:
    button=page.locator('.segmented button').filter(has_text=label)
    if not button.is_visible():page.get_by_text('Other clients · protocol examples',exact=True).click()
    button.click()
  record('endpoint/key controls and all five client configuration formats',client_controls)
  def file_permissions():
   route('Tools & MCP');page.get_by_text('Advanced · synthetic file permission diagnostic',exact=True).click()
   assert not page.get_by_role('button',name='Copy API endpoint').count()
   page.get_by_role('button',name='Prepare file test',exact=True).click()
   page.get_by_text('Allow this exact read?',exact=True).wait_for()
   assert not page.evaluate('window.__uiFixture.snapshot.file_probe.granted')
   assert page.get_by_role('combobox',name='Website test model').is_disabled()
   assert not page.evaluate("window.__uiFixture.calls.some(c=>c.op==='filesystem.allow')")
   if page.get_by_role('button',name='Dismiss notification').count():page.get_by_role('button',name='Dismiss notification').click()
   page.set_viewport_size({'width':1500,'height':1150})
   page.locator('.screen').evaluate('(e)=>e.scrollTop=0')
   page.wait_for_timeout(100)
   page.screenshot(animations='disabled',path=str(SHOTS/'05-file-permission.png'))
   page.set_viewport_size({'width':1500,'height':940})
   page.get_by_role('button',name='Deny',exact=True).click()
   page.get_by_text('Permission revoked',exact=True).wait_for()
   assert page.evaluate('window.__uiFixture.snapshot.file_probe.read_count')==0
   page.get_by_role('button',name='Prepare file test',exact=True).click()
   page.get_by_role('button',name='Allow one read and run',exact=True).click()
   page.get_by_text('Permissioned test in progress',exact=True).wait_for()
   assert page.evaluate("window.__uiFixture.calls.filter(c=>c.op==='filesystem.allow').at(-1).params.confirmed")
   assert page.get_by_role('combobox',name='Website test model').is_disabled()
   page.evaluate("Object.assign(window.__uiFixture.snapshot.file_probe,{state:'WAITING_FOR_REPLY',granted:false,read_count:1});window.__uiFixture.push()")
   page.wait_for_function("document.querySelectorAll('.proof-step.done').length>=2")
   page.screenshot(animations='disabled',path=str(SHOTS/'06-tool-in-progress.png'))
   page.get_by_role('button',name='Cancel and revoke',exact=True).click()
   page.get_by_text('Permission revoked',exact=True).wait_for()
   assert not page.evaluate('window.__uiFixture.snapshot.file_probe.granted')
   page.get_by_role('button',name='Prepare file test',exact=True).click()
   page.get_by_role('button',name='Allow one read and run',exact=True).click()
   # Test the pass presentation, not a claim of actual tool execution here.
   page.evaluate("Object.assign(window.__uiFixture.snapshot.file_probe,{state:'PASSED',granted:false,read_count:1,proof_verified:true,file_removed:true});window.__uiFixture.snapshot.providers[0].active=false;window.__uiFixture.push()")
   page.get_by_text('File contents verified',exact=True).wait_for()
   assert not page.get_by_role('button',name='Allow one read and run',exact=True).count()
  record('website-first client setup, explicit one-file consent, deny/revoke and state rendering',file_permissions)
  def tab_activity():
   page.locator('.tab-open').first.click()
   ring=page.locator('.browser-tab').first.locator('.tab-activity')
   arc=ring.locator('.activity-ring')
   page.wait_for_function("document.querySelector('.browser-tab .tab-activity').dataset.state==='idle'")
   assert arc.evaluate('(e)=>getComputedStyle(e).animationName')=='none'
   page.evaluate("window.__uiFixture.emit('bridge:browser',{provider_id:1,origin:'http://127.0.0.1:7340',loading:true})")
   page.wait_for_function("document.querySelector('.browser-tab .tab-activity').dataset.state==='working'")
   assert arc.evaluate('(e)=>getComputedStyle(e).animationName')!='none'
   page.evaluate("window.__uiFixture.emit('bridge:browser',{provider_id:1,origin:'http://127.0.0.1:7340',loading:false})")
   page.wait_for_function("document.querySelector('.browser-tab .tab-activity').dataset.state==='idle'")
   page.evaluate("window.__uiFixture.snapshot.providers[0].browser_busy=true;window.__uiFixture.push()")
   page.wait_for_function("document.querySelector('.browser-tab .tab-activity').dataset.state==='working'")
   assert ring.get_attribute('aria-label').endswith(': Generating')
   assert page.locator('.browser-tab').nth(1).locator('.tab-activity').get_attribute('data-state')=='idle'
   page.screenshot(path=str(SHOTS/'07-active-idle-tabs.png'))
   from PIL import Image
   import io
   frames=[]
   for frame in range(16):
    frames.append(Image.open(io.BytesIO(page.screenshot(clip={'x':0,'y':0,'width':1050,'height':150}))).convert('RGB'))
    page.wait_for_timeout(80)
   frames[0].save(SHOTS/'08-tab-activity.gif',save_all=True,append_images=frames[1:],duration=100,loop=0)
   page.emulate_media(reduced_motion='reduce')
   assert arc.evaluate('(e)=>getComputedStyle(e).animationName')=='none'
   assert ring.get_attribute('data-state')=='working'
   page.emulate_media(reduced_motion='no-preference')
   page.evaluate("window.__uiFixture.snapshot.providers[0].browser_busy=false;window.__uiFixture.snapshot.providers[0].state='DISCOVERING';window.__uiFixture.push()")
   page.wait_for_function("document.querySelector('.browser-tab .tab-activity').dataset.state==='idle'")
   assert ring.get_attribute('aria-label').endswith(': Observing controls')
   page.evaluate("window.__uiFixture.snapshot.providers[0].state='RATE_LIMITED';window.__uiFixture.push()")
   page.wait_for_function("document.querySelector('.browser-tab .tab-activity').dataset.state==='attention'")
   assert arc.evaluate('(e)=>getComputedStyle(e).animationName')=='none'
   page.evaluate("window.__uiFixture.snapshot.providers[0].state='READY';window.__uiFixture.push()")
  record('real CSS spinner, manual generation, idle ring, limit state and reduced motion',tab_activity)
  def model_search():
   route('Models');page.get_by_role('textbox',name='Search models').fill('coder');assert page.locator('tbody tr').count()==1
   page.get_by_role('button',name='Set Mock Coder as default').click();page.wait_for_function("window.__uiFixture.snapshot.settings.default_model==='p1/mock-coder'")
   page.get_by_role('textbox',name='Search models').fill('');page.get_by_role('button',name='Copy Mock Coder model ID').click();page.wait_for_function("window.__clipboard==='p1/mock-coder'")
  record('model filtering, exact identifier copy and backend-driven default selection',model_search)
  if page.get_by_role('button',name='Dismiss notification').count():page.get_by_role('button',name='Dismiss notification').click()
  page.screenshot(animations='disabled',path=str(SHOTS/'02-model-registry.png'))
  def settings():
   route('Settings');page.get_by_role('button',name='light theme').click();page.wait_for_function("document.documentElement.dataset.theme==='light'")
   page.get_by_role('switch',name='Compact density',exact=True).click();page.wait_for_function("document.querySelector('.app-shell').classList.contains('compact')")
   page.get_by_role('button',name='dark theme').click();page.get_by_role('switch',name='Compact density',exact=True).click()
   page.locator('.preferences-nav button').filter(has_text='Local gateway').click();page.get_by_role('spinbutton',name='Gateway port').fill('7450');page.get_by_role('button',name='Apply',exact=True).click();page.wait_for_function('window.__uiFixture.snapshot.api.port===7450')
   page.get_by_role('switch',name='Accept client connections').click();page.get_by_role('button',name='Stop gateway',exact=True).click();page.wait_for_function('window.__uiFixture.snapshot.api.running===false');page.get_by_role('switch',name='Accept client connections').click()
   page.get_by_role('spinbutton',name='Gateway port').fill('7331');page.get_by_role('button',name='Apply',exact=True).click()
   page.locator('.preferences-nav button').filter(has_text='Privacy & diagnostics').click();page.get_by_role('switch',name='Developer diagnostics').click();page.wait_for_function('window.__uiFixture.snapshot.developer_mode===true')
  record('theme, density, API port, listener control and developer setting round trips',settings)
  page.screenshot(animations='disabled',path=str(SHOTS/'04-settings.png'))
  def session():
   route('Sessions');page.get_by_role('textbox',name='Title for session fixture-review-01').fill('Receipt continuity audit');page.get_by_role('textbox',name='Title for session fixture-review-01').press('Tab');page.wait_for_function("window.__uiFixture.snapshot.sessions[0].title==='Receipt continuity audit'")
   page.get_by_role('textbox',name='Search sessions').fill('does not exist');assert page.locator('tbody tr').count()==0
   page.get_by_role('textbox',name='Search sessions').fill('');assert page.locator('tbody tr').count()==1
  record('session rename, retained title, search and context provenance',session)
  def lab():
   route('Detector');page.get_by_role('heading',name='Control mappings').wait_for();page.wait_for_function("document.querySelector('.evidence-box').textContent.includes('fixture-document-1')")
   page.get_by_role('button',name='Export',exact=True).click();page.wait_for_function("window.__lastExport.name==='bridge-connector-1.json'")
   page.get_by_role('button',name='Import',exact=True).click();assert page.evaluate("window.__uiFixture.calls.some(c=>c.op==='connector.import')")
   page.get_by_role('button',name='Pick Prompt input on page',exact=False).click();page.wait_for_function("window.__uiFixture.calls.some(c=>c.op==='connector.pick')")
  record('evidence inspection, connector import/export and page-picker action wiring',lab)
  def resizing():
   if page.get_by_role('button',name='Dismiss notification').count():page.get_by_role('button',name='Dismiss notification').click()
   handle=page.get_by_role('slider',name='Inspector width');before=float(handle.get_attribute('aria-valuenow'));handle.focus();page.keyboard.press('ArrowLeft');assert float(handle.get_attribute('aria-valuenow'))==before+16
   page.get_by_role('button',name='Close inspector',exact=True).click();assert not page.locator('.inspector').count()
   route('Connection inspector');assert page.locator('.inspector').is_visible()
   assert not page.locator('.workspace-sidebar').count()
   page.get_by_role('button',name='Close inspector',exact=True).click()
   page.wait_for_function('window.__uiFixture.bounds.width===innerWidth-194')
  record('keyboard-resizable panes and collapse/restore bounds',resizing)
  def tabs():
   page.keyboard.press('Control+t');page.get_by_role('heading',name='Open a website.',exact=False).wait_for();page.get_by_role('textbox',name='Website to open').fill('https://chat.example.test');page.get_by_role('button',name='Open website',exact=True).click();page.wait_for_function('window.__uiFixture.snapshot.providers.length===4')
   page.get_by_role('button',name='Close example.test tab').click();page.wait_for_function("window.__uiFixture.snapshot.providers[3].open_tab===false")
   page.locator('.tab-open').first.click()
  record('new website workflow, tab creation and close operation',tabs)
  def context_menu():
   page.locator('.tab-open').first.click(button='right');page.get_by_role('menu').wait_for();page.get_by_role('menuitem',name='Clear local profile').click();page.get_by_role('dialog').wait_for();assert not page.evaluate('window.__uiFixture.bounds.visible')
   page.get_by_role('button',name='Cancel',exact=True).click();page.wait_for_function('window.__uiFixture.bounds.visible===true')
  record('profile context menu and destructive-action confirmation with surface hiding',context_menu)
  def reduced_motion():
   page.emulate_media(reduced_motion='reduce');assert page.locator('.browser-tab').first.evaluate('(el)=>getComputedStyle(el).transitionDuration')=='0s'
   page.set_viewport_size({'width':1100,'height':760});page.wait_for_timeout(150);assert page.locator('.workspace-content').evaluate('(el)=>el.getBoundingClientRect().width')>700
   assert page.locator('body').evaluate('(el)=>el.scrollWidth')<=1100
   page.set_viewport_size({'width':1500,'height':940})
  record('reduced motion and compact-window overflow checks',reduced_motion)
  def no_errors():assert not errors,errors
  record('no browser JavaScript runtime errors',no_errors)
 finally:
  report={'kind':'ACTUAL_COMPILED_SVELTE_UI_WITH_EXPLICIT_TAURI_TEST_DOUBLE','native_tauri_executed':False,'zag_executed':False,'live_provider_contacted':False,'chromium':browser.version,'results':results,'runtime_errors':errors,'screenshots':[p.name for p in SHOTS.glob('*.png')], 'fixture_code_shipped_in_production_dist':False}
  (OUT/'ui-browser.json').write_text(json.dumps(report,indent=2)+'\n')
  browser.close()
if any(r['status']!='PASS'for r in results):raise SystemExit(1)
