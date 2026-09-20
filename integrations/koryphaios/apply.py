#!/usr/bin/env python3
"""Apply the Codemax provider to the inspected Koryphaios source without a remote write.
Validates every target blob and every edit before changing any file. Backups retained.
"""
import argparse, hashlib, json, os, pathlib, shutil, subprocess, tempfile
ROOT=pathlib.Path(__file__).resolve().parent
BASE='2faf969f6cc6118a85bba6c6a9781983daad8f1e'
TARGETS={
 'backend/src/providers/registry.ts':'ca2e4fd8510b5aec89d2899f5259086d71ec0856',
 'backend/src/providers/provider-configs.ts':'b1e1a47ab529c9a913e6b559cfbd859f671b67a7',
 'backend/src/providers/provider-display.ts':'9a5a492b5872e6674a75f5adf194cb23b30bb0a1',
 'shared/src/reasoning/ReasoningFunctions.ts':'257de3235f04702e97323f040b446ab944e819f1',
}
def blob(b:bytes)->str:return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def once(s,old,new):
 if s.count(old)!=1:raise ValueError(f'Expected exactly one source anchor: {old[:80]}')
 return s.replace(old,new,1)
def main():
 p=argparse.ArgumentParser();p.add_argument('repository',type=pathlib.Path);p.add_argument('--check',action='store_true');a=p.parse_args();repo=a.repository.resolve()
 if not (repo/'.git').exists():raise ValueError('Provide a Koryphaios Git checkout')
 changes={}
 for name,sha in TARGETS.items():
  path=repo/name
  if path.is_symlink():raise ValueError(f'Refusing symlink target {name}')
  b=path.read_bytes()
  if blob(b)!=sha:raise ValueError(f'{name} differs from inspected source. Refusing to overwrite; base commit {BASE}.')
  changes[name]=b.decode()
 name='backend/src/providers/provider-configs.ts';s=changes[name]
 s=once(s,'export const PROVIDER_CONFIGS: ProviderConfig[] = [',"""export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {name:'codemax',baseUrl:'http://127.0.0.1:7331/v1',authMode:'base_url_only',envKeys:['CODEMAX_LOCAL_TOKEN'],envUrlKey:'CODEMAX_BASE_URL'},""");changes[name]=s
 name='backend/src/providers/provider-display.ts';s=changes[name]
 s=once(s,'export const PROVIDER_DISPLAY: Partial<Record<ProviderName, ProviderDisplayMeta>> = {',"""export const PROVIDER_DISPLAY: Partial<Record<ProviderName, ProviderDisplayMeta>> = {
  codemax: {
    label: 'Codemax websites', iconPath: '/provider-icons/codemax.svg', deployment: 'local',
    description: 'Uses websites already signed in through Codemax. Models, reasoning levels and context evidence are fetched from its local gateway; no provider API key.',
    managerHint: 'Website limits apply. Unknown context is not unlimited. Do not replay an interrupted tool turn or switch website/model silently.',
  },""");changes[name]=s
 name='backend/src/providers/registry.ts';s=changes[name]
 s="import { CodemaxProvider } from './codemax';\n"+s
 s=once(s,"const LOCAL_PROVIDER_KEYS = new Set<ProviderName>([", "const LOCAL_PROVIDER_KEYS = new Set<ProviderName>(['codemax',")
 s=once(s,'const PROVIDER_FACTORIES: Partial<Record<ProviderName, ProviderFactory>> = {',"const PROVIDER_FACTORIES: Partial<Record<ProviderName, ProviderFactory>> = {\n  codemax: (config) => new CodemaxProvider(config),")
 s=once(s,'    const userConfig = this.config?.providers?.[name];',"""    const userConfig = this.config?.providers?.[name];
    if (name === 'codemax') {
      // Observe only the app-owned local connection file. Never prompt, spawn,
      // spend quota or copy website credentials during model discovery.
      return {name, disabled:userConfig?.disabled ?? false, apiKey:userConfig?.apiKey,
        baseUrl:userConfig?.baseUrl, selectedModels:userConfig?.selectedModels ?? [],
        hideModelSelector:userConfig?.hideModelSelector ?? false};
    }""")
 # This switch is in verifyConnection; method uses the already configured instance.
 s=once(s,"      switch (name) {\n        case 'claude':", """      switch (name) {
        case 'codemax': {
          const adapter = this.providers.get(name);
          if (!(adapter instanceof CodemaxProvider) || !adapter.isAvailable())
            return {success:false,error:'Start Codemax and its local gateway; website logins stay in the browser.'};
          await adapter.refreshModels(true);
          const error=adapter.getModelDiscoveryError();
          return error ? {success:false,error} : {success:true,state:'detected',scope:'catalog'};
        }
        case 'claude':""")
 # Codemax manages continuation and cannot safely retry ambiguous website effects.
 s=once(s,'      // Check circuit breaker\n',"""      if (provider.name === 'codemax') {
        yield* provider.streamResponse({...request, model:currentModel});
        return; // Never registry-retry or automatically fallback a website turn.
      }
      // Check circuit breaker
""")
 changes[name]=s
 name='shared/src/reasoning/ReasoningFunctions.ts';s=changes[name]
 s=once(s,"  if (!reasoningLevel) return undefined;", "  if (!reasoningLevel) return undefined;\n  if (provider === 'codemax') return reasoningLevel.trim(); // Preserve observed case-sensitive website values.")
 changes[name]=s
 for path in (ROOT/'overlay').rglob('*'):
  if path.is_file():
   rel=path.relative_to(ROOT/'overlay').as_posix()
   if (repo/rel).exists():raise ValueError(f'New file already exists: {rel}')
   changes[rel]=path.read_text()
 if a.check:
  print(json.dumps({'status':'validated_not_applied','base':BASE,'files':list(changes)},indent=2));return
 backup=pathlib.Path(tempfile.mkdtemp(prefix='codemax-before-',dir=repo/'.git'))
 for name in TARGETS:
  to=backup/name;to.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(repo/name,to)
 applied=[]
 try:
  for name,text in changes.items():
   target=repo/name;target.parent.mkdir(parents=True,exist_ok=True)
   fd,temp=tempfile.mkstemp(prefix='.codemax-',dir=target.parent)
   with os.fdopen(fd,'w') as stream:stream.write(text);stream.flush();os.fsync(stream.fileno())
   os.chmod(temp,0o644);os.replace(temp,target);applied.append(name)
 except BaseException:
  for name in applied:
   if (backup/name).exists():shutil.copy2(backup/name,repo/name)
   else:(repo/name).unlink(missing_ok=True)
  raise
 print(json.dumps({'status':'applied_not_built','files':applied,'backup':str(backup)},indent=2))
 print('Review git diff, then run the existing Koryphaios build/test commands. No remote commit has been made.')
if __name__=='__main__':main()
