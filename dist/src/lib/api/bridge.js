import { invoke, isTauri, listen } from './native.js';
export const native = () => isTauri();
export const request = (op, params = {}) => invoke('bridge_request', { op, params });
export async function observe(events) {
    if (!native()) {
        events.host({ state: 'BROWSER_ONLY', code: 'NATIVE_HOST_REQUIRED' });
        return () => { };
    }
    const cleanup = [];
    try {
        cleanup.push(await listen('bridge:snapshot', ({ payload: data }) => {
            if (data?.protocol !== 1 || data?.backend !== 'zag' || !Array.isArray(data.providers) || !Array.isArray(data.sessions)) {
                events.error('INVALID_BACKEND_SNAPSHOT');
                return;
            }
            events.snapshot(data);
        }));
        cleanup.push(await listen('bridge:host', event => events.host(event.payload)));
        cleanup.push(await listen('bridge:browser-error', event => events.error(event.payload.code)));
        cleanup.push(await listen('bridge:notice', event => events.notice(event.payload.message)));
        cleanup.push(await listen('bridge:shortcut', event => events.shortcut(event.payload.key)));
        cleanup.push(await listen('bridge:browser', event => events.browser(event.payload.provider_id, event.payload.origin, event.payload.loading === true)));
        events.host(await invoke('host_status'));
        try {
            events.snapshot(await request('state.get'));
        }
        catch { /* Startup is driven by the subsequent push handshake, never by polling. */ }
    }
    catch (error) {
        cleanup.forEach(stop => stop());
        throw error;
    }
    return () => cleanup.forEach(stop => stop());
}
export function position(bounds) {
    return native() ? invoke('browser_bounds', { bounds }) : Promise.resolve();
}
export const hideProviders = () => position({ provider_id: null, x: 0, y: 86, width: 1, height: 1, visible: false });
export const browserControl = (providerId, action) => invoke('browser_control', { providerId, action });
export const find = (providerId, query, backwards = false) => invoke('browser_find', { providerId, query, backwards });
export const restart = () => invoke('backend_restart');
export const windowControl = (action) => invoke('window_control', { action });
export const probe = () => invoke('gateway_probe');
export const importDocument = () => invoke('document_import');
export const exportDocument = (name, data) => invoke('document_export', { name, content: JSON.stringify(data, null, 2) });
export async function copy(text) {
    if (!navigator.clipboard)
        throw new Error('CLIPBOARD_UNAVAILABLE');
    await navigator.clipboard.writeText(text);
}
export const chooseDirectory = () => invoke('directory_pick');
