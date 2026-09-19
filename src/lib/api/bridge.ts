import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { HostStatus, Snapshot } from '../types/bridge';
export const native = (): boolean => isTauri();
export async function request<T>(op: string, params: Record<string, unknown> = {}): Promise<T> {
  if (!native()) throw new Error('NATIVE_HOST_REQUIRED');
  return invoke<T>('bridge_request', {op, params});
}
export async function observe(onSnapshot: (state: Snapshot) => void, onHost: (state: HostStatus) => void, onError: (error: string) => void): Promise<UnlistenFn> {
  if (!native()) { onHost({state:'BROWSER_ONLY',code:'Open the Tauri application to connect to Zag. No simulated backend is running.'}); return () => {}; }
  const listeners: UnlistenFn[] = [];
  try {
    listeners.push(await listen<Snapshot>('bridge:snapshot', event => {
      const data = event.payload;
      if (data?.protocol !== 1 || data?.backend !== 'zag' || !Array.isArray(data.providers) || !Array.isArray(data.sessions)) { onError('INVALID_BACKEND_SNAPSHOT'); return; }
      onSnapshot(data);
    }));
    listeners.push(await listen<HostStatus>('bridge:host', event => onHost(event.payload)));
    listeners.push(await listen<{code: string}>('bridge:browser-error', event => onError(event.payload.code)));
    onHost(await invoke<HostStatus>('host_status'));
    try { onSnapshot(await request<Snapshot>('state.get')); } catch { /* Starting/failed status is already visible; later snapshots are push events. */ }
  } catch (error) { listeners.forEach(stop => stop()); throw error; }
  return () => listeners.forEach(stop => stop());
}
export async function position(bounds: {provider_id: number|null; x:number; y:number; width:number; height:number; visible:boolean}): Promise<void> {
  if (!native()) return;
  await invoke('browser_bounds', {bounds});
}
export const hideProviders = (): Promise<void> => position({provider_id:null,x:80,y:100,width:1,height:1,visible:false});
export async function browserControl(provider_id: number, action: 'back'|'forward'|'reload'): Promise<void> {
  if (!native()) throw new Error('NATIVE_HOST_REQUIRED');
  await invoke('browser_control', {providerId:provider_id,action});
}
export async function restart(): Promise<void> {
  if (!native()) throw new Error('NATIVE_HOST_REQUIRED');
  await invoke('backend_restart');
}
export async function copy(text: string): Promise<void> {
  if (!navigator.clipboard) throw new Error('Clipboard is unavailable. Select and copy the displayed text manually.');
  await navigator.clipboard.writeText(text);
}
