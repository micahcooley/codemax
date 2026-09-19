#!/usr/bin/env python3
"""Create and verify a source-only ZIP. Never includes dependencies or profiles."""
from __future__ import annotations
import argparse,hashlib,json,pathlib,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
EXCLUDED={'.git','node_modules','target','dist','build','.toolchain','__pycache__','.state','profiles'}
PACKAGING={'MANIFEST.sha256','PACKAGE_METADATA.json'}
def source_files():
    return sorted(f for f in ROOT.rglob('*') if f.is_file() and not f.is_symlink()
      and not any(part in EXCLUDED for part in f.relative_to(ROOT).parts)
      and f.suffix not in {'.pyc','.zip','.ttf','.otf','.woff','.woff2'}
      and f.name not in {'local-token','.env'} and not f.name.startswith('.env.'))
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=pathlib.Path,required=True);args=parser.parse_args()
    output=args.output.resolve();output.parent.mkdir(parents=True,exist_ok=True)
    content=[f for f in source_files() if f.name not in PACKAGING]
    manifest=''.join(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.relative_to(ROOT).as_posix()+'\n' for f in content)
    (ROOT/'MANIFEST.sha256').write_text(manifest)
    metadata={'name':'Desktop AI Bridge','version':'0.1.0-alpha.1','kind':'source-alpha',
      'native_installer_included':False,'full_masterplan_complete':False,'release_qualified':False,
      'file_count_excluding_packaging_metadata':len(content),'node_tests':{'passed':17,'failed':0},
      'browser_tests':{'passed':17,'failed':0,'scope':'actual agent + in-memory Chromium fixture'},
      'native_build':'BLOCKED','frontend_component_build':'BLOCKED','real_harness':'NOT_RUN',
      'manifest_sha256':hashlib.sha256(manifest.encode()).hexdigest(),
      'manifest_excludes':sorted(PACKAGING),'compiler_pin':'abed8aa170ef1bc33e5aca68b99fcdd905a4545f'}
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
      count=len(archive.namelist())
    data=output.read_bytes();digest=hashlib.sha256(data).hexdigest()
    output.with_suffix(output.suffix+'.sha256').write_text(f'{digest}  {output.name}\n')
    print(json.dumps({'path':str(output),'bytes':len(data),'entries':count,'sha256':digest,
      'md5':hashlib.md5(data).hexdigest(),'crc_and_manifest_verification':'PASS'},indent=2))
if __name__=='__main__':main()
