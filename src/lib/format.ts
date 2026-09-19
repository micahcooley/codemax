import type {Provider} from './types/bridge';
export const number=(n:number|undefined):string=>(n??0).toLocaleString('en-US');
export const short=(n:number):string=>n>=1000000?`${(n/1000000).toFixed(1)}m`:n>=1000?`${(n/1000).toFixed(1)}k`:`${n}`;
export function hostname(url:string):string{try{return new URL(url).hostname;}catch{return url;}}
export const initials=(label:string):string=>label.split(/[ ._-]+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
const stateNames:Record<string,string>={BROWSING:'Browsing',CANDIDATE:'Inspecting chat controls',READY:'Ready',ACTIVE:'Generating',IDLE:'Idle',EXPIRED:'Ended',RESTORING:'Restoring',PROVIDER_LOST:'Reconnect',RATE_LIMITED:'Rate limited',BROKEN_MAPPING:'Needs repair',UNCONFIGURED:'Closed',LOADING:'Opening',LOGIN_REQUIRED:'Sign in',DISCOVERING:'Discovering',REDISCOVERING:'Rescanning'};
export const stateText=(state:string):string=>stateNames[state]??state.replaceAll('_',' ').toLowerCase();
export const providerText=(p:Provider):string=>p.state==='UNCONFIGURED'&&p.open_tab?'Sleeping':stateText(p.state);
export function dateTime(epoch:number):string{return epoch?new Date(epoch*1000).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Not recorded';}
export function errorText(code:string):string{
  const known:Record<string,string>={NATIVE_HOST_REQUIRED:'Open the desktop application to connect the browser and Zag gateway.',BACKEND_UNAVAILABLE:'The Zag gateway is not connected. Restart it from Settings.',POPUP_PERMISSION_REQUIRED:'This website tried to open a popup. Allow a sign-in window in Browser controls, then try again.',DOWNLOAD_PERMISSION_REQUIRED:'This website tried to download a file. Allow one download in Browser controls, then retry.',MAPPING_BROKEN:'A website control changed. Rescan the page or record a new mapping.',PROVIDER_BUSY:'This website is generating a response. Stop it before making this change.',PORT_UNAVAILABLE:'That port is already in use. Choose a different port.',PROVIDER_ALREADY_EXISTS:'This website already has a profile in the workspace.',SESSION_NOT_RESTORABLE:'This conversation cannot be restored. Open the provider and begin a new session.',DEVELOPER_MODE_REQUIRED:'Enable developer diagnostics in Settings before opening the page inspector.'};
  return known[code]??code.replace(/^Error: /,'').replaceAll('_',' ').toLowerCase();
}
