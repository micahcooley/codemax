"""Cross-screen UX regression audit of the actual compiled Svelte application.

All native IPC and website data are explicitly controlled test doubles.
No Zag, Rust, live website, or real external coding client is executed here.
"""
# Navigation updated for the registry shelf and nested disclosures. All prior
# behavioral assertions remain; default-visibility checks are in progressive_ux.py.
from __future__ import annotations
import json, os, pathlib, subprocess, time, traceback
from playwright.sync_api import sync_playwright, expect
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'tests/evidence'; SHOTS=ROOT/'screenshots'
MODULES=json.loads(subprocess.check_output(['node',str(ROOT/'tests/render-module-graph.mjs'),str(ROOT/'dist')],text=True))
results=[]; all_errors=[]

def boot(browser,width=1500,height=980):
    page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
    page.set_default_timeout(4000)
    page.on('pageerror',lambda e:all_errors.append(str(e)))
    page.set_content('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Codemax compiled interface — test data</title></head><body><div id="app"></div></body></html>')
    page.add_style_tag(content=(ROOT/'dist/ui.css').read_text())
    page.evaluate('(html)=>window.__fixtureWebsite=html',(ROOT/'tests/fixtures/ui-website.html').read_text())
    page.evaluate((ROOT/'tests/fixtures/ui-host.js').read_text())
    page.evaluate('''(modules)=>{const imports={};for(const [key,code]of Object.entries(modules))imports[key]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);}''',MODULES)
    page.add_script_tag(type='module',content="import 'bridge/src/main.js';import {app} from 'bridge/src/lib/state/app.svelte.js';window.__app=app;")
    page.wait_for_function('window.__app?.ready')
    return page

def route(page,name):
    page.get_by_role('button',name='Codemax menu',exact=True).click()
    page.get_by_role('menuitem',name=name,exact=True).click()
    page.wait_for_timeout(30)
    if name=='Connect a client':page.get_by_text('Advanced setup and connection details',exact=True).click()
    if name=='Tools & MCP' and page.get_by_text('More setup',exact=True).count():page.get_by_text('More setup',exact=True).click()

def open_site(page):
    page.get_by_role('tab',name='Local test provider',exact=True).click()
    page.wait_for_function('window.__uiFixture.bounds.visible&&window.__uiFixture.bounds.provider_id===1')

def ops(page,name):
    return page.evaluate('(op)=>window.__uiFixture.calls.filter(c=>c.op===op)',name)

def run(browser,name,fn):
    page=boot(browser);start=time.monotonic();before=len(all_errors)
    try:
        fn(page)
        assert len(all_errors)==before,all_errors[before:]
        results.append({'name':name,'status':'PASS','seconds':round(time.monotonic()-start,3)})
        print('PASS',name,flush=True)
    except Exception as exc:
        results.append({'name':name,'status':'FAIL','error':str(exc)})
        page.screenshot(path=str(OUT/f'ux-audit-failure-{len(results)}.png'))
        print('FAIL',name,str(exc),flush=True);traceback.print_exc()
    finally:page.close()

SERVER={'id':1,'label':'Local fixture tools','command':'node','args':['/UI-FIXTURE-ONLY/mcp-server.mjs'],'state':'READY','error':'','protocol':'2025-11-25','tools':[{'name':'read_note','alias':'mcp_1_0','description':'UI test tool; reads no real file.','enabled':True,'schema':{'type':'object','properties':{'path':{'type':'string'}}}}]}
TASK={'id':'ux-run-1','state':'PERMISSION_REQUIRED','provider_id':1,'model':'p1/fixture-reasoner','turns':1,'calls':0,'auto_continue':False,'error':'','answer':'','call_id':'call-1','tool':'mcp_1_0','arguments':'{"path":"test-fixture.txt"}','last_result':''}

