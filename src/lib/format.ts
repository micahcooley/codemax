import type {Provider,Model} from './types/bridge';
export const number=(n:number|undefined):string=>(n??0).toLocaleString('en-US');
export const short=(n:number):string=>n>=1000000?`${(n/1000000).toFixed(1)}m`:n>=1000?`${(n/1000).toFixed(1)}k`:`${n}`;
export function hostname(url:string):string{try{return new URL(url).hostname;}catch{return url;}}
export const initials=(label:string):string=>label.split(/[ ._-]+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
const stateNames:Record<string,string>={BROWSING:'Browsing',CANDIDATE:'Inspecting chat controls',READY:'Ready',ACTIVE:'Generating',IDLE:'Idle',EXPIRED:'Ended',RESTORING:'Restoring',PROVIDER_LOST:'Reconnect',RATE_LIMITED:'Rate limited',BROKEN_MAPPING:'Needs repair',UNCONFIGURED:'Closed',LOADING:'Opening',LOGIN_REQUIRED:'Sign in',DISCOVERING:'Discovering',REDISCOVERING:'Rescanning'};
export const stateText=(state:string):string=>stateNames[state]??state.replaceAll('_',' ').toLowerCase();
export const providerText=(p:Provider):string=>p.state==='UNCONFIGURED'&&p.open_tab?'Sleeping':stateText(p.state);
export function dateTime(epoch:number):string{return epoch?new Date(epoch*1000).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Not recorded';}
export function modelReady(model:Model,provider:Provider):boolean {
  return provider.detected&&!provider.dismissed&&provider.exposed&&provider.state==='READY'&&model.enabled&&model.available;
}
export function modelStatus(model:Model,provider:Provider):string {
  if(!provider.exposed||provider.dismissed)return 'Provider disabled';
  if(!model.enabled)return 'Disabled';
  if(provider.state!=='READY')return providerText(provider);
  if(!model.available)return 'Not currently available';
  return 'Ready';
}
export function errorText(value:string):string {
  const code=value.replace(/^Error: /,'');
  const known:Record<string,string>={
    EMPTY_ADDRESS:'Enter a website address or search term.',
    UNSAFE_ADDRESS:'Only HTTP and HTTPS website addresses can be opened.',
    ADDRESS_HAS_CREDENTIALS:'Remove the username or password from this address. Sign in on the website instead.',
    INVALID_PROVIDER_URL:'Enter a valid website address. Credentials and sign-in callback links cannot be opened here.',
    INTERNAL_PAGE_NOT_FOUND:'That Codemax page does not exist. Open the Codemax menu to choose a page.',
    NATIVE_HOST_REQUIRED:'Open the desktop application to connect the browser and Zag gateway.',
    BACKEND_UNAVAILABLE:'The local gateway is disconnected. Your last known state is still shown; reconnect to make changes.',
    FALLBACK_MODE:'Browsing-only mode: the Zag sidecar is unavailable on this platform, so there is no local client gateway. Websites stay usable and observed models are listed but unverified. Use Linux x86_64 for the full backend.',
    RESTART_BUDGET_EXHAUSTED:'The backend restarted repeatedly. Codemax kept browsing available and keeps retrying automatically; open Runtime settings for details.',
    SIDECAR_MISSING:'The Zag backend binary is missing. Browsing stays available in fallback mode while Codemax keeps retrying.',
    SIDECAR_SPAWN_FAILED:'The Zag backend could not start. Browsing stays available in fallback mode while Codemax keeps retrying.',
    SIDECAR_PIPE_FAILED:'The Zag backend pipe failed. Browsing stays available in fallback mode while Codemax keeps retrying.',
    BACKEND_EOF:'The backend exited unexpectedly. Codemax kept browsing available and keeps retrying automatically.',
    BACKEND_EXITED:'The backend exited unexpectedly. Codemax kept browsing available and keeps retrying automatically.',
    POPUP_PERMISSION_REQUIRED:'The website tried to open a popup, which sign-in and sign-up buttons often need. Allow one window, then try its button again.',
    DOWNLOAD_PERMISSION_REQUIRED:'The website requested a download. Allow one download, then retry on the website.',
    MAPPING_BROKEN:'A website control changed. Rescan the page or repair its mapping.',
    PROVIDER_BUSY:'This website is generating a response. Stop it before making this change.',
    PORT_UNAVAILABLE:'That port is already in use. Choose another in Local gateway settings.',
    LOOPBACK_BIND_FAILED:'The local port could not be opened. Choose another port or stop the other application using it.',
    INVALID_PORT:'Use a whole-number port between 1024 and 65535.',
    PROVIDER_ALREADY_EXISTS:'This website already has a profile in the workspace.',
    SESSION_NOT_RESTORABLE:'This conversation cannot be restored. Open the website and begin a new session.',
    INVALID_SESSION_TITLE:'Enter a conversation name before saving.',
    MODEL_UNAVAILABLE:'That model is no longer available. Reopen the website or select another exposed model.',
    MODEL_LOCKED:'This conversation’s model is locked by the website after the first message. Start a new chat to choose another model.',
    REASONING_LOCKED:'This conversation’s reasoning setting is locked by the website after the first message. Start a new chat to change it.',
    MCP_PERMISSION_STALE:'This tool call has changed. Review the current call before approving it.',
    CLIPBOARD_UNAVAILABLE:'Clipboard access is unavailable. Select and copy the visible text manually.',
    DEVELOPER_MODE_REQUIRED:'Enable developer diagnostics in Settings before opening the page inspector.',
    GATEWAY_HEALTH_FAILED:'The local gateway did not pass its health check. Start or restart it before connecting a client.'
  };
  if(known[code])return known[code];
  // Preserve human messages, URLs and case. Machine codes still have readable labels.
  return /^[A-Z][A-Z0-9_]+$/.test(code)?code[0]+code.slice(1).toLowerCase().replaceAll('_',' '):code;
}
export function recoveryAction(value:string):'runtime'|'gateway'|'popup'|'download'|'mapping'|null {
  const code=value.replace(/^Error: /,'');
  if(['NATIVE_HOST_REQUIRED','BACKEND_UNAVAILABLE'].includes(code))return 'runtime';
  if(['LOOPBACK_BIND_FAILED','PORT_UNAVAILABLE','INVALID_PORT','GATEWAY_HEALTH_FAILED'].includes(code))return 'gateway';
  if(code==='POPUP_PERMISSION_REQUIRED')return 'popup';
  if(code==='DOWNLOAD_PERMISSION_REQUIRED')return 'download';
  if(code==='MAPPING_BROKEN')return 'mapping';return null;
}
