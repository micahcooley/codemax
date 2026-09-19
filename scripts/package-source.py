#!/usr/bin/env python3
"""Package full application sources + built UI + evidence; no native installer claim."""
from __future__ import annotations
import argparse
import hashlib
import json
import pathlib
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
    local=load('tests/evidence/file-permission-probe.json')
    metadata={
        'name':'Desktop AI Bridge','version':load('package.json')['version'],
        'kind':'desktop-source-plus-compiled-svelte-ui','local_commit':head(),
        'native_installer_included':False,'full_masterplan_complete':False,'release_qualified':False,
        'file_count_excluding_packaging_metadata':len(content),
        'compiled_ui':load('tests/evidence/frontend-build.json'),
        'ui_test_cases':len(ui['results']),
        'node_tests':{'passed':20,'failed':0,'evidence':'tests/evidence/node-tests.log'},
        'browser_test_cases':len(dom.get('tests',[])),
        'local_reference_permission_cases':len(local['results']),
        'local_reference_client_language':'Python test only; not production Zag',
        'zag_static_audit':load('tests/evidence/zag-static-contracts.json'),
        'native_build':'BLOCKED_COMPILER_ABSENT','native_tauri_build':'NOT_RUN_TOOLCHAIN_ABSENT',
        'live_website_tool_shaped_output':'PASS',
        'live_new_session_relay':'FAILED_CONTEXT_CONTINUITY',
        'live_native_end_to_end':'NOT_VERIFIED','real_coding_harness':'NOT_RUN',
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
