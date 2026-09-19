/* Browser boundary only: observations and validated DOM operations.
   No provider registry, routing, protocol translation, credential storage,
   model-name database, or learned detector lives in this file. */
(() => {
  'use strict';
  const supplied = globalThis.__BRIDGE_BOOT__ || {};
  const config = Object.freeze({origin: supplied.origin, testOnly: supplied.testOnly === true});
  const encoder = new TextEncoder();
  const sensitive = /password|passcode|credit.?card|card.?number|security.?code|verification.?code|one.?time|billing|payment|delete.?account|sign.?out|log.?out|oauth|secret/i;
  const redact = value => String(value ?? '')
    .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g, '[redacted]')
    .slice(0, 240);
  function safeURL(value, base) {
    try {
      const url = new URL(value, base);
      if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) return null;
      const path = url.pathname.split('/').filter(Boolean).slice(0, 4)
        .map(part => /^(?:api|v\d+|chat|messages|completions|conversation|conversations|stream|models|generate|auth|login|session)$/.test(part) ? part : ':segment').join('/');
      return url.origin + '/' + path;
    } catch { return null; }
  }
  function shape(body) {
    if (typeof body !== 'string' || body.length > 16384) return {kind: typeof body};
    try {
      const value = JSON.parse(body);
      if (!value || typeof value !== 'object') return {kind: typeof value};
      const allowed = new Set(['model', 'messages', 'stream', 'temperature', 'max_tokens', 'reasoning', 'tools']);
      return {kind: Array.isArray(value) ? 'array' : 'object', fields: Object.keys(value).length,
        known_fields: Object.keys(value).filter(k => allowed.has(k)).slice(0, 16)};
    } catch { return {kind: 'opaque'}; }
  }
  function splitText(text, limit = 3072) {
    if (!Number.isInteger(limit) || limit < 4) throw new Error('Invalid chunk limit');
    const result = []; let chunk = ''; let size = 0;
    for (const char of text) {
      const n = encoder.encode(char).length;
      if (size + n > limit) { result.push(chunk); chunk = ''; size = 0; }
      chunk += char; size += n;
    }
    if (chunk) result.push(chunk);
    return result;
  }
  function appendDelta(previous, next) {
    if (!next.startsWith(previous)) throw new Error('RESPONSE_REWRITTEN');
    return next.slice(previous.length);
  }
  if (config.testOnly) {
    Object.defineProperty(globalThis, '__BRIDGE_TEST_API__', {value: Object.freeze({safeURL, shape, splitText, redact, appendDelta})});
    return;
  }
  if (!config.origin || location.origin !== config.origin || window.top !== window) return;
  if (globalThis.__BRIDGE_AGENT_ACTIVE__) return;
  Object.defineProperty(globalThis, '__BRIDGE_AGENT_ACTIVE__', {value: true});
  const documentId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() :
    Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  const ids = new WeakMap(); const nodes = new Map(); let nextId = 1;
  let generation = null; let observationTimer = 0; let responseTimer = 0;
  let lastSnapshot = ''; let stopped = false; let sending = false;
  const queue = []; const MAX_QUEUE = 128;
  const transport = event => {
    // This is the sole command permitted to remote provider webviews. The Rust
    // host derives provider identity from the invoking webview, never this data.
    if (!globalThis.__TAURI_INTERNALS__?.invoke) return Promise.reject(new Error('TRANSPORT_UNAVAILABLE'));
    return globalThis.__TAURI_INTERNALS__.invoke('provider_observe', {event});
  };
  async function flush() {
    if (sending || stopped) return;
    sending = true;
    try { while (queue.length && !stopped) await transport(queue.shift()); }
    catch { stopped = true; stopGeneration('TRANSPORT_LOST', false); }
    finally { sending = false; }
  }
  function emit(event) {
    if (stopped || location.origin !== config.origin) return;
    const full = {v: 1, document_id: documentId, ...event};
    if (encoder.encode(JSON.stringify(full)).length > 32768 || queue.length >= MAX_QUEUE) {
      // Never silently lose generation bytes: stop instead of completing a
      // corrupted stream. No raw website payload is included in diagnostics.
      stopGeneration('OBSERVATION_BACKPRESSURE', false); stopped = true; return;
    }
    queue.push(full); void flush();
  }
  function visible(node) {
    if (!(node instanceof Element) || !node.isConnected || node.closest('[hidden],[aria-hidden="true"],[inert]')) return false;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  }
  function id(node) {
    if (!ids.has(node)) ids.set(node, nextId++);
    const value = ids.get(node); nodes.set(value, node); return value;
  }
  function editable(node) { return node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement || node.isContentEditable; }
  function label(node) {
    const by = node.getAttribute('aria-labelledby');
    const related = by ? by.split(/\s+/).slice(0, 3).map(k => document.getElementById(k)?.textContent || '').join(' ') : '';
    const formLabel = node.labels ? Array.from(node.labels).slice(0, 2).map(x => x.textContent).join(' ') : '';
    // Never read .value or editor text for evidence.
    return redact(node.getAttribute('aria-label') || related || formLabel || node.getAttribute('placeholder') ||
      node.getAttribute('title') || (!editable(node) && ['BUTTON', 'OPTION'].includes(node.tagName) ? node.textContent : '') || '');
  }
  function forbidden(node) {
    if (!(node instanceof Element)) return true;
    const inputType = (node.getAttribute('type') || '').toLowerCase();
    const auto = node.getAttribute('autocomplete') || '';
    if (['password', 'email', 'tel', 'file', 'hidden'].includes(inputType)) return true;
    if (/password|cc-|one-time|webauthn|email|tel/.test(auto)) return true;
    if (sensitive.test([label(node), node.getAttribute('name') || '', node.getAttribute('id') || ''].join(' '))) return true;
    const form = node.closest('form');
    return !!(form && form.querySelector('input[type="password"],input[autocomplete^="cc-"],input[autocomplete="one-time-code"]'));
  }
  function summary(node) {
    const isVisible = visible(node);
    if (forbidden(node) || (!isVisible && !(node instanceof HTMLButtonElement && node.hasAttribute('aria-label')))) return null;
    const options = node instanceof HTMLSelectElement ? Array.from(node.options).slice(0, 32).map(option => ({
      value: redact(option.value).slice(0, 180), label: redact(option.textContent), disabled: option.disabled, selected: option.selected
    })) : [];
    return {id: id(node), tag: node.tagName.toLowerCase(), role: node.getAttribute('role') || '', label: label(node),
      visible: isVisible, editable: editable(node), disabled: !!node.disabled || node.getAttribute('aria-disabled') === 'true',
      live: node.getAttribute('aria-live') || '', busy: node.getAttribute('aria-busy') === 'true',
      assistant: node.matches('[data-message-author-role="assistant"],[data-role="assistant"],[data-bridge-assistant]'), options};
  }
  function snapshot() {
    if (stopped || location.origin !== config.origin) return;
    // Bound traversal work even on very large pages. Skip page text and input values.
    const candidates = document.querySelectorAll('textarea,input,[contenteditable="true"],button,select,[role="button"],[role="combobox"],[role="option"],[role="log"],[aria-live],[data-message-author-role="assistant"],[data-role="assistant"],[data-bridge-assistant]');
    const controls = []; let examined = 0;
    for (const node of candidates) {
      if (++examined > 512 || controls.length >= 128) break;
      const item = summary(node); if (item) controls.push(item);
    }
    // Stale node references are pruned; IDs are never reassigned to other nodes.
    for (const [key, node] of nodes) if (!node.isConnected) nodes.delete(key);
    const event = {type: 'observation', origin: location.origin,
      controls, password_fields_present: Array.from(document.querySelectorAll('input[type="password"]')).some(visible)};
    // Chunk snapshots by dropping excess controls before their frame becomes too large.
    while (encoder.encode(JSON.stringify(event)).length > 28000 && event.controls.length) event.controls.pop();
    const digest = JSON.stringify(event);
    if (digest !== lastSnapshot) { lastSnapshot = digest; emit(event); }
    for (const node of document.querySelectorAll('[role="alert"],[role="status"]')) {
      if (!visible(node)) continue;
      const text = (node.textContent || '').slice(0, 1024);
      if (/rate.?limit|too many requests|daily limit|quota (?:exceeded|reached)|usage limit/i.test(text)) {
        emit({type: 'quota', state: 'RATE_LIMITED'}); stopGeneration('PROVIDER_RATE_LIMITED'); break;
      }
    }
  }
  function scheduleSnapshot() {
    if (!observationTimer) observationTimer = setTimeout(() => { observationTimer = 0; snapshot(); }, 180);
    if (generation && !responseTimer) responseTimer = setTimeout(() => { responseTimer = 0; readGeneration(); }, 25);
  }
  function target(nodeId, {allowDisabled = false} = {}) {
    if (!Number.isSafeInteger(nodeId) || nodeId <= 0) throw new Error('INVALID_NODE');
    const node = nodes.get(nodeId);
    if (!node || !visible(node) || forbidden(node)) throw new Error('MAPPING_BROKEN');
    if (!allowDisabled && (node.disabled || node.getAttribute('aria-disabled') === 'true')) throw new Error('CONTROL_DISABLED');
    return node;
  }
  function assistantNode(region) {
    if (region.matches('[data-message-author-role="assistant"],[data-role="assistant"],[data-bridge-assistant]')) return region;
    const matches = region.querySelectorAll('[data-message-author-role="assistant"],[data-role="assistant"],[data-bridge-assistant]');
    return matches[matches.length - 1] || null;
  }
  function stopGeneration(reason = 'CANCELLED', notify = true) {
    const g = generation; if (!g) return;
    generation = null; clearTimeout(g.timeout);
    try { const stop = nodes.get(g.stop); if (stop && visible(stop) && !forbidden(stop) && !stop.disabled) stop.click(); } catch { /* Boundary never escalates to keyboard or shell. */ }
    if (notify) emit({type: 'generation_error', request_id: g.request, code: reason});
  }
  function visibleFailure() {
    let inspected = 0;
    for (const node of document.querySelectorAll('[role="alert"],[role="status"]')) {
      if (++inspected > 16) break;
      if (!visible(node)) continue;
      const text = (node.textContent || '').slice(0, 1024);
      if (/rate.?limit|too many requests|daily limit|quota (?:exceeded|reached)/i.test(text)) return 'PROVIDER_RATE_LIMITED';
      if (/stream error|network error|connection lost|generation failed/i.test(text)) return 'PROVIDER_STREAM_ERROR';
      if (/sign in required|session expired|login required/i.test(text)) return 'AUTH_REQUIRED';
    }
    return null;
  }
  function readGeneration() {
    const g = generation; if (!g || !g.submitted) return;
    try {
      const failure = visibleFailure(); if (failure) throw new Error(failure);
      const region = target(g.response, {allowDisabled: true});
      const assistant = assistantNode(region);
      if (assistant && (assistant !== g.baselineNode || (assistant.textContent || '') !== g.baselineText)) {
        const next = assistant.textContent || '';
        if (encoder.encode(next).length > 262144) throw new Error('OUTPUT_LIMIT');
        const delta = appendDelta(g.text, next);
        for (const text of splitText(delta)) emit({type: 'generation_delta', request_id: g.request, text});
        g.text = next;
      }
      const stop = nodes.get(g.stop);
      const busy = region.getAttribute('aria-busy') === 'true' || !!(stop && visible(stop) && !stop.disabled && stop.getAttribute('aria-disabled') !== 'true');
      if (busy) g.sawBusy = true;
      if (g.sawBusy && !busy && g.text.length) {
        generation = null; clearTimeout(g.timeout);
        emit({type: 'generation_done', request_id: g.request, completion_source: 'observed_stop_or_busy_transition'});
      }
    } catch (error) { stopGeneration(error.message || 'BROWSER_ERROR'); }
  }
  const settle = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  async function execute(action) {
    if (!action || typeof action !== 'object' || action.document_id !== documentId || location.origin !== config.origin) throw new Error('STALE_DOCUMENT');
    if (action.type === 'scan') { lastSnapshot = ''; snapshot(); return; }
    if (action.type === 'stop') {
      if (generation?.request === action.request_id) {
        if (Number.isSafeInteger(action.stop_node) && action.stop_node > 0) generation.stop = action.stop_node;
        stopGeneration();
      } return;
    }
    if (action.type !== 'generate') throw new Error('ACTION_DENIED');
    if (generation) throw new Error('PROVIDER_BUSY');
    if (typeof action.prompt !== 'string' || encoder.encode(action.prompt).length > 131072) throw new Error('PROMPT_LIMIT');
    if (typeof action.request_id !== 'string' || !/^[A-Za-z0-9._-]{1,96}$/.test(action.request_id)) throw new Error('INVALID_REQUEST');
    if (action.new_chat) { target(action.new_chat).click(); await settle(); }
    if (action.model_control) {
      const selector = target(action.model_control);
      if (!(selector instanceof HTMLSelectElement)) throw new Error('MODEL_CONTROL_NEEDS_RECORDER');
      if (!Array.from(selector.options).some(o => o.value === action.model_value && !o.disabled)) throw new Error('MODEL_UNAVAILABLE');
      selector.value = action.model_value;
      selector.dispatchEvent(new Event('change', {bubbles: true})); await settle();
      if (selector.value !== action.model_value) throw new Error('MODEL_SELECTION_FAILED');
    }
    const input = target(action.prompt_node); target(action.send_node, {allowDisabled: true});
    if (!editable(input)) throw new Error('PROMPT_MAPPING_INVALID');
    const region = target(action.response_node, {allowDisabled: true});
    const baseline = assistantNode(region);
    generation = {request: action.request_id, response: action.response_node, stop: action.stop_node,
      baselineNode: baseline, baselineText: baseline?.textContent || '', text: '', sawBusy: false, submitted: false,
      timeout: setTimeout(() => stopGeneration('TIMEOUT'), 120000)};
    try {
      if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
        const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, action.prompt);
      } else input.textContent = action.prompt;
      input.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertText', data: action.prompt}));
      await settle();
      if (!generation || generation.request !== action.request_id) throw new Error('CANCELLED');
      generation.submitted = true;
      target(action.send_node).click();
      emit({type: 'action_result', request_id: action.request_id, status: 'submitted'});
      readGeneration();
    } catch (error) { stopGeneration(error.message || 'BROWSER_ERROR'); }
  }
  Object.defineProperty(globalThis, '__BRIDGE_EXECUTE__', {value: action => {
    void execute(action).catch(error => emit({type: 'generation_error', request_id: action?.request_id || '', code: error.message || 'ACTION_DENIED'}));
  }});
  Object.defineProperty(globalThis, '__BRIDGE_RESCAN__', {value: () => {
    if (location.origin !== config.origin) return;
    stopped = false; queue.length = 0; lastSnapshot = ''; snapshot();
  }});
  function network(event) {
    emit({type: 'network', ...event});
    if (event.status === 429 && generation && event.request_id === generation.request) { emit({type: 'quota', state: 'RATE_LIMITED'}); stopGeneration('PROVIDER_RATE_LIMITED'); }
    if (event.status === 401 && generation && event.request_id === generation.request) { emit({type: 'login_required'}); stopGeneration('AUTH_REQUIRED'); }
  }
  try {
    const original = window.fetch;
    window.fetch = async function(input, init) {
      const url = safeURL(input instanceof Request ? input.url : String(input), location.href);
      const start = performance.now(); const request_id = generation?.submitted ? generation.request : null;
      try {
        const response = await Reflect.apply(original, this, [input, init]);
        network({transport: 'fetch', request_id, method: String(init?.method || (input instanceof Request ? input.method : 'GET')).slice(0, 12),
          url_pattern: url, status: response.status, content_type: String(response.headers.get('Content-Type') || '').split(';')[0].slice(0, 80),
          duration_ms: Math.round(performance.now() - start), request_shape: shape(init?.body)});
        return response; // Never clone/read response bodies or headers containing credentials.
      } catch (error) { network({transport: 'fetch', url_pattern: url, failed: true}); throw error; }
    };
    const open = XMLHttpRequest.prototype.open; const send = XMLHttpRequest.prototype.send; const requests = new WeakMap();
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      requests.set(this, {transport: 'xhr', method: String(method).slice(0, 12), url_pattern: safeURL(url, location.href)});
      return Reflect.apply(open, this, [method, url, ...rest]);
    };
    XMLHttpRequest.prototype.send = function(...args) {
      const meta = requests.get(this);
      const request_id = generation?.submitted ? generation.request : null;
      if (meta) this.addEventListener('loadend', () => network({...meta, request_id, status: this.status}), {once: true});
      return Reflect.apply(send, this, args);
    };
    if (window.WebSocket) {
      const Original = window.WebSocket;
      window.WebSocket = class extends Original {
        constructor(...args) { super(...args); const url = safeURL(args[0], location.href);
          this.addEventListener('open', () => network({transport: 'websocket', phase: 'open', url_pattern: url}));
          this.addEventListener('close', e => network({transport: 'websocket', phase: 'close', url_pattern: url, code: e.code}));
        }
      };
    }
    if (window.EventSource) {
      const Original = window.EventSource;
      window.EventSource = class extends Original {
        constructor(...args) { super(...args); const url = safeURL(args[0], location.href);
          this.addEventListener('open', () => network({transport: 'eventsource', phase: 'open', url_pattern: url}));
          this.addEventListener('error', () => network({transport: 'eventsource', phase: 'error', url_pattern: url}));
        }
      };
    }
  } catch { emit({type: 'instrumentation_warning', code: 'NETWORK_HOOK_PARTIAL'}); }
  document.addEventListener('click', event => {
    const node = event.target instanceof Element ? event.target.closest('button,select,[role="button"],[role="option"],textarea,[contenteditable="true"]') : null;
    if (node && visible(node) && !forbidden(node)) emit({type: 'interaction', node: id(node), role: node.getAttribute('role') || node.tagName.toLowerCase(), label: label(node)});
  }, true);
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function(...args) { const result = Reflect.apply(original, this, args); scheduleSnapshot(); return result; };
  }
  window.addEventListener('popstate', scheduleSnapshot);
  window.addEventListener('pagehide', () => stopGeneration('NAVIGATED'));
  const observer = new MutationObserver(scheduleSnapshot);
  function start() {
    observer.observe(document.documentElement, {subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ['aria-busy', 'aria-disabled', 'aria-hidden', 'hidden', 'disabled', 'aria-label', 'role']});
    snapshot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true}); else start();
})();
