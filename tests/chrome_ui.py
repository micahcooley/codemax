"""Single-tab browser UX regression tests using the actual compiled components.

Only Tauri IPC and website content are doubles. These tests do not execute Zag,
log into a real provider, or certify a native desktop build.
"""
from __future__ import annotations
import json
import os
import pathlib
import subprocess
import time
import traceback
from playwright.sync_api import sync_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'tests/evidence'
SHOTS = ROOT / 'screenshots'
modules = json.loads(subprocess.check_output(
    ['node', str(ROOT/'tests/render-module-graph.mjs'), str(ROOT/'dist')], text=True))
results, errors = [], []

def record(name, fn):
    start = time.monotonic()
    try:
        fn()
        results.append({'name': name, 'status': 'PASS', 'seconds': round(time.monotonic()-start, 3)})
        print('PASS', name, flush=True)
    except Exception as exc:
        results.append({'name': name, 'status': 'FAIL', 'error': str(exc)})
        print('FAIL', name, flush=True)
        raise

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/usr/bin/chromium'),
                                headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1500, 'height': 940}, device_scale_factor=1)
    page.set_default_timeout(7000)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Codemax chrome regression</title></head><body><div id="app"></div></body></html>')
    page.add_style_tag(content=(ROOT/'dist/ui.css').read_text())
    page.evaluate('(html)=>window.__fixtureWebsite=html', (ROOT/'tests/fixtures/ui-website.html').read_text())
    page.evaluate((ROOT/'tests/fixtures/ui-host.js').read_text())
    # Exercise an upgrade from the previous release's two open side panels.
    page.evaluate("localStorage.setItem('bridge.layout.v1',JSON.stringify({left:true,right:true,sidebar:260,inspector:280,order:[1,2,3]}))")
    page.evaluate('''(modules)=>{const imports={};for(const [key,code]of Object.entries(modules))imports[key]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);}''', modules)
    page.add_script_tag(type='module', content="import 'bridge/src/main.js';")
    page.wait_for_selector('.app-shell', timeout=20000)
    page.evaluate("async()=>{window.__chromeApp=(await import('bridge/src/lib/state/app.svelte.js')).app}")

    def open_first():
        page.get_by_role('tab', name='Local test provider', exact=True).click()
        page.wait_for_function('window.__uiFixture.bounds.visible&&window.__uiFixture.bounds.provider_id===1')

    def route(label):
        page.get_by_role('button', name='Codemax menu', exact=True).click()
        page.get_by_role('menuitem', name=label, exact=True).click()

    def calls(op):
        return page.evaluate('(op)=>window.__uiFixture.calls.filter(c=>c.op===op)', op)

    try:
        def one_strip():
            expect(page.get_by_role('tablist')).to_have_count(1)
            assert not page.locator('.workspace-sidebar,.site-row').count()
            assert not page.get_by_text('Browser tabs', exact=True).count()
            open_first()
            expect(page.get_by_role('tab', selected=True)).to_have_count(1)
            assert page.get_by_role('tab', selected=True).get_attribute('aria-label') == 'Local test provider'
            assert not page.locator('.inspector').count()
            page.wait_for_function('window.__uiFixture.bounds.x===0&&window.__uiFixture.bounds.width===innerWidth')
            page.screenshot(path=str(SHOTS/'12-single-tab-browser.png'), animations='disabled')
        record('One top tab strip; no sidebar; full-width website; legacy layout migrates closed', one_strip)

        def quick_links():
            tabs_before = page.locator('[data-provider-id]').count()
            for label, address in [('Providers','providers'), ('Tools & MCP','tools'), ('Connect a client','harness')]:
                page.get_by_role('navigation', name='Codemax tools').get_by_role('button', name=label, exact=True).click()
                expect(page.get_by_role('textbox', name='Address bar')).to_have_value('codemax://'+address)
                expect(page.get_by_role('tab', selected=True)).to_have_count(1)
                assert page.locator('[data-provider-id]').count() == tabs_before
                assert not page.evaluate('window.__uiFixture.bounds.visible')
                assert not page.locator('.workspace-sidebar,.site-row').count()
            page.get_by_role('button', name='Return to browser', exact=True).click()
            page.wait_for_function('window.__uiFixture.bounds.visible')
        record('Providers, Tools and Connect are utilities; websites retain one set of tabs', quick_links)

        def menu_and_keyboard():
            page.get_by_role('button', name='Codemax menu', exact=True).click()
            expect(page.get_by_role('menu')).to_have_count(1)
            page.wait_for_function('window.__uiFixture.bounds.visible===false')
            assert page.get_by_role('dialog').locator('.tab-activity').count() == 0
            page.keyboard.press('End')
            assert page.evaluate('document.activeElement.textContent').strip() == 'Keyboard shortcuts'
            page.keyboard.press('Home')
            assert page.evaluate('document.activeElement.textContent').strip().startswith('New tab')
            page.keyboard.press('ArrowDown')
            assert page.evaluate('document.activeElement.textContent').strip().startswith('Providers')
            page.keyboard.press('Escape')
            expect(page.get_by_role('dialog')).to_have_count(0)
            page.wait_for_function('window.__uiFixture.bounds.visible===true')
            assert page.get_by_role('button', name='Codemax menu', exact=True).evaluate('(e)=>document.activeElement===e')
        record('App menu has keyboard navigation, restores focus and hides untrusted native surface', menu_and_keyboard)

        def utility_close():
            before = len(calls('provider.close'))
            route('Models')
            expect(page.get_by_role('heading', name='Models', exact=True)).to_be_visible()
            page.keyboard.press('Control+w')
            page.wait_for_function('window.__uiFixture.bounds.visible===true')
            assert len(calls('provider.close')) == before
            expect(page.get_by_role('tab', name='Local test provider', exact=True)).to_have_attribute('aria-selected','true')
        record('Ctrl-W closes a utility page without closing the selected website', utility_close)

        def every_page():
            for title in ['Providers','Tools & MCP','Models','Sessions','Connect a client','Detector','Activity','Settings']:
                route(title)
                expect(page.locator('.utility-tab [role=tab]')).to_have_text(title)
                assert not page.locator('.workspace-sidebar').count()
            assert not page.get_by_role('switch', name='Provider sidebar', exact=True).count()
            open_first()
        record('Every existing management screen remains reachable from the app menu', every_page)

        def selection():
            first = page.get_by_role('tab', name='Local test provider', exact=True)
            first.focus()
            page.keyboard.press('ArrowRight')
            expect(page.get_by_role('tab', name='Qwen', exact=True)).to_have_attribute('aria-selected', 'true')
            page.keyboard.press('End')
            expect(page.get_by_role('tab', name='Z.ai', exact=True)).to_have_attribute('aria-selected', 'true')
            page.keyboard.press('Home')
            expect(first).to_have_attribute('aria-selected', 'true')
            page.keyboard.press('Control+Tab')
            expect(page.get_by_role('tab', name='Qwen', exact=True)).to_have_attribute('aria-selected','true')
            page.keyboard.press('Control+Shift+Tab')
            expect(first).to_have_attribute('aria-selected','true')
            expect(page.locator('.title-tabs [role=tab][tabindex="0"]')).to_have_count(1)
        record('Arrow, Home, End, Ctrl-Tab and reverse tab navigation use the single tab strip', selection)

        def context():
            open_first()
            first = page.get_by_role('tab', name='Local test provider', exact=True)
            first.click(button='right')
            page.get_by_role('menu',name='Local test provider actions').wait_for()
            page.wait_for_function('window.__uiFixture.bounds.visible===false')
            rect = page.get_by_role('dialog').bounding_box()
            assert rect and rect['x'] >= 130 and rect['y'] < 80, rect
            expect(page.get_by_role('menuitem', name='Move tab left',exact=True)).to_be_disabled()
            page.get_by_role('menuitem', name='Move tab right',exact=True).click()
            assert page.locator('[data-provider-id]').first.get_attribute('data-provider-id')=='2'
            first.focus();page.keyboard.press('Shift+F10')
            page.get_by_role('menuitem', name='Move tab left',exact=True).click()
            assert page.locator('[data-provider-id]').first.get_attribute('data-provider-id')=='1'
            first.click(button='right')
            page.get_by_role('menuitem', name='Clear local profile',exact=True).click()
            page.get_by_role('dialog').wait_for()
            assert not calls('provider.clear_profile')
            page.get_by_role('button',name='Cancel',exact=True).click()
            page.wait_for_function('window.__uiFixture.bounds.visible===true')
        record('Top-tab context menu supports reorder, keyboard access and confirmed profile clearing', context)

        def drag_reorder():
            first=page.locator('[data-provider-id="1"]')
            third=page.locator('[data-provider-id="3"]')
            first.drag_to(third)
            assert page.locator('[data-provider-id]').evaluate_all('(els)=>els.map(e=>e.dataset.providerId)')==['2','1','3']
            page.evaluate('window.__chromeApp.moveTab(1,-1);window.__chromeApp.moveTab(1,-1)')
            assert page.locator('[data-provider-id]').first.get_attribute('data-provider-id')=='1'
        record('Drag-and-drop tab ordering remains available without the sidebar', drag_reorder)

        def preserved_registry():
            page.get_by_role('button',name='Close Local test provider tab',exact=True).click()
            page.wait_for_function('!window.__uiFixture.snapshot.providers[0].open_tab')
            assert not page.get_by_role('tab',name='Local test provider',exact=True).count()
            route('Providers')
            expect(page.locator('.provider-choice')).to_have_count(1)
            assert 'Local test provider' in page.locator('.provider-choice').inner_text()
            page.get_by_role('button',name='Open tab',exact=True).click()
            page.wait_for_function('window.__uiFixture.bounds.visible&&window.__uiFixture.bounds.provider_id===1')
            expect(page.get_by_role('tab',name='Local test provider',exact=True)).to_have_count(1)
        record('Closing a top tab preserves its detected provider and reopening does not duplicate it', preserved_registry)

        def inspector():
            assert not page.locator('.inspector').count()
            page.get_by_role('button',name='Toggle connection inspector',exact=True).click()
            expect(page.locator('.inspector')).to_be_visible()
            page.wait_for_function('window.__uiFixture.bounds.width<innerWidth-240')
            page.get_by_role('button',name='Close inspector',exact=True).click()
            page.wait_for_function('window.__uiFixture.bounds.width===innerWidth')
            page.evaluate('window.__chromeApp.restoreLayout()')
            assert not page.locator('.inspector').count()
        record('Inspector is opt-in, bounds follow it and the closed preference persists', inspector)

        def internal_addresses():
            before=len(calls('provider.add'))
            page.keyboard.press('Control+l')
            page.get_by_role('textbox',name='Address bar').fill('codemax://providers')
            page.keyboard.press('Enter')
            expect(page.get_by_role('heading',name='Providers',exact=True)).to_be_visible()
            page.keyboard.press('Control+l')
            page.keyboard.press('Enter')
            expect(page.get_by_role('heading',name='Providers',exact=True)).to_be_visible()
            page.keyboard.press('Control+l')
            page.get_by_role('textbox',name='Address bar').fill('codemax://not-a-page')
            page.keyboard.press('Enter')
            expect(page.get_by_role('alert')).to_contain_text('That Codemax page does not exist')
            assert len(calls('provider.add'))==before
            page.get_by_role('button',name='Dismiss error').click()
            open_first()
        record('Internal addresses identify management pages and never create remote provider tabs', internal_addresses)

        def overflow():
            for i in range(4,17):
                page.evaluate('(i)=>{const p=JSON.parse(JSON.stringify(window.__uiFixture.snapshot.providers[1]));p.id=i;p.label="Website "+i;p.origin="https://example"+i+".test";window.__uiFixture.snapshot.providers.push(p);window.__uiFixture.push()}',i)
            page.set_viewport_size({'width':1000,'height':680})
            page.keyboard.press('Control+9')
            expect(page.get_by_role('tab',name='Website 16',exact=True)).to_have_attribute('aria-selected','true')
            page.wait_for_timeout(100)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.get_by_role('button',name='Codemax menu',exact=True).click()
            rect=page.get_by_role('dialog').bounding_box()
            assert rect and rect['x']>=0 and rect['x']+rect['width']<=1000 and rect['y']+rect['height']<=680
            page.keyboard.press('Escape')
            page.evaluate('window.__uiFixture.snapshot.providers=window.__uiFixture.snapshot.providers.filter(p=>p.id<=3);window.__uiFixture.push()')
            page.set_viewport_size({'width':1500,'height':940})
            open_first()
        record('Sixteen tabs fit via strip scrolling; controls and menus remain usable at 1000 × 680', overflow)

        def rings_and_shots():
            arc=page.locator('[data-provider-id="1"] .activity-ring')
            page.evaluate('window.__uiFixture.snapshot.providers[0].browser_busy=true;window.__uiFixture.push()')
            page.wait_for_function('document.querySelector("[data-provider-id=\\"1\\"] .tab-activity").dataset.state==="working"')
            assert arc.evaluate('(e)=>getComputedStyle(e).animationName')=='spin'
            assert page.locator('[data-provider-id="2"] .activity-ring').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
            page.screenshot(path=str(SHOTS/'13-single-tab-working.png'))
            page.emulate_media(reduced_motion='reduce')
            assert arc.evaluate('(e)=>getComputedStyle(e).animationName')=='none'
            page.emulate_media(reduced_motion='no-preference')
            page.evaluate('window.__uiFixture.snapshot.providers[0].browser_busy=false;window.__uiFixture.push()')
            page.get_by_role('button',name='Providers',exact=True).click()
            page.screenshot(path=str(SHOTS/'14-single-tab-providers.png'),animations='disabled')
            open_first()
        record('Spinning/idle rings remain on the top tabs and respect reduced motion', rings_and_shots)

        def no_extra_permissions():
            assert not calls('provider.remove') and not calls('provider.clear_profile')
            assert not calls('filesystem.allow') and not calls('mcp.run.approve')
            assert not errors, errors
        record('Chrome navigation does not authorize tools or delete profiles; no runtime errors', no_extra_permissions)

    except Exception:
        page.screenshot(path=str(OUT/'single-tab-failure.png'))
        traceback.print_exc()
    finally:
        report={'scope':'Actual compiled Svelte UI in Chromium; Tauri/native-provider test doubles only.',
                'native_tauri_executed':False,'zag_executed':False,'live_provider_contacted':False,
                'passed':sum(r['status']=='PASS' for r in results),'failed':sum(r['status']=='FAIL' for r in results),
                'tests':results,'runtime_errors':errors,'chromium':browser.version}
        (OUT/'single-tab-ui.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report,indent=2),flush=True)
        browser.close()
if report['failed'] or errors:
    raise SystemExit(1)
