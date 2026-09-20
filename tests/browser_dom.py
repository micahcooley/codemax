"""Exercises the actual agent against an in-memory DOM/transport fixture in Chromium.
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
server = None
def record(name, fn):
    start = time.monotonic()
    try:
        fn(); results.append({'name':name,'status':'PASS','seconds':round(time.monotonic()-start,3)}); print('PASS',name,flush=True)
    except Exception as exc:
        results.append({'name':name,'status':'FAIL','error':str(exc),'traceback':traceback.format_exc()}); print('FAIL',name,str(exc),flush=True)
        raise
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        context = browser.new_context(viewport={'width':1280,'height':900})
        captured=[]
        context.expose_binding('capture',lambda source,event:captured.append(event))
        html=(ROOT/'mock-provider/index.html').read_text()
        markup,script=html.split('<script>',1); script=script.split('</script>',1)[0]
        def mount(storage=None,redesign=False):
            p=context.new_page()
            p.set_content(markup+'</body></html>')
            p.evaluate('(value)=>{globalThis.__fixtureStorage=value}',storage or {})
            p.evaluate((ROOT/'tests/fixtures/in-memory-transport.js').read_text())
            p.evaluate("""globalThis.__BRIDGE_BOOT__={origin:'null'};
              globalThis.__events=[];globalThis.__TAURI_INTERNALS__={invoke:(command,{event})=>{
               if(command!=='provider_observe')return Promise.reject(Error('DENIED'));
               globalThis.__events.push(event);return globalThis.capture(event);
              }};""")
            p.evaluate((ROOT/'browser/agent.js').read_text())
            p.evaluate(script)
            if redesign:p.evaluate("document.body.classList.add('redesign');document.getElementById('send').textContent='Submit'")
            return p
        page=mount()
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
        def manual_busy():
            page.select_option('#mode','slow')
            page.fill('#prompt','Manual website typing')
            page.click('#send')
            page.wait_for_function("__events.filter(e=>e.type==='observation').at(-1)?.controls.some(c=>c.busy===true || (c.label==='Stop generating'&&c.visible&&!c.disabled))")
            page.click('#stop')
            page.wait_for_function("!__events.filter(e=>e.type==='observation').at(-1)?.controls.some(c=>c.busy===true || (c.label==='Stop generating'&&c.visible&&!c.disabled))")
            # Start a fresh fixture conversation so the existing 22-turn assertions remain independent.
            page.click('#newchat')
            page.select_option('#mode','normal')
        record('manual_website_generation_emits_busy_then_idle_observations',manual_busy)
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
            # Independent error scenarios must dismiss the previous fixture's visible alert.
            page.evaluate("document.getElementById('status').textContent=''");page.wait_for_timeout(220)
            page.select_option('#mode',mode); execute(action(mode)); events=finish(mode,'generation_error')
            assert any(e.get('code')==code for e in events),events
            page.wait_for_function("document.getElementById('messages').getAttribute('aria-busy')==='false'")
        record('provider_quota_stops_without_retry',lambda:scenario('quota','PROVIDER_RATE_LIMITED'))
        record('login_expiration_surfaces_auth_error',lambda:scenario('expired','AUTH_REQUIRED'))
        record('broken_stream_never_reports_success',lambda:scenario('broken','PROVIDER_STREAM_ERROR'))
        record('response_rewrite_never_duplicates_text',lambda:scenario('rewrite','RESPONSE_REWRITTEN'))
        def transports(mode,transport):
            # Independent error scenarios must dismiss the previous fixture's visible alert.
            page.evaluate("document.getElementById('status').textContent=''");page.wait_for_timeout(220)
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
            global page
            old=action('stale');state=page.evaluate('__exportFixtureStorage()');page.close();page=mount(state);snapshot();execute(old);events=finish('stale','generation_error');assert events[-1]['code']=='STALE_DOCUMENT'
            assert page.locator('#chat').is_visible()
        record('fixture_state_rehydration_rejects_stale_document_actions',stale)
        def forbidden():
            a=action('forbidden');page.locator('#prompt').evaluate("e=>e.setAttribute('autocomplete','current-password')")
            execute(a);events=finish('forbidden','generation_error');assert events[-1]['code']=='MAPPING_BROKEN'
            page.locator('#prompt').evaluate("e=>e.removeAttribute('autocomplete')")
        record('sensitive_target_rechecked_at_execution',forbidden)
        def redesign():
            global page
            state=page.evaluate('__exportFixtureStorage()');page.close();page=mount(state,True);snapshot();execute(action('redesign'));finish('redesign')
        record('semantic_mapping_survives_fixture_redesign',redesign)
        def isolation():
            p=mount();assert p.locator('#login').is_visible();p.close()
        record('fixture_state_containers_are_independent',isolation)
        def attachment_upload():
            page.select_option('#mode','normal')
            page.evaluate("""(()=>{const e=document.createElement('input');e.type='file';e.multiple=true;e.accept='text/plain,image/png';e.id='bridge-fixture-file';e.setAttribute('aria-label','Attach files');document.getElementById('chat').append(e);__BRIDGE_RESCAN__();})()""")
            page.wait_for_function("__events.filter(e=>e.type==='observation').at(-1).controls.some(n=>n.label==='Attach files')")
            snap=page.evaluate("__events.filter(e=>e.type==='observation').at(-1)"); a=action('attachment')
            a['attachment_node']=next(n['id'] for n in snap['controls'] if n['label']=='Attach files')
            a['attachments']=[{'name':'attachment.txt','mime':'text/plain','data':'aGVsbG8='}]
            execute(a);finish('attachment');assert page.evaluate("document.getElementById('bridge-fixture-file').files[0].size")==5
            execute({**a,'request_id':'attachment-existing'});events=finish('attachment-existing','generation_error');assert events[-1]['code']=='EXISTING_ATTACHMENTS_REQUIRE_USER_ACTION'
            page.evaluate("document.getElementById('bridge-fixture-file').value=''")
            execute({**a,'request_id':'attachment-invalid','attachments':[{'name':'attachment.txt','mime':'text/plain','data':'Zg=A'}]})
            events=finish('attachment-invalid','generation_error');assert events[-1]['code']=='INVALID_ATTACHMENT'
            assert page.evaluate("document.getElementById('bridge-fixture-file').files.length")==0
        record('client_attachment_upload_preserves_existing_files_and_refuses_malformed_base64',attachment_upload)
        def reasoning_toggle():
            page.evaluate("""(()=>{let e=document.createElement('button');e.id='bridge-reasoning';e.setAttribute('role','switch');e.setAttribute('aria-label','Thinking');e.setAttribute('aria-checked','false');e.textContent='Thinking';e.onclick=()=>e.setAttribute('aria-checked',e.getAttribute('aria-checked')==='true'?'false':'true');document.getElementById('chat').append(e);__BRIDGE_RESCAN__()})()""")
            page.wait_for_function("__events.filter(e=>e.type==='observation').at(-1).controls.some(n=>n.label==='Thinking')")
            snap=page.evaluate("__events.filter(e=>e.type==='observation').at(-1)");a=action('reasoning')
            a['reasoning_control']=next(n['id'] for n in snap['controls'] if n['label']=='Thinking');a['reasoning_value']='thinking'
            execute(a);finish('reasoning');assert page.get_attribute('#bridge-reasoning','aria-checked')=='true'
        record('exact_reasoning_switch_precedes_submission',reasoning_toggle)
        def cancelled_preparation():
            before=page.locator('[data-bridge-assistant]').count();a=action('cancel-preparing')
            page.evaluate("a=>{__BRIDGE_EXECUTE__(a);__BRIDGE_EXECUTE__({type:'stop',document_id:a.document_id,request_id:a.request_id,stop_node:a.stop_node})}",a)
            events=finish('cancel-preparing','generation_error');assert events[-1]['code']=='CANCELLED'
            page.wait_for_timeout(300);assert page.locator('[data-bridge-assistant]').count()==before
            execute(action('after-prepare-cancel'));finish('after-prepare-cancel')
        record('cancel_during_preparation_never_sends_and_next_request_recovers',cancelled_preparation)
        def recorder_picker():
            a=action('picker');old=page.input_value('#prompt')
            execute({'type':'pick','document_id':a['document_id'],'mapping':'prompt'})
            page.locator('#prompt').hover();page.locator('#prompt').click()
            page.wait_for_function("__events.some(e=>e.type==='picked'&&e.mapping==='prompt')")
            assert page.input_value('#prompt')==old
        record('connector_picker_selects_control_without_editing_or_submitting',recorder_picker)
        def custom_model_menu():
            page.evaluate("""(()=>{const select=document.getElementById('model');select.style.display='none';const b=document.createElement('button');b.id='custom-model';b.setAttribute('aria-label','Model selector');b.textContent='Model selector';b.onclick=()=>{const m=document.createElement('div');m.id='custom-model-menu';m.setAttribute('role','listbox');for(const value of ['mock-small','mock-reasoner']){const o=document.createElement('button');o.setAttribute('role','option');o.setAttribute('data-value',value);o.textContent=value;o.onclick=()=>{select.value=value;m.remove()};m.append(o)}document.getElementById('chat').append(m)};document.getElementById('chat').append(b);__BRIDGE_RESCAN__()})()""")
            page.wait_for_function("__events.filter(e=>e.type==='observation').at(-1).controls.some(n=>n.label==='Model selector')")
            snap=page.evaluate("__events.filter(e=>e.type==='observation').at(-1)");a=action('custom-menu',model='mock-reasoner')
            a['model_control']=next(n['id'] for n in snap['controls'] if n['label']=='Model selector')
            execute(a);finish('custom-menu');assert page.input_value('#model')=='mock-reasoner'
        record('custom_model_popover_selects_exact_observed_option',custom_model_menu)
        def preserve_draft():
            before=page.locator('[data-bridge-assistant]').count();page.fill('#prompt','Unsent user draft: never replace me')
            a=action('unsent-draft');a['model_control']=0;execute(a);events=finish('unsent-draft','generation_error')
            assert events[-1]['code']=='UNSENT_DRAFT';assert page.input_value('#prompt')=='Unsent user draft: never replace me'
            assert page.locator('[data-bridge-assistant]').count()==before;page.fill('#prompt','')
        record('automation_preserves_unsent_user_draft_without_submission',preserve_draft)
        def changed_composer():
            before=page.locator('[data-bridge-assistant]').count()
            page.evaluate("document.getElementById('prompt').addEventListener('input',e=>{e.target.value='User edit during automation'},{once:true})")
            a=action('changed-composer');a['model_control']=0;execute(a);events=finish('changed-composer','generation_error')
            assert events[-1]['code']=='COMPOSER_CHANGED';assert page.locator('[data-bridge-assistant]').count()==before
            assert page.input_value('#prompt')=='User edit during automation';page.fill('#prompt','')
        record('changed_composer_is_not_auto_submitted',changed_composer)
        def paused_observer():
            a=action('pause-policy');execute({'type':'discovery_policy','document_id':a['document_id'],'enabled':False});page.wait_for_timeout(300)
            n=page.evaluate("__events.filter(e=>e.type==='observation').length")
            page.evaluate("document.getElementById('chat').setAttribute('aria-label','ordinary page');__BRIDGE_RESCAN__()")
            page.wait_for_timeout(400);assert page.evaluate("__events.filter(e=>e.type==='observation').length")==n
            execute({'type':'discovery_policy','document_id':a['document_id'],'enabled':True})
            page.wait_for_function("n=>__events.filter(e=>e.type==='observation').length>n",arg=n)
        record('discovery_pause_stops_observation_and_explicit_resume_restarts',paused_observer)
        page.screenshot(path=str(OUT/'mock-provider-browser.png'),full_page=True)
        context.close();browser.close()
except Exception:
    traceback.print_exc()
finally:
    report={'scope':'Actual browser/agent.js in Chromium with IN-MEMORY DOM/network/storage fixtures. Administrator URLBlocklist blocks HTTP browser navigation. HTTP streaming tested separately with Node. NOT Tauri, WebKitGTK, actual persistent browser profiles, Zag, or live harness verification.',
            'tests':results,'passed':sum(x['status']=='PASS' for x in results),'failed':sum(x['status']=='FAIL' for x in results)}
    (OUT/'browser-dom-tests.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k!='tests'},indent=2))
    if report['failed'] or not results:sys.exit(1)
