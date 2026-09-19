export function isTauri() { return typeof window !== 'undefined' && typeof window.__TAURI_INTERNALS__?.invoke === 'function'; }
export function invoke(command, args = {}) {
    if (!isTauri())
        return Promise.reject(new Error('NATIVE_HOST_REQUIRED'));
    return window.__TAURI_INTERNALS__.invoke(command, args);
}
export async function listen(event, handler) {
    const runtime = window.__TAURI_INTERNALS__;
    if (!runtime)
        throw new Error('NATIVE_HOST_REQUIRED');
    const callback = runtime.transformCallback(value => handler(value));
    let id;
    try {
        id = await invoke('plugin:event|listen', { event, target: { kind: 'Webview', label: 'main' }, handler: callback });
    }
    catch (error) {
        runtime.unregisterCallback(callback);
        throw error;
    }
    let live = true;
    return () => {
        if (!live)
            return;
        live = false;
        window.__TAURI_EVENT_PLUGIN_INTERNALS__?.unregisterListener(event, id);
        runtime.unregisterCallback(callback);
        void invoke('plugin:event|unlisten', { event, eventId: id }).catch(() => { });
    };
}
