/** Minimal Tauri 2.11 transport adapter. No domain or provider logic.
 * Invoke/callback/event protocol checked against tauri-v2.11.5 packages/api/src.
 * Equivalent MIT/Apache-2.0 event transport attribution is in NOTICE.md.
 */
interface NativeRuntime {
  invoke<T>(command:string,args?:Record<string,unknown>):Promise<T>;
  transformCallback(callback:(event:unknown)=>void,once?:boolean):number;
  unregisterCallback(id:number):void;
}
declare global {
  interface Window {
    __TAURI_INTERNALS__?:NativeRuntime;
    __TAURI_EVENT_PLUGIN_INTERNALS__?:{unregisterListener(event:string,id:number):void};
  }
}
export type UnlistenFn=()=>void;
export function isTauri():boolean{return typeof window!=='undefined'&&typeof window.__TAURI_INTERNALS__?.invoke==='function';}
export function invoke<T>(command:string,args:Record<string,unknown>={}):Promise<T>{
  if(!isTauri()) return Promise.reject(new Error('NATIVE_HOST_REQUIRED'));
  return window.__TAURI_INTERNALS__!.invoke<T>(command,args);
}
export async function listen<T>(event:string,handler:(event:{payload:T})=>void):Promise<UnlistenFn>{
  const runtime=window.__TAURI_INTERNALS__;
  if(!runtime) throw new Error('NATIVE_HOST_REQUIRED');
  const callback=runtime.transformCallback(value=>handler(value as {payload:T}));
  let id:number;
  try{id=await invoke<number>('plugin:event|listen',{event,target:{kind:'Webview',label:'main'},handler:callback});}
  catch(error){runtime.unregisterCallback(callback);throw error;}
  let live=true;
  return ()=>{
    if(!live)return;live=false;
    window.__TAURI_EVENT_PLUGIN_INTERNALS__?.unregisterListener(event,id);
    runtime.unregisterCallback(callback);
    void invoke('plugin:event|unlisten',{event,eventId:id}).catch(()=>{});
  };
}
