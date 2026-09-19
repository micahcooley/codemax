#!/usr/bin/env python3
"""Report prerequisites. Missing native tools are BLOCKED, not a passing build."""
from __future__ import annotations
import json,os,pathlib,platform,shutil,subprocess,sys
root=pathlib.Path(__file__).resolve().parents[1]
znc=os.environ.get('ZNC',str(root/'.toolchain/zag/zag-poc/znc'))
checks={name:shutil.which(name) for name in ('node','npm','git','cargo','rustc','pkg-config','python3')}
checks['znc']=znc if pathlib.Path(znc).is_file() and os.access(znc,os.X_OK) else None
checks['svelte']=(root/'node_modules/svelte/package.json').is_file()
checks['vite']=(root/'node_modules/vite/package.json').is_file()
checks['svelte_check']=(root/'node_modules/.bin/svelte-check').is_file()
checks['linux_x86_64']=platform.system()=='Linux' and platform.machine()=='x86_64'
if checks['pkg-config']:
 checks['webkit2gtk-4.1']=subprocess.run(['pkg-config','--exists','webkit2gtk-4.1'],check=False).returncode==0
result={'status':'READY_FOR_BUILD_ATTEMPT' if all(checks.values()) else 'BLOCKED','checks':checks,
 'note':'A successful prerequisite check is not a compile, runtime or release qualification.'}
print(json.dumps(result,indent=2))
sys.exit(0 if all(checks.values()) else 77)
