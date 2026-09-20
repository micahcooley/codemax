#!/usr/bin/env python3
"""Package full application sources + built UI + evidence; no native installer claim."""
from __future__ import annotations
import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
EXCLUDED = {'.git','node_modules','target','build','.toolchain','__pycache__','.state','profiles','.cache'}
PACKAGING = {'MANIFEST.sha256','PACKAGE_METADATA.json'}

def source_files():
    return sorted(f for f in ROOT.rglob('*') if f.is_file() and not f.is_symlink()
        and not any(part in EXCLUDED for part in f.relative_to(ROOT).parts)
        and f.suffix not in {'.pyc','.zip','.ttf','.otf','.woff','.woff2'}
        and f.name not in {'local-token','.env'} and not f.name.startswith('.env.'))

def load(name):
    return json.loads((ROOT/name).read_text())

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=pathlib.Path,required=True)
    args=parser.parse_args()
    output=args.output.resolve();output.parent.mkdir(parents=True,exist_ok=True)
    if output.is_relative_to(ROOT):
        raise SystemExit('Write the delivery ZIP outside the project to prevent self-inclusion.')
    content=[f for f in source_files() if f.name not in PACKAGING]
    manifest=''.join(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.relative_to(ROOT).as_posix()+'\n' for f in content)
    (ROOT/'MANIFEST.sha256').write_text(manifest)
    def head():
        try:return subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()
        except (OSError,subprocess.CalledProcessError):return None
    ui=load('tests/evidence/ui-browser.json')
    dom=load('tests/evidence/browser-dom-tests.json')
    chrome=load('tests/evidence/single-tab-ui.json')
    codemax=load('tests/evidence/codemax-ui.json')
    audit=load('tests/evidence/ux-audit.json')
    tap=(ROOT/'tests/evidence/node-current.log').read_text()
    def tap_count(name):
        matches=re.findall(r'^# '+name+r' (\d+)\s*$',tap,re.MULTILINE)
        if len(matches)!=1:raise ValueError('Missing or ambiguous Node test summary: '+name)
        return int(matches[0])
    if (tap_count('fail') or any(row['status']!='PASS' for row in ui['results'])
        or chrome['failed'] or codemax['failed'] or audit['failed'] or audit.get('runtime_errors')
        or chrome.get('runtime_errors') or codemax.get('runtime_errors')
        or any(row['status']!='PASS' for row in dom.get('tests',[]))):
        raise SystemExit('Refusing to package a revision with failed UI/Node evidence.')
    metadata={
        'name':'Codemax','version':load('package.json')['version'],
        'revision':'whole-interface-ux-audit',
        'kind':'desktop-source-plus-compiled-svelte-ui','local_commit':head(),
        'native_installer_included':False,'full_masterplan_complete':False,'release_qualified':False,
        'file_count_excluding_packaging_metadata':len(content),
        'compiled_ui':load('tests/evidence/frontend-build.json'),
        'compiled_ui_suites':{
            'application':{'passed':len(ui['results']),'failed':0,'evidence':'tests/evidence/ui-browser.json'},
            'discovery_mcp':{'passed':codemax['passed'],'failed':codemax['failed'],'evidence':'tests/evidence/codemax-ui.json'},
            'single_tab':{'passed':chrome['passed'],'failed':chrome['failed'],'evidence':'tests/evidence/single-tab-ui.json'},
            'whole_interface_ux':{'passed':audit['passed'],'failed':audit['failed'],'evidence':'tests/evidence/ux-audit.json'},
            'total_passed':len(ui['results'])+chrome['passed']+codemax['passed']+audit['passed'],
            'scope':'Compiled Svelte with native-host/website test doubles; no native execution.',
        },
        'node_tests':{'passed':tap_count('pass'),'failed':tap_count('fail'),'evidence':'tests/evidence/node-current.log'},
        'browser_test_cases':len(dom.get('tests',[])),
        'browser_evidence':'tests/evidence/browser-dom-tests.json',
        'native_zag_build':'NOT_RUN_THIS_UI_REVISION','native_tauri_build':'NOT_RUN_THIS_UI_REVISION',
        'normal_vite_and_svelte_check':'NOT_VERIFIED',
        'live_website_and_mcp_tests':'NOT_RUN_THIS_UI_REVISION','real_coding_harness':'NOT_RUN',
        'prior_closeout':'docs/history/single-tab-closeout.md',
        'unchanged_native_source':load('tests/evidence/native-source-unchanged.json'),
        'prerequisite_check':load('tests/evidence/ux-prerequisites.json'),
        'ux_audit_document':'docs/UX_AUDIT.md',
        'manifest_sha256':hashlib.sha256(manifest.encode()).hexdigest(),
        'manifest_excludes':sorted(PACKAGING),
        'compiler_pin':'abed8aa170ef1bc33e5aca68b99fcdd905a4545f',
    }
    (ROOT/'PACKAGE_METADATA.json').write_text(json.dumps(metadata,indent=2)+'\n')
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for path in source_files():
            relative=path.relative_to(ROOT).as_posix()
            info=zipfile.ZipInfo('desktop-ai-bridge/'+relative,date_time=(2026,9,19,0,0,0))
            info.external_attr=(path.stat().st_mode & 0xFFFF)<<16;info.compress_type=zipfile.ZIP_DEFLATED
            archive.writestr(info,path.read_bytes())
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None,'Archive CRC verification failed'
        for line in manifest.splitlines():
            digest,name=line.split('  ',1)
            assert hashlib.sha256(archive.read('desktop-ai-bridge/'+name)).hexdigest()==digest,name
        assert len(archive.namelist())==len(content)+2
        assert any(name.startswith('desktop-ai-bridge/dist/') for name in archive.namelist())
        count=len(archive.namelist())
    digest=hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix(output.suffix+'.sha256').write_text(f'{digest}  {output.name}\n')
    print(json.dumps({'path':str(output),'bytes':output.stat().st_size,'entries':count,'sha256':digest,'crc_and_manifest_verification':'PASS'},indent=2))

if __name__=='__main__':main()