def seed_task(page):
    page.evaluate('(v)=>{window.__uiFixture.snapshot.mcp_servers=[v.server];window.__uiFixture.snapshot.mcp_run=v.task;window.__uiFixture.push()}',{'server':SERVER,'task':TASK})

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    def address_path(p):
        p.get_by_role('textbox',name='Address bar').fill('http://127.0.0.1:7340/conversation/specific?turn=2#latest');p.keyboard.press('Enter')
        p.wait_for_function('window.__uiFixture.calls.some(c=>c.op==="provider.navigate")')
        assert ops(p,'provider.navigate')[-1]['params']['url']=='http://127.0.0.1:7340/conversation/specific?turn=2#latest'
        assert not ops(p,'provider.add')
    run(browser,'Entering an existing origin preserves its path, query and fragment',address_path)

    def address_validation(p):
        samples={'localhost:7340/a':'http://localhost:7340/a','example.org:8443/a':'https://example.org:8443/a','qwen ai':'https://www.google.com/search?q=qwen%20ai'}
        for text,wanted in samples.items():assert p.evaluate('(s)=>window.__app.address(s).href',text)==wanted
        for text in ['javascript:alert(1)','file:///etc/passwd','https://user:password@example.org/']:
            assert p.evaluate('(s)=>{try{window.__app.address(s);return false;}catch{return true;}}',text)
        assert not ops(p,'provider.add')
    run(browser,'Address parser distinguishes local hosts, search, unsafe schemes and credentials',address_validation)

    def escape_address(p):
        open_site(p);p.keyboard.press('Control+l');p.get_by_role('textbox',name='Address bar').fill('unsent edit');p.keyboard.press('Escape')
        expect(p.get_by_role('textbox',name='Address bar')).to_have_value('http://127.0.0.1:7340/conversation/fixture-01')
        expect(p.get_by_role('tab',name='Local test provider',exact=True)).to_be_focused()
    run(browser,'Escape cancels address edits without navigation and restores tab focus',escape_address)

    def find(p):
        open_site(p);p.keyboard.press('Control+f');expect(p.get_by_role('textbox',name='Find on page')).to_be_focused()
        p.get_by_role('textbox',name='Find on page').fill('receipt');p.keyboard.press('Shift+Enter')
        call=p.evaluate('window.__uiFixture.calls.filter(c=>c.command==="browser_find").at(-1)')
        assert call['args']['query']=='receipt' and call['args']['backwards']
        p.keyboard.press('Escape');assert not p.get_by_role('textbox',name='Find on page').count()
    run(browser,'Find focuses immediately, supports reverse search and closes independently',find)

    def modal_keys(p):
        open_site(p);p.get_by_role('tab',name='Local test provider',exact=True).click(button='right')
        p.get_by_role('menuitem',name='Clear local profile',exact=True).click()
        expect(p.get_by_role('button',name='Cancel',exact=True)).to_be_focused()
        count=len(ops(p,'provider.close'));p.keyboard.press('Control+w');p.keyboard.press('Control+t');p.keyboard.press('Control+l')
        expect(p.get_by_role('dialog')).to_be_visible();assert len(ops(p,'provider.close'))==count
        p.keyboard.press('Escape');assert not ops(p,'provider.clear_profile')
    run(browser,'Confirmation defaults to Cancel and traps browser shortcuts without destructive side effects',modal_keys)

    def palette(p):
        p.keyboard.press('Control+k');expect(p.get_by_role('textbox',name='Search commands')).to_be_focused()
        for _ in range(15):p.keyboard.press('ArrowDown')
        assert p.locator('.command-results .selected').evaluate('(e)=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return a.top>=b.top-1&&a.bottom<=b.bottom+1;}')
        p.keyboard.press('Escape')
    run(browser,'Command palette autofocus and keyboard selection remain visible while scrolling',palette)

    def history(p):
        open_site(p);route(p,'Providers');route(p,'Models');p.get_by_role('button',name='Back',exact=True).click()
        expect(p.get_by_role('heading',name='Providers',exact=True)).to_be_visible()
        p.get_by_role('button',name='Forward',exact=True).click();expect(p.get_by_role('heading',name='Models',exact=True)).to_be_visible()
    run(browser,'Internal management navigation has predictable Back and Forward history',history)

    def zoom(p):
        open_site(p);p.keyboard.press('Control+=');assert p.evaluate('window.__app.zoom')==110
        p.get_by_role('tab',name='Qwen',exact=True).click();p.wait_for_function('window.__app.selectedProvider===2')
        assert p.evaluate('window.__app.zoom')==100
        open_site(p);assert p.evaluate('window.__app.zoom')==110
    run(browser,'Page zoom readout follows each website instead of resetting on every switch',zoom)

    def toasts(p):
        open_site(p);before=p.evaluate('window.__uiFixture.bounds')
        p.get_by_role('button',name='Copy website URL',exact=True).click()
        expect(p.locator('.footer-feedback')).to_contain_text('Copied to clipboard.')
        after=p.evaluate('window.__uiFixture.bounds');assert before==after,(before,after)
        p.wait_for_timeout(5100);expect(p.locator('.footer-feedback')).not_to_contain_text('Copied')
    run(browser,'Copy feedback stays in the reserved footer, does not shift the website and expires',toasts)

    def offline(p):
        route(p,'Providers');p.evaluate("window.__uiFixture.emit('bridge:host',{state:'LOST',code:'BACKEND_UNAVAILABLE'})")
        expect(p.locator('.shelf-row')).to_have_count(1);expect(p.locator('.stale-notice')).to_be_visible()
        expect(p.get_by_role('checkbox',name='Expose provider to harness')).to_be_disabled()
        before=len(ops(p,'provider.update'));p.evaluate("window.__app.perform('provider.update',{provider_id:1,exposed:false})")
        assert len(ops(p,'provider.update'))==before
        p.get_by_role('button',name='Runtime settings',exact=True).click();expect(p.get_by_role('heading',name='Desktop runtime',exact=True)).to_be_visible()
    run(browser,'Disconnected state retains last-known profiles, labels staleness and blocks mutations',offline)

    def no_snapshot(p):
        p.evaluate("window.__app.snapshot=null;window.__app.host={state:'STARTING',code:null};window.__app.navigate('providers')")
        expect(p.get_by_role('heading',name='Loading your workspace')).to_be_visible()
        assert not p.get_by_role('heading',name='Browse first. Providers follow.').count()
    run(browser,'Loading an unavailable snapshot is not mislabeled as an empty workspace',no_snapshot)

    def dedup(p):
        result=p.evaluate('''async()=>{const rt=window.__TAURI_INTERNALS__,old=rt.invoke;rt.invoke=async(c,a)=>{if(c==='bridge_request'&&a.op==='provider.rescan')await new Promise(r=>setTimeout(r,70));return old(c,a);};await Promise.all([window.__app.perform('provider.rescan',{provider_id:1}),window.__app.perform('provider.rescan',{provider_id:1})]);return window.__uiFixture.calls.filter(c=>c.op==='provider.rescan').length;}''')
        assert result==1 and p.evaluate('window.__app.pending')==0
    run(browser,'Repeated identical actions in flight dispatch only one backend request',dedup)

    def preserved_error(p):
        p.evaluate("window.__app.error='Failed to open MyProject/Config.JSON';window.__app.settings({compact:true})")
        expect(p.get_by_role('alert')).to_contain_text('MyProject/Config.JSON')
    run(browser,'Errors survive unrelated successful actions and preserve path/message casing',preserved_error)

    def provider_draft(p):
        route(p,'Providers');p.get_by_text('Advanced · overrides, mapping, and lifecycle',exact=True).click()
        p.get_by_role('textbox',name='Provider display name').fill('Uncommitted label')
        route(p,'Models');route(p,'Providers');p.locator('details').filter(has=p.locator('summary',has_text='Advanced · overrides')).locator('summary').click()
        expect(p.get_by_role('textbox',name='Provider display name')).to_have_value('Uncommitted label')
        assert not ops(p,'provider.update')
        p.get_by_role('button',name='Reset changes',exact=True).click();expect(p.get_by_role('textbox',name='Provider display name')).to_have_value('Local test provider')
    run(browser,'Provider override drafts survive navigation and Reset does not mutate saved data',provider_draft)

    def provider_save(p):
        route(p,'Providers');p.get_by_text('Advanced · overrides, mapping, and lifecycle',exact=True).click()
        expect(p.get_by_role('button',name='Save overrides',exact=True)).to_be_disabled()
        p.get_by_role('textbox',name='Provider display name').fill('Renamed test profile');p.get_by_role('button',name='Save overrides',exact=True).click()
        p.wait_for_function('window.__uiFixture.snapshot.providers[0].label==="Renamed test profile"')
        expect(p.get_by_role('button',name='Save overrides',exact=True)).to_be_disabled();expect(p.locator('.footer-feedback')).to_contain_text('Provider overrides saved')
    run(browser,'Provider edits are explicit; unchanged values cannot be resubmitted',provider_save)

    def active_exposure(p):
        p.evaluate('window.__uiFixture.snapshot.providers[0].active=true;window.__uiFixture.push()');route(p,'Providers')
        p.get_by_role('checkbox',name='Expose provider to harness').click();expect(p.get_by_role('dialog')).to_be_visible()
        assert not ops(p,'provider.update');p.get_by_role('button',name='Cancel',exact=True).click()
        expect(p.get_by_role('checkbox',name='Expose provider to harness')).to_be_checked()
    run(browser,'Disabling a provider during work requires confirmation; Cancel restores the checkbox',active_exposure)

    def gateway(p):
        p.evaluate('window.__uiFixture.snapshot.api.running=false;window.__uiFixture.push()');route(p,'Connect a client')
        p.get_by_role('button',name='Start gateway',exact=True).click();expect(p.get_by_role('button',name='Check connection',exact=True)).to_be_visible()
        p.get_by_role('button',name='Check connection',exact=True).click();expect(p.locator('.connection-result')).to_contain_text('Local gateway reachable')
        p.get_by_role('button',name='Stop gateway',exact=True).click();expect(p.get_by_role('dialog')).to_be_visible();assert not ops(p,'api.stop')
        p.get_by_role('button',name='Cancel',exact=True).click();assert p.evaluate('window.__uiFixture.snapshot.api.running')
    run(browser,'Client setup includes working Start, health Check and confirmed Stop controls',gateway)

    def health_failure(p):
        p.evaluate("const old=window.__TAURI_INTERNALS__.invoke;window.__TAURI_INTERNALS__.invoke=(c,a)=>c==='gateway_probe'?Promise.resolve({healthy:false,round_trip_ms:2}):old(c,a);true")
        route(p,'Connect a client');p.get_by_role('button',name='Check connection',exact=True).click()
        expect(p.locator('.connection-result')).to_contain_text('failed');assert 'reachable' not in p.locator('.connection-result').inner_text()
    run(browser,'A negative health result cannot produce a successful connection message',health_failure)

    def no_model_substitution(p):
        route(p,'Connect a client');p.get_by_role('combobox',name='Client model').select_option('p1/fixture-coder')
        p.evaluate("window.__uiFixture.snapshot.providers[0].models.find(m=>m.id==='p1/fixture-coder').enabled=false;window.__uiFixture.push()")
        expect(p.get_by_role('button',name='Save config',exact=True)).to_be_disabled()
        expect(p.get_by_text('Your previous selection is no longer available.',exact=False)).to_be_visible()
    run(browser,'Unavailable explicit client model selection is not silently replaced by another model',no_model_substitution)

    def secret(p):
        route(p,'Connect a client');expect(p.get_by_role('button',name='Reveal API key')).to_have_count(0)
        p.get_by_text('Manual connection details · endpoint and local access token',exact=True).click()
        p.get_by_role('button',name='Reveal API key').click();expect(p.get_by_text('sk-local-ui-fixture-not-a-real-key',exact=True)).to_be_visible()
        route(p,'Providers');assert p.evaluate('window.__app.secret')==''
        assert 'sk-local-ui-fixture-not-a-real-key' not in p.evaluate('JSON.stringify(window.__uiFixture.snapshot)')
    run(browser,'Technical connection fields start collapsed; leaving the page hides revealed secrets',secret)

    def model_status(p):
        p.evaluate('window.__uiFixture.snapshot.providers[0].models[0].enabled=false;window.__uiFixture.snapshot.providers[0].models[1].available=false;window.__uiFixture.push()')
        route(p,'Models');p.get_by_role('combobox',name='Filter by availability').select_option('READY')
        expect(p.locator('tbody tr')).to_have_count(1);expect(p.locator('tbody tr')).to_contain_text('Fixture Coder')
        p.get_by_role('combobox',name='Filter by availability').select_option('all')
        expect(p.get_by_role('button',name='Set Fixture Small as default')).to_be_disabled();expect(p.get_by_role('button',name='Set Fixture Reasoner as default')).to_be_disabled()
    run(browser,'Ready filters and default-model actions respect model and provider exposure',model_status)

    def filters(p):
        route(p,'Models');p.get_by_role('textbox',name='Search models').fill('impossible match');expect(p.get_by_role('heading',name='No models match those filters')).to_be_visible()
        route(p,'Providers');route(p,'Models');expect(p.get_by_role('textbox',name='Search models')).to_have_value('impossible match')
        p.get_by_role('button',name='Clear filters',exact=True).click();expect(p.locator('tbody tr')).to_have_count(3)
        p.get_by_role('button',name='MODEL',exact=True).click();expect(p.locator('th').first).to_have_attribute('aria-sort','ascending')
        p.get_by_role('button',name='MODEL',exact=True).click();expect(p.locator('th').first).to_have_attribute('aria-sort','descending')
    run(browser,'Model filters persist, empty searches recover in place, and sorting toggles direction',filters)

    def session_open(p):
        route(p,'Sessions');p.get_by_role('button',name='Open',exact=True).click()
        assert ops(p,'session.resume')[-1]['params']=={'session_id':'fixture-review-01'}
        assert not ops(p,'provider.open')
    run(browser,'Opening a session asks the backend for that conversation, not the provider homepage',session_open)

    def session_end(p):
        route(p,'Sessions');p.get_by_role('button',name='End session fixture-review-01').click()
        expect(p.get_by_role('dialog')).to_be_visible();assert not ops(p,'session.end')
        p.get_by_role('button',name='Cancel',exact=True).click();assert not ops(p,'session.end')
        p.get_by_role('button',name='End session fixture-review-01').click();p.get_by_role('button',name='End session',exact=True).click()
        assert len(ops(p,'session.end'))==1
    run(browser,'Ending a session requires review and does not delete a website conversation',session_end)

    def rename_failure(p):
        p.evaluate("const old=window.__TAURI_INTERNALS__.invoke;window.__TAURI_INTERNALS__.invoke=(c,a)=>c==='bridge_request'&&a.op==='session.rename'?Promise.reject(Error('SAVE_FAILED')):old(c,a);true")
        route(p,'Sessions');field=p.get_by_role('textbox',name='Title for session fixture-review-01');field.fill('New title');field.press('Tab')
        expect(field).to_have_value('Session recovery review');expect(p.get_by_role('alert')).to_contain_text('Save failed')
    run(browser,'A failed session rename restores its saved value without a stale event error',rename_failure)

    def draft_tools(p):
        route(p,'Tools & MCP');p.get_by_role('textbox',name='MCP task').fill('Preserve this unsent task')
        p.get_by_role('button',name='Add tool server',exact=True).click();p.get_by_role('textbox',name='MCP server name').fill('Unsent server')
        p.get_by_role('textbox',name='MCP executable').fill('node');p.get_by_role('textbox',name='MCP arguments').fill('not json')
        p.get_by_role('button',name='Save server',exact=True).click();expect(p.locator('.form-error')).to_be_visible();assert not ops(p,'mcp.server.add')
        route(p,'Providers');route(p,'Tools & MCP');expect(p.get_by_role('textbox',name='MCP server name')).to_have_value('Unsent server')
        p.get_by_role('button',name='Cancel',exact=True).click();expect(p.get_by_role('textbox',name='MCP task')).to_have_value('Preserve this unsent task')
    run(browser,'Unsent tool task and server drafts survive navigation; invalid JSON is explained inline',draft_tools)

    def global_approval(p):
        open_site(p);seed_task(p);expect(p.get_by_role('button',name='Review tool call',exact=True)).to_be_visible()
        expect(p.get_by_label('Task needs attention')).to_be_visible();assert not ops(p,'mcp.run.approve')
        p.get_by_role('button',name='Review tool call',exact=True).click();expect(p.get_by_role('heading',name='Approve this tool call',exact=True)).to_be_visible()
    run(browser,'Tool approvals remain visible while browsing and never auto-execute',global_approval)

    def approval_reset(p):
        seed_task(p);route(p,'Tools & MCP');p.get_by_text('Advanced · automatic execution for this task',exact=True).click()
        p.get_by_role('checkbox',name='Allow MCP tool for task').check()
        p.evaluate("Object.assign(window.__uiFixture.snapshot.mcp_run,{call_id:'call-2',arguments:'{\"path\":\"different.txt\"}'});window.__uiFixture.push()")
        expect(p.get_by_role('checkbox',name='Allow MCP tool for task')).not_to_be_checked()
        p.get_by_role('button',name='Allow once',exact=True).click();assert ops(p,'mcp.run.approve')[-1]['params']['allow_run'] is False
    run(browser,'A new or changed tool call resets the broader grant checkbox to Allow once',approval_reset)

    def server_removal(p):
        p.evaluate('(s)=>{window.__uiFixture.snapshot.mcp_servers=[s];window.__uiFixture.push()}',SERVER);route(p,'Tools & MCP')
        p.get_by_text('Advanced · executable and tool schemas',exact=True).click();p.get_by_role('button',name='Remove server',exact=True).click()
        expect(p.get_by_role('dialog')).to_be_visible();assert not ops(p,'mcp.server.remove')
        p.get_by_role('button',name='Cancel',exact=True).click();assert not ops(p,'mcp.server.remove')
    run(browser,'Removing a tool server requires confirmation without deleting its executable',server_removal)

    def connection_failure(p):
        srv={**SERVER,'state':'DISCONNECTED','tools':[]};p.evaluate('(s)=>{window.__uiFixture.snapshot.mcp_servers=[s];window.__uiFixture.push()}',srv)
        p.evaluate("const old=window.__TAURI_INTERNALS__.invoke;window.__TAURI_INTERNALS__.invoke=(c,a)=>c==='bridge_request'&&a.op==='mcp.server.connect'?Promise.reject(Error('PROCESS_START_FAILED')):old(c,a);true")
        route(p,'Tools & MCP');p.get_by_role('button',name='Connect',exact=True).click();p.get_by_role('checkbox',name='Trust MCP executable').check();p.get_by_role('button',name='Allow process and connect').click()
        expect(p.get_by_role('region',name='Local process permission')).to_be_visible();assert p.evaluate('window.__uiFixture.snapshot.mcp_servers[0].state')=='DISCONNECTED'
    run(browser,'Failed tool-server connection keeps the reviewed definition available for retry',connection_failure)

    def settings_links(p):
        route(p,'Connect a client');p.get_by_role('button',name='Gateway settings',exact=True).click();expect(p.get_by_role('heading',name='Local gateway',exact=True)).to_be_visible()
        route(p,'Providers');route(p,'Settings');expect(p.get_by_role('heading',name='Local gateway',exact=True)).to_be_visible()
        p.get_by_role('spinbutton',name='Gateway port').fill('7451');p.get_by_role('button',name='Apply',exact=True).click();expect(p.get_by_role('button',name='Apply',exact=True)).to_be_disabled()
    run(browser,'Settings deep links open the right section, remember it and settle applied forms',settings_links)

    def destructive(p):
        route(p,'Detector');p.get_by_role('combobox',name='Inspect website').select_option('1');p.get_by_role('button',name='Reset to automatic').click()
        expect(p.get_by_role('dialog')).to_be_visible();assert not ops(p,'connector.reset');p.get_by_role('button',name='Cancel',exact=True).click()
        route(p,'Activity');p.get_by_role('button',name='Clear',exact=True).click();expect(p.get_by_role('dialog')).to_be_visible();assert not ops(p,'logs.clear');p.get_by_role('button',name='Cancel',exact=True).click()
        p.evaluate('window.__uiFixture.snapshot.providers[0].active=true;window.__uiFixture.push()');p.get_by_role('button',name='Close application',exact=True).click();expect(p.get_by_role('dialog')).to_be_visible()
        assert not p.evaluate('window.__uiFixture.calls.some(c=>c.command==="window_control"&&c.args.action==="close")')
    run(browser,'Connector reset, diagnostic clearing and application close guard destructive effects',destructive)

    def empty_recovery(p):
        route(p,'Sessions');p.get_by_role('textbox',name='Search sessions').fill('not found');p.get_by_role('button',name='Clear filters',exact=True).click();expect(p.locator('tbody tr')).to_have_count(1)
        route(p,'Activity');p.get_by_role('combobox',name='Event severity').select_option('ERROR');expect(p.get_by_role('heading',name='No events at this level')).to_be_visible()
        p.get_by_role('button',name='Show all levels',exact=True).click();expect(p.locator('.log-row')).to_have_count(4)
    run(browser,'Filtered-empty Sessions and Activity recover without sending users into setup',empty_recovery)

    def surfaces(p):
        pages=['Providers','Models','Sessions','Connect a client','Tools & MCP','Detector','Activity','Settings']
        for width,height in [(1500,980),(1000,680),(800,640)]:
            p.set_viewport_size({'width':width,'height':height})
            for name in pages:
                route(p,name)
                assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),(name,width)
                assert p.locator('.screen').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),(name,width,'screen overflow')
                if name=='Settings':
                    for sub in ['Appearance','Local gateway','Website profiles','Privacy & diagnostics','Runtime']:
                        p.locator('.preferences-nav').get_by_role('button',name=sub,exact=True).click()
                        assert p.locator('.screen').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),(name,sub,width)
            open_site(p);assert p.evaluate('window.__uiFixture.bounds.width')==width-p.locator('.provider-shelf').bounding_box()['width']
        p.set_viewport_size({'width':1500,'height':980});route(p,'Providers');p.screenshot(path=str(SHOTS/'20-ux-providers.png'),animations='disabled')
        route(p,'Connect a client');p.screenshot(path=str(SHOTS/'21-ux-connect.png'),animations='disabled')
        seed_task(p);route(p,'Tools & MCP');p.screenshot(path=str(SHOTS/'22-ux-permission.png'),animations='disabled')
        open_site(p);p.screenshot(path=str(SHOTS/'23-ux-browser-approval.png'),animations='disabled')
        p.evaluate("window.__uiFixture.snapshot.settings.theme='light';window.__uiFixture.push()")
        route(p,'Providers');p.screenshot(path=str(SHOTS/'24-ux-providers-light.png'),animations='disabled')
        p.set_viewport_size({'width':1000,'height':680});route(p,'Connect a client');p.screenshot(path=str(SHOTS/'25-ux-compact.png'),animations='disabled')
    run(browser,'All nine surfaces and five Settings sections stay bounded at three viewport sizes',surfaces)

    def long_content(p):
        p.evaluate("const p=window.__uiFixture.snapshot.providers[0];p.label='Long provider name '.repeat(12);p.models[0].display_name='Long model description '.repeat(12);p.models[0].id='p1/'+('x'.repeat(200));window.__uiFixture.push()")
        p.set_viewport_size({'width':1000,'height':680})
        for name in ['Providers','Models','Sessions','Connect a client','Settings']:
            route(p,name);assert p.locator('.screen').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),name
    run(browser,'Long provider labels, model names and identifiers cannot expand the whole window',long_content)

    def selection_race(p):
        p.evaluate("const old=window.__TAURI_INTERNALS__.invoke;window.__TAURI_INTERNALS__.invoke=async(c,a)=>{if(c==='bridge_request'&&a.op==='provider.open')await new Promise(r=>setTimeout(r,a.params.provider_id===3?120:10));return old(c,a);};true")
        p.evaluate("async()=>{await Promise.all([window.__app.openProvider(3),window.__app.openProvider(2)]);}")
        expect(p.get_by_role('tab',name='Qwen',exact=True)).to_have_attribute('aria-selected','true')
        p.evaluate("async()=>{const open=window.__app.openProvider(3);window.__app.navigate('providers');await open;}")
        expect(p.get_by_role('heading',name='Providers',exact=True)).to_be_visible()
    run(browser,'Slow tab opening cannot override a newer tab or page selection',selection_race)

    def pending_dialog(p):
        route(p,'Sessions')
        p.evaluate("const old=window.__TAURI_INTERNALS__.invoke;window.__TAURI_INTERNALS__.invoke=async(c,a)=>{if(c==='bridge_request'&&a.op==='session.end'){await new Promise(r=>setTimeout(r,400));throw Error('END_FAILED');}return old(c,a);};true")
        p.get_by_role('button',name='End session fixture-review-01').click();p.get_by_role('button',name='End session',exact=True).click()
        p.keyboard.press('Escape');expect(p.get_by_role('dialog')).to_be_visible()
        expect(p.locator('.dialog-error')).to_contain_text('End failed');expect(p.get_by_role('button',name='Cancel',exact=True)).to_be_enabled()
        p.get_by_role('button',name='Cancel',exact=True).click()
        expect(p.get_by_role('heading',name='Sessions',exact=True)).to_be_visible()
    run(browser,'An in-flight confirmation cannot be half-dismissed; failures remain recoverable in its dialog',pending_dialog)

    def reduced(p):
        open_site(p);p.evaluate('window.__uiFixture.snapshot.providers[0].browser_busy=true;window.__uiFixture.push()')
        ring=p.locator('[data-provider-id="1"] .activity-ring');p.wait_for_function('getComputedStyle(document.querySelector("[data-provider-id=\\"1\\"] .activity-ring")).animationName==="spin"')
        p.emulate_media(reduced_motion='reduce');assert ring.evaluate('(e)=>getComputedStyle(e).animationName')=='none'
        expect(p.locator('[data-provider-id="1"] .tab-activity')).to_have_attribute('aria-label','Local test provider: Generating')
    run(browser,'Reduced motion keeps readable working states without animation',reduced)

    report={'scope':'Actual compiled Svelte in Chromium; explicitly mocked native IPC and provider data only.','native_tauri_executed':False,'zag_executed':False,'live_website_contacted':False,'passed':sum(t['status']=='PASS' for t in results),'failed':sum(t['status']=='FAIL' for t in results),'tests':results,'runtime_errors':all_errors,'chromium':browser.version}
    OUT.mkdir(exist_ok=True);(OUT/'ux-audit.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2),flush=True);browser.close()
if report['failed'] or all_errors:raise SystemExit(1)
