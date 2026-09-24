#!/usr/bin/env python3
"""Report prerequisites. Missing native tools are BLOCKED, not a passing build.
Platform-aware: Linux x86_64 needs the Zag toolchain and WebKitGTK; macOS needs
Xcode CLT (cc), json-c via pkg-config, and ships the Zag sidecar when the
pinned macOS compiler is installed (.toolchain/zag-macos-arm64/znc),
otherwise the app runs in fallback browsing mode."""
from __future__ import annotations
import json,os,pathlib,platform,shutil,subprocess,sys
root=pathlib.Path(__file__).resolve().parents[1]
system=platform.system()
machine=platform.machine()
is_linux=system=='Linux' and machine=='x86_64'
is_macos=system=='Darwin' and machine in ('arm64','x86_64')
znc=os.environ.get('ZNC',str(root/'.toolchain/zag/zag-poc/znc'))
checks={name:shutil.which(name) for name in ('node','npm','git','cargo','rustc','pkg-config','python3','cc')}
checks['svelte']=(root/'node_modules/svelte/package.json').is_file()
checks['vite']=(root/'node_modules/vite/package.json').is_file()
checks['svelte_check']=(root/'node_modules/.bin/svelte-check').is_file()
if is_linux:
 checks['znc']=znc if pathlib.Path(znc).is_file() and os.access(znc,os.X_OK) else None
 checks['linux_x86_64']=True
 if checks['pkg-config']:
  checks['webkit2gtk-4.1']=subprocess.run(['pkg-config','--exists','webkit2gtk-4.1'],check=False).returncode==0
else:
 checks['linux_x86_64']=None
if is_macos:
 checks['macos']=True
 checks['json-c']=bool(checks['pkg-config']) and subprocess.run(['pkg-config','--exists','json-c'],check=False).returncode==0
 znc_mac=os.environ.get('ZNC',str(root/'.toolchain/zag-macos-arm64/znc'))
 checks['znc_macos']=znc_mac if pathlib.Path(znc_mac).is_file() and os.access(znc_mac,os.X_OK) else None
 checks['zag_backend']='MACOS_NATIVE_SIDECAR' if checks['znc_macos'] else 'UNAVAILABLE_ON_MACOS'
else:
 checks['macos']=None
if not (is_linux or is_macos):
 checks['supported_platform']=None
else:
 checks['supported_platform']=True
informational={'linux_x86_64','macos','supported_platform','zag_backend'}
required=[v for k,v in checks.items() if k not in informational]
ready=all(required) and bool(checks['supported_platform'])
result={'status':'READY_FOR_BUILD_ATTEMPT' if ready else 'BLOCKED','checks':checks,
 'note':'A successful prerequisite check is not a compile, runtime or release qualification.'}
print(json.dumps(result,indent=2))
sys.exit(0 if ready else 77)
