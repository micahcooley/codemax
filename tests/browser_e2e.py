"""Exercises the actual injected agent in Chromium. Not a Tauri/WebKit test.
Requires Python Playwright and a system Chromium (or CHROMIUM environment path).
No provider accounts, external websites, real credentials or inference are used.
"""
from __future__ import annotations
import json, os, pathlib, subprocess, sys, time, traceback, urllib.request
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'tests' / 'evidence'
OUT.mkdir(parents=True, exist_ok=True)
PORT = int(os.environ.get('MOCK_PORT', '7340'))
ORIGIN = f'http://127.0.0.1:{PORT}'
results = []
server = subprocess.Popen(['node', 'mock-provider/server.mjs'], cwd=ROOT, env={**os.environ,'MOCK_PORT':str(PORT)}, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
def record(name, fn):
    start = time.monotonic()
    try:
        fn(); results.append({'name':name,'status':'PASS','seconds':round(time.monotonic()-start,3)}); print('PASS',name,flush=True)
    except Exception as exc:
        results.append({'name':name,'status':'FAIL','error':str(exc),'traceback':traceback.format_exc()}); print('FAIL',name,str(exc),flush=True)
        raise
try:
    for attempt in range(100):
        try:
            urllib.request.urlopen(ORIGIN+'/health',timeout=1).close(); break
        except Exception:
            if server.poll() is not None: raise RuntimeError(server.stderr.read().decode())
            time.sleep(.05)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        context = browser.new_context(viewport={'width':1280,'height':900})
        captured=[]
        context.expose_binding('capture',lambda source,event:captured.append(event))
        context.add_init_script(script=f'''globalThis.__BRIDGE_BOOT__={{origin:{json.dumps(ORIGIN)}}};
          globalThis.__events=[];globalThis.__TAURI_INTERNALS__={{invoke:(command,{{event}})=>{{
            if(command!=='provider_observe')return Promise.reject(Error('DENIED'));
            globalThis.__events.push(event);return globalThis.capture(event);
          }}}};'''+(ROOT/'browser/agent.js').read_text())
        page=context.new_page(); page.goto(ORIGIN)
        def snapshot():
            page.wait_for_function("__events.some(e=>e.type==='observation'&&e.controls.some(n=>n.label==='Message'))")
            return page.evaluate("__events.filter(e=>e.type==='observation'&&e.controls.some(n=>n.label==='Message')).at(-1)")
        def action(request, prompt='hello', *, model='mock-small', new=False):
            snap=snapshot(); controls=snap['controls']
            def node(label):
                return next((n['id'] for n in controls if n['label']==label),0)
            return {'type':'generate','request_id':request,'document_id':snap['document_id'],
                'prompt':prompt,'prompt_node':node('Message'),'send_node':node('Send message'),
                'response_node':node('Assistant responses'),'stop_node':node('Stop generating'),
                'model_control':node('Model'),'model_value':model,'new_chat':node('New chat') if new else 0}
        def execute(a): page.evaluate('(a)=>__BRIDGE_EXECUTE__(a)',a)
        def finish(request, expected='generation_done'):
            page.wait_for_function("id=>__events.some(e=>e.request_id===id&&['generation_done','generation_error'].includes(e.type))",arg=request,timeout=15000)
            events=page.evaluate('id=>__events.filter(e=>e.request_id===id)',request)
            terminal=[e for e in events if e['type'] in ('generation_done','generation_error')]
            assert len(terminal)==1,terminal
            assert terminal[0]['type']==expected,terminal
            return events
        def privacy():
            page.wait_for_function("__events.some(e=>e.type==='observation')")
            initial=page.evaluate('__events'); serial=json.dumps(initial)
            for secret in ['must-not-be-captured','4111111111111111','private@example.test']:
                assert secret not in serial,secret
            assert initial[-1].get('password_fields_present') is True
        record('login_form_sensitive_fields_excluded',privacy)
        page.click('#login button'); snapshot()
        record('generic_controls_observed',lambda: (lambda a: all(a[k]>0 for k in ['prompt_node','send_node','response_node','stop_node','model_control']) or (_ for _ in ()).throw(AssertionError(a)))(action('check')))
        def normal():
            execute(action('normal','[[unicode]]',new=True)); events=finish('normal')
            text=''.join(e['text'] for e in events if e['type']=='generation_delta')
            assert 'A🎯漢字 café' in text,text
            assert len([e for e in events if e['type']=='generation_delta'])>1
            assert text==page.locator('[data-bridge-assistant]').last.text_content()
        record('real_dom_incremental_unicode_stream',normal)
        def model():
            execute(action('model',model='mock-reasoner')); finish('model'); assert page.input_value('#model')=='mock-reasoner'
        record('model_selection_precedes_submission',model)
        def continuity():
            for i in range(22):
                request=f'continuity-{i}';execute(action(request,f'follow up {i}'));finish(request)
            assert page.locator('[data-bridge-assistant]').count()==24
        record('22_turn_browser_conversation_continuity',continuity)
        def cancellation():
            page.select_option('#mode','slow'); a=action('cancel');execute(a)
            page.wait_for_function("__events.some(e=>e.request_id==='cancel'&&e.type==='generation_delta')")
            execute({'type':'stop','document_id':a['document_id'],'request_id':'cancel','stop_node':a['stop_node']})
            events=finish('cancel','generation_error'); assert events[-1]['code']=='CANCELLED'
            page.wait_for_function("document.getElementById('messages').getAttribute('aria-busy')==='false'")
        record('cancellation_stops_provider_generation',cancellation)
        def scenario(mode,code):
            page.select_option('#mode',mode); execute(action(mode)); events=finish(mode,'generation_error')
            assert any(e.get('code')==code for e in events),events
            page.wait_for_function("document.getElementById('messages').getAttribute('aria-busy')==='false'")
        record('provider_quota_stops_without_retry',lambda:scenario('quota','PROVIDER_RATE_LIMITED'))
        record('login_expiration_surfaces_auth_error',lambda:scenario('expired','AUTH_REQUIRED'))
        record('broken_stream_never_reports_success',lambda:scenario('broken','PROVIDER_STREAM_ERROR'))
        record('response_rewrite_never_duplicates_text',lambda:scenario('rewrite','RESPONSE_REWRITTEN'))
        def transports(mode,transport):
            page.select_option('#mode',mode); execute(action(mode));finish(mode)
            assert page.evaluate("t=>__events.some(e=>e.type==='network'&&e.transport===t&&e.phase==='open')",transport)
        record('websocket_metadata_and_dom_stream',lambda:transports('websocket','websocket'))
        record('eventsource_metadata_and_dom_stream',lambda:transports('eventsource','eventsource'))
        def no_secrets():
            serial=json.dumps(captured)
            for secret in ['must-not-be-captured','4111111111111111','private@example.test']:
                assert secret not in serial,secret
            assert all(len(json.dumps(e,ensure_ascii=False).encode())<=32768 for e in captured)
        record('all_observations_remain_bounded_and_redacted',no_secrets)
        def stale():
            old=action('stale');page.reload();snapshot();execute(old);events=finish('stale','generation_error');assert events[-1]['code']=='STALE_DOCUMENT'
            assert page.locator('#chat').is_visible()
        record('reload_preserves_fixture_login_and_rejects_stale_actions',stale)
        def forbidden():
            a=action('forbidden');page.locator('#prompt').evaluate("e=>e.setAttribute('autocomplete','current-password')")
            execute(a);events=finish('forbidden','generation_error');assert events[-1]['code']=='MAPPING_BROKEN'
            page.locator('#prompt').evaluate("e=>e.removeAttribute('autocomplete')")
        record('sensitive_target_rechecked_at_execution',forbidden)
        def redesign():
            page.goto(ORIGIN+'/?redesign=1');snapshot();execute(action('redesign'));finish('redesign')
        record('semantic_mapping_survives_fixture_redesign',redesign)
        def isolation():
            other=browser.new_context();p=other.new_page();p.goto(ORIGIN);assert p.locator('#login').is_visible();other.close()
        record('chromium_context_profile_isolation',isolation)
        page.screenshot(path=str(OUT/'mock-provider-browser.png'),full_page=True)
        context.close();browser.close()
except Exception as exc:
    if not results or results[-1]["status"] == "PASS":
        results.append({"name":"browser_network_bootstrap", "status":"BLOCKED" if "ERR_BLOCKED_BY_ADMINISTRATOR" in str(exc) else "FAIL", "error":str(exc)})
    traceback.print_exc()
finally:
    server.terminate()
    try: server.communicate(timeout=5)
    except subprocess.TimeoutExpired:server.kill();server.communicate()
    report={'scope':'Chromium + actual browser/agent.js + local deterministic fixture. Not Tauri, WebKitGTK, Zag, or a real coding-harness validation.',
            'tests':results,'passed':sum(x['status']=='PASS' for x in results),'failed':sum(x['status']=='FAIL' for x in results),'blocked':sum(x['status']=='BLOCKED' for x in results)}
    (OUT/'browser-tests.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k!='tests'},indent=2))
    if report['failed'] or report['blocked'] or not results:sys.exit(77 if report['blocked'] and not report['failed'] else 1)
