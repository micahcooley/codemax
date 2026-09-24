import {invoke,isTauri,listen,type UnlistenFn} from './native';
import type {HostStatus,Snapshot} from '../types/bridge';
export const native=():boolean=>isTauri();
export const request=<T>(op:string,params:Record<string,unknown>={}):Promise<T>=>invoke<T>('bridge_request',{op,params});
export type BrowserShortcut='address'|'commands'|'close-tab'|'reopen-tab'|'new-tab'|'next-tab'|'prev-tab'|`tab-${1|2|3|4|5|6|7|8|9}`;
export interface Events {
  snapshot(state:Snapshot):void;host(state:HostStatus):void;error(error:string,providerId?:number):void;
  notice(message:string):void;shortcut(key:BrowserShortcut):void;browser(id:number,origin:string,loading:boolean):void;
}
export async function observe(events:Events):Promise<UnlistenFn>{
  if(!native()){events.host({state:'BROWSER_ONLY',code:'NATIVE_HOST_REQUIRED'});return ()=>{};}
  const cleanup:UnlistenFn[]=[];
  try{
    cleanup.push(await listen<Snapshot>('bridge:snapshot',({payload:data})=>{
      if(data?.protocol!==1||data?.backend!=='zag'||!Array.isArray(data.providers)||!Array.isArray(data.sessions)){events.error('INVALID_BACKEND_SNAPSHOT');return;}
      events.snapshot(data);
    }));
    cleanup.push(await listen<HostStatus>('bridge:host',event=>events.host(event.payload)));
    cleanup.push(await listen<{code:string;provider_id?:number}>('bridge:browser-error',event=>events.error(event.payload.code,event.payload.provider_id)));
    cleanup.push(await listen<{message:string}>('bridge:notice',event=>events.notice(event.payload.message)));
    cleanup.push(await listen<{key:BrowserShortcut}>('bridge:shortcut',event=>events.shortcut(event.payload.key)));
    cleanup.push(await listen<{provider_id:number;origin:string;loading?:boolean}>('bridge:browser',event=>events.browser(event.payload.provider_id,event.payload.origin,event.payload.loading===true)));
    events.host(await invoke<HostStatus>('host_status'));
    try{events.snapshot(await request<Snapshot>('state.get'));}catch{ /* Startup is driven by the subsequent push handshake, never by polling. */ }
  }catch(error){cleanup.forEach(stop=>stop());throw error;}
  return ()=>cleanup.forEach(stop=>stop());
}
export function position(bounds:{provider_id:number|null;x:number;y:number;width:number;height:number;visible:boolean}):Promise<void>{
  return native()?invoke('browser_bounds',{bounds}):Promise.resolve();
}
export const hideProviders=():Promise<void>=>position({provider_id:null,x:0,y:86,width:1,height:1,visible:false});
export type BrowserAction='back'|'forward'|'reload'|'external'|'inspect'|'popup_once'|'download_once'|'zoom_in'|'zoom_out'|'zoom_reset';
export const browserControl=(providerId:number,action:BrowserAction):Promise<void>=>invoke('browser_control',{providerId,action});
export const find=(providerId:number,query:string,backwards=false):Promise<void>=>invoke('browser_find',{providerId,query,backwards});
export const restart=():Promise<void>=>invoke('backend_restart');
export const windowControl=(action:string):Promise<{maximized:boolean}>=>invoke('window_control',{action});
export const probe=():Promise<{healthy:boolean;round_trip_ms:number}>=>invoke('gateway_probe');
export const importDocument=():Promise<Record<string,unknown>|null>=>invoke('document_import');
export const exportDocument=(name:string,data:unknown):Promise<boolean>=>invoke('document_export',{name,content:JSON.stringify(data,null,2)});
export async function copy(text:string):Promise<void>{
  if(!navigator.clipboard)throw new Error('CLIPBOARD_UNAVAILABLE');
  await navigator.clipboard.writeText(text);
}

export const chooseDirectory=():Promise<string|null>=>invoke('directory_pick');
