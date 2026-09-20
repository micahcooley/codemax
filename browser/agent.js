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

  // Explicit capability fields only. No message content, arbitrary payload keys,
  // request headers, storage, cookies, hidden inputs, or credentials are emitted.
  function metadata(value, source = 'OBSERVED_REQUEST') {
    if (typeof value === 'string') { if (value.length > 32768) return []; try { value = JSON.parse(value); } catch { return []; } }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    const safe = x => typeof x === 'string' && x.length > 0 && x.length <= 180 && !sensitive.test(x) && redact(x) === x;
    const entries = Array.isArray(value.models) ? value.models : Array.isArray(value.data) ? value.data : [value];
    const result = [];
    for (const item of entries.slice(0, 32)) {
      if (!item || typeof item !== 'object') continue;
      const model = typeof item.model === 'string' ? item.model : item.id;
      if (!safe(model)) continue;
      const n = item.context_window ?? item.context_length ?? item.max_context_tokens;
      const context_tokens = Number.isSafeInteger(n) && n >= 128 && n <= 10000000 ? n : null;
      const tokenizer = safe(item.tokenizer) ? item.tokenizer : null;
      const reasoning = safe(item.reasoning_effort) ? item.reasoning_effort : null;
      const selected = source === 'OBSERVED_REQUEST' && Array.isArray(item.messages);
      if (context_tokens || tokenizer || reasoning || selected) result.push({model, context_tokens, tokenizer, reasoning, selected, source});
    }
    return result;
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
    Object.defineProperty(globalThis, '__BRIDGE_TEST_API__', {value: Object.freeze({safeURL, shape, splitText, redact, appendDelta, metadata})});
    return;
  }
  if (!config.origin || location.origin !== config.origin || window.top !== window) return;
  if (globalThis.__BRIDGE_AGENT_ACTIVE__) return;
  Object.defineProperty(globalThis, '__BRIDGE_AGENT_ACTIVE__', {value: true});
  const documentId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() :
    Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  const ids = new WeakMap(); const nodes = new Map(); let nextId = 1;
  let generation = null; let preparingRequest = null; let observationTimer = 0; let responseTimer = 0;
  let picker = null; let lastMenuTrigger = null; let lastMenuAt = 0; let discoveryEnabled = true;
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
  function editable(node) { return node instanceof HTMLTextAreaElement || (node instanceof HTMLInputElement && ['text','search',''].includes(node.getAttribute('type') || '')) || node.isContentEditable; }
  function label(node) {
    const by = node.getAttribute('aria-labelledby');
    const related = by ? by.split(/\s+/).slice(0, 3).map(k => document.getElementById(k)?.textContent || '').join(' ') : '';
    const formLabel = node.labels ? Array.from(node.labels).slice(0, 2).map(x => x.textContent).join(' ') : '';
    // Never read .value or editor text for evidence.
    return redact(node.getAttribute('aria-label') || related || formLabel || node.getAttribute('placeholder') ||
      node.getAttribute('title') || (!editable(node) && (['BUTTON', 'OPTION'].includes(node.tagName) || ['option','menuitemradio','menuitem'].includes(node.getAttribute('role'))) ? node.textContent : '') || '');
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

  function menuOwner(node) {
    const menu = node.closest('[role="listbox"],[role="menu"]');
    if (!menu) return 0;
    for (const labelId of (menu.getAttribute('aria-labelledby') || '').split(/\s+/)) {
      const owner = document.getElementById(labelId); if (owner && visible(owner) && !forbidden(owner)) return id(owner);
    }
    if (menu.id) for (const button of document.querySelectorAll('[aria-controls]')) {
      if ((button.getAttribute('aria-controls') || '').split(/\s+/).includes(menu.id) && visible(button) && !forbidden(button)) return id(button);
    }
    const openMenus = Array.from(document.querySelectorAll('[role="listbox"],[role="menu"]')).filter(visible);
    return openMenus.length === 1 && lastMenuTrigger?.isConnected && visible(lastMenuTrigger) && Date.now() - lastMenuAt < 10000 ? id(lastMenuTrigger) : 0;
  }

  function summary(node) {
    const isVisible = visible(node);
    const fileInput = node instanceof HTMLInputElement && node.type === 'file';
    if ((!fileInput && forbidden(node)) || (!isVisible && !fileInput && !(node instanceof HTMLButtonElement && node.hasAttribute('aria-label')))) return null;
    const options = node instanceof HTMLSelectElement ? Array.from(node.options).slice(0, 32).map(option => ({
      value: redact(option.value).slice(0, 180), label: redact(option.textContent), disabled: option.disabled, selected: option.selected
    })) : [];
    return {id: id(node), tag: node.tagName.toLowerCase(), role: node.getAttribute('role') || '', label: label(node),
      visible: isVisible, editable: editable(node), disabled: !!node.disabled || node.getAttribute('aria-disabled') === 'true',
      live: node.getAttribute('aria-live') || '', busy: node.getAttribute('aria-busy') === 'true',
      current_value: node instanceof HTMLSelectElement ? redact(node.selectedOptions[0]?.value || '') : '',
      selected: node.matches('[aria-checked="true"],[aria-selected="true"],[aria-pressed="true"]'), menu_owner: menuOwner(node),
      value: ['option','menuitemradio','menuitem'].includes(node.getAttribute('role')) ? redact(node.getAttribute('data-value') || label(node)).slice(0,180) : '',
      popup: node.getAttribute('aria-haspopup') || '', file_input: fileInput,
      assistant: node.matches('[data-message-author-role="assistant"],[data-role="assistant"],[data-bridge-assistant]'), options};
  }
  function snapshot() {
    if (stopped || !discoveryEnabled || location.origin !== config.origin) return;
    // Bound traversal work even on very large pages. Skip page text and input values.
    const candidates = document.querySelectorAll('textarea,input,[contenteditable]:not([contenteditable="false"]),button,select,[role="button"],[role="combobox"],[role="option"],[role="menuitemradio"],[role="menuitem"],[role="switch"],main,[role="main"],[role="log"],[aria-live],[data-message-author-role="assistant"],[data-role="assistant"],[data-bridge-assistant]');
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
  const assistantSelector = '[data-message-author-role="assistant"],[data-role="assistant"],[data-bridge-assistant],.assistant-message,[data-testid="assistant-message"]';
  function assistantNode(region) {
    if (region.matches(assistantSelector)) return region;
    const matches = region.querySelectorAll(assistantSelector);
    return matches[matches.length - 1] || null;
  }
  function responseText(node) {
    // innerText preserves rendered code-block line breaks. Never flatten code
    // to textContent merely to make a stream appear append-only.
    return node instanceof HTMLElement ? node.innerText : (node.textContent || '');
  }
  function resolve(action, key, nodeId, options = {}) {
    try { return target(nodeId, options); }
    catch (error) {
      if (error.message !== 'MAPPING_BROKEN') throw error;
      const binding = action.bindings?.[key];
      if (!binding || typeof binding.label !== 'string') throw error;
      const matches = [];
      for (const node of Array.from(document.querySelectorAll('textarea,input,button,select,[contenteditable],main,[role],[aria-live]')).slice(0,512)) {
        if (visible(node) && !forbidden(node) && node.tagName.toLowerCase() === binding.tag &&
            (node.getAttribute('role') || '') === binding.role && label(node) === binding.label) matches.push(node);
      }
      if (matches.length !== 1) throw new Error('MAPPING_BROKEN');
      id(matches[0]); return matches[0];
    }
  }
  function findStop(nodeId) {
    const mapped = nodes.get(nodeId);
    if (mapped && visible(mapped) && !forbidden(mapped) && !mapped.disabled) return mapped;
    const matches = Array.from(document.querySelectorAll('button,[role="button"]')).slice(0,256)
      .filter(node => visible(node) && !forbidden(node) && !node.disabled && /^(stop|stop generating|stop response|cancel generation)$/i.test(label(node).trim()));
    return matches.length === 1 ? matches[0] : null;
  }
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function choose(action, key, nodeId, value, displayName = value) {
    const selector = resolve(action, key, nodeId);
    if (selector instanceof HTMLSelectElement) {
      const choices = Array.from(selector.options).filter(o => !o.disabled && (o.value === value || o.textContent?.trim() === displayName));
      if (choices.length !== 1) throw new Error(key === 'model' ? 'MODEL_UNAVAILABLE' : 'REASONING_UNAVAILABLE');
      selector.value = choices[0].value;
      selector.dispatchEvent(new Event('input', {bubbles:true})); selector.dispatchEvent(new Event('change', {bubbles:true}));
      await settle();
      if (selector.value !== choices[0].value) throw new Error('SELECTION_FAILED');
      return;
    }
    if (key === 'reasoning' && ['switch','checkbox'].includes(selector.getAttribute('role'))) {
      if (!['on','off','enabled','disabled','true','false','thinking','normal'].includes(value)) throw new Error('REASONING_UNAVAILABLE');
      const wanted = ['on','enabled','true','thinking'].includes(value);
      if ((selector.getAttribute('aria-checked') === 'true') !== wanted) selector.click();
      await settle(); if ((selector.getAttribute('aria-checked') === 'true') !== wanted) throw new Error('SELECTION_FAILED'); return;
    }
    if (!(selector instanceof HTMLButtonElement) && !['button','combobox'].includes(selector.getAttribute('role'))) throw new Error('CONTROL_TYPE_UNSUPPORTED');
    // The current value can be its button's label. No model-name heuristics.
    if (label(selector).trim() === displayName.trim()) return;
    selector.click();
    for (let attempt=0; attempt<30; attempt++) {
      await pause(50);
      const candidates = Array.from(document.querySelectorAll('[role="option"],[role="menuitemradio"],[role="menuitem"],button[data-value]')).slice(0,256)
        .filter(node => visible(node) && !forbidden(node) && !node.disabled && node.getAttribute('aria-disabled') !== 'true')
        .filter(node => (node.getAttribute('data-value') || '') === value || label(node).trim() === displayName.trim() || label(node).trim() === value.trim());
      if (candidates.length > 1) throw new Error('AMBIGUOUS_SELECTION');
      if (candidates.length === 1) { candidates[0].click(); await settle(); return; }
    }
    throw new Error(key === 'model' ? 'MODEL_UNAVAILABLE' : 'REASONING_UNAVAILABLE');
  }
  function endPicker() {
    if (!picker) return;
    document.removeEventListener('pointermove', picker.move, true);
    document.removeEventListener('click', picker.click, true);
    document.removeEventListener('keydown', picker.key, true);
    picker.host.remove(); picker = null;
  }
  function beginPicker(mapping) {
    if (!['prompt','send','response','stop','new_chat','model','reasoning','attachment'].includes(mapping) || generation) throw new Error('PICKER_DENIED');
    endPicker(); const host = document.createElement('div');
    host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    const shadow = host.attachShadow({mode:'closed'});
    shadow.innerHTML = '<style>:host{all:initial} .hint{position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#20241f;color:#eef0eb;border:1px solid #697568;border-radius:8px;padding:12px 18px;font:13px system-ui;box-shadow:0 6px 28px #0005} .outline{position:fixed;border:2px solid #7db58b;background:#7db58b19;border-radius:4px;box-sizing:border-box}</style><div class="outline"></div><div class="hint"></div>';
    shadow.querySelector('.hint').textContent = 'Select the '+mapping.replaceAll('_',' ')+' control · Esc to cancel';
    const outline = shadow.querySelector('.outline'); let selected = null;
    const allowed = node => {
      if (!(node instanceof Element) || !visible(node)) return false;
      if (mapping === 'attachment') return node instanceof HTMLInputElement && node.type === 'file' && !sensitive.test(label(node));
      if (forbidden(node)) return false;
      if (mapping === 'prompt') return editable(node);
      if (mapping === 'response') return node.matches('main,[role="main"],[role="log"],'+assistantSelector);
      if (mapping === 'model' || mapping === 'reasoning') return node.matches('select,button,[role="button"],[role="combobox"],[role="switch"]');
      return node.matches('button,[role="button"]');
    };
    const move = event => {
      let node = event.target instanceof Element ? event.target : null;
      selected = null;
      for (let depth=0; node && depth<8; depth++,node=node.parentElement) { if (allowed(node)) {selected=node;break;} }
      if (!selected) {outline.style.display='none';return;}
      const rect=selected.getBoundingClientRect(); outline.style.cssText=`display:block;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
    };
    const click = event => {
      if (!selected) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const node = selected; endPicker(); lastSnapshot=''; snapshot();
      emit({type:'picked',mapping,node:id(node)});
    };
    const key = event => { if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();endPicker();} };
    picker={host,move,click,key}; document.documentElement.append(host);
    document.addEventListener('pointermove',move,true);document.addEventListener('click',click,true);document.addEventListener('keydown',key,true);
  }
  function stopGeneration(reason = 'CANCELLED', notify = true) {
    const g = generation; if (!g) return;
    generation = null; clearTimeout(g.timeout); clearTimeout(g.hardTimeout);
    try { const stop = findStop(g.stop); if (stop) stop.click(); } catch { /* Boundary never escalates to keyboard or shell. */ }
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
      const region = resolve(g.action, 'response', g.response, {allowDisabled:true}); g.response = id(region);
      const assistant = assistantNode(region);
      if (assistant && (assistant !== g.baselineNode || responseText(assistant) !== g.baselineText)) {
        const next = responseText(assistant);
        if (encoder.encode(next).length > 262144) throw new Error('OUTPUT_LIMIT');
        const delta = appendDelta(g.text, next);
        for (const text of splitText(delta)) emit({type: 'generation_delta', request_id: g.request, text});
        if (delta.length) { clearTimeout(g.timeout); g.timeout=setTimeout(() => stopGeneration('TIMEOUT'), 600000); }
        g.text = next;
      }
      const stop = findStop(g.stop);
      const busy = region.getAttribute('aria-busy') === 'true' || !!(stop && visible(stop) && !stop.disabled && stop.getAttribute('aria-disabled') !== 'true');
      if (busy) g.sawBusy = true;
      if (g.sawBusy && !busy && g.text.length) {
        generation = null; clearTimeout(g.timeout); clearTimeout(g.hardTimeout);
        emit({type: 'generation_done', request_id: g.request, completion_source: 'observed_stop_or_busy_transition'});
      }
    } catch (error) { stopGeneration(error.message || 'BROWSER_ERROR'); }
  }
  const settle = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  async function attach(action) {
    const files = action.attachments || [];
    if (!Array.isArray(files) || files.length > 4) throw new Error('ATTACHMENT_LIMIT');
    if (!files.length) return;
    const input = nodes.get(action.attachment_node);
    if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.isConnected || input.disabled ||
        input.closest('form')?.querySelector('input[type="password"],input[autocomplete^="cc-"]') ||
        sensitive.test([label(input),input.name,input.id].join(' '))) throw new Error('ATTACHMENT_CONTROL_REQUIRED');
    if (input.files?.length) throw new Error('EXISTING_ATTACHMENTS_REQUIRE_USER_ACTION');
    if (!input.multiple && files.length > 1) throw new Error('ATTACHMENT_COUNT_UNSUPPORTED');
    const transfer = new DataTransfer(); let total = 0;
    for (const item of files) {
      if (!item || !['image/png','image/jpeg','image/webp','image/gif','application/pdf','text/plain'].includes(item.mime) ||
          typeof item.name !== 'string' || !/^[a-zA-Z0-9_.-]{1,96}$/.test(item.name) ||
          typeof item.data !== 'string' || item.data.length < 4 || item.data.length > 131072 || item.data.length % 4 ||
          !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(item.data)) throw new Error('INVALID_ATTACHMENT');
      total += item.data.length; if (total > 190000) throw new Error('ATTACHMENT_LIMIT');
      const accept = input.accept.toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
      if (accept.length && !accept.some(value=>value === item.mime || (value.endsWith('/*') && item.mime.startsWith(value.slice(0,-1))) || (value.startsWith('.') && item.name.endsWith(value)))) throw new Error('ATTACHMENT_TYPE_UNSUPPORTED');
      const binary = atob(item.data); if (btoa(binary) !== item.data) throw new Error('INVALID_ATTACHMENT'); const data = Uint8Array.from(binary,c=>c.charCodeAt(0));
      transfer.items.add(new File([data],item.name,{type:item.mime}));
    }
    input.files = transfer.files;
    if (input.files.length !== files.length) throw new Error('ATTACHMENT_REJECTED');
    input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));await settle();
  }
  async function execute(action) {
    if (!action || typeof action !== 'object' || action.document_id !== documentId || location.origin !== config.origin) throw new Error('STALE_DOCUMENT');
    if (action.type === 'discovery_policy') { discoveryEnabled = action.enabled === true; if (discoveryEnabled) {lastSnapshot='';snapshot();} return; }
    if (action.type === 'scan') { lastSnapshot = ''; snapshot(); return; }
    if (action.type === 'stop') {
      if (preparingRequest?.request === action.request_id) preparingRequest.cancelled = true;
      if (generation?.request === action.request_id) {
        if (Number.isSafeInteger(action.stop_node) && action.stop_node > 0) generation.stop = action.stop_node;
        stopGeneration();
      } return;
    }
    if (action.type === 'pick') { beginPicker(action.mapping); return; }
    if (action.type === 'new_chat') {
      if (generation || preparingRequest) throw new Error('PROVIDER_BUSY');
      target(action.node).click(); await settle(); await pause(200);
      emit({type:'action_result',request_id:action.request_id,status:'new_chat_opened'});
      lastSnapshot=''; snapshot(); return;
    }
    if (action.type !== 'generate') throw new Error('ACTION_DENIED');
    endPicker();
    if (generation || preparingRequest) throw new Error('PROVIDER_BUSY');
    if (typeof action.prompt !== 'string' || encoder.encode(action.prompt).length > 131072) throw new Error('PROMPT_LIMIT');
    if (typeof action.request_id !== 'string' || !/^[A-Za-z0-9._-]{1,96}$/.test(action.request_id)) throw new Error('INVALID_REQUEST');
    const originalInput = resolve(action,'prompt',action.prompt_node);
    const draft = el => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value : el.textContent || '';
    if (draft(originalInput).trim()) throw new Error('UNSENT_DRAFT');
    const preparing = {request:action.request_id,cancelled:false}; preparingRequest = preparing;
    const checkPreparing = () => {if (preparing.cancelled) throw new Error('CANCELLED');};
    try {
      if (action.new_chat) { target(action.new_chat).click(); await settle(); checkPreparing(); }
      if (action.model_control) { await choose(action, 'model', action.model_control, action.model_value, action.model_label || action.model_value); checkPreparing(); }
      if (action.reasoning_value) {
        if (!action.reasoning_control) throw new Error('REASONING_UNAVAILABLE');
        await choose(action,'reasoning',action.reasoning_control,action.reasoning_value); checkPreparing();
      }
      await attach(action); checkPreparing();
    } finally { if (preparingRequest === preparing) preparingRequest = null; }
    const input = resolve(action,'prompt',action.prompt_node); resolve(action,'send',action.send_node,{allowDisabled:true});
    if (!editable(input)) throw new Error('PROMPT_MAPPING_INVALID');
    if (draft(input).trim()) throw new Error('UNSENT_DRAFT');
    const region = resolve(action,'response',action.response_node,{allowDisabled:true});
    const baseline = assistantNode(region);
    generation = {request: action.request_id, response: id(region), stop: action.stop_node, action,
      baselineNode: baseline, baselineText: baseline ? responseText(baseline) : '', text: '', sawBusy: false, submitted: false,
      timeout: setTimeout(() => stopGeneration('TIMEOUT'), 600000),
      hardTimeout: setTimeout(() => stopGeneration('TIMEOUT'), 3600000)};
    try {
      if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
        const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, action.prompt);
      } else input.textContent = action.prompt;
      input.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertText', data: action.prompt}));
      await settle();
      if (!generation || generation.request !== action.request_id) throw new Error('CANCELLED');
      const deadline = performance.now() + 15000; let send;
      while (performance.now() < deadline) {
        if (!generation || generation.request !== action.request_id) throw new Error('CANCELLED');
        send = resolve(action,'send',action.send_node,{allowDisabled:true});
        if (!send.disabled && send.getAttribute('aria-disabled') !== 'true') break;
        await pause(100);
      }
      if (draft(input) !== action.prompt) throw new Error('COMPOSER_CHANGED');
      generation.submitted = true;
      resolve(action,'send',action.send_node).click();
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

  function capabilities(data, source) { if (!discoveryEnabled) return; const facts=metadata(data,source); if(facts.length)emit({type:'capabilities',origin:location.origin,facts}); }
  function metadataEndpoint(raw) { try { const u=new URL(raw,location.href); return u.origin===location.origin && /\/(models|capabilities|config)(\/|$)/.test(u.pathname); } catch {return false;} }
  async function metadataRead(reader) {
    let timer;
    try { return await Promise.race([reader.read(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('METADATA_TIMEOUT')), 2000);
    })]); } finally { clearTimeout(timer); }
  }
  async function responseMetadata(response, rawURL) {
    const length=Number(response.headers.get('content-length'));
    if (!discoveryEnabled || !metadataEndpoint(rawURL) || !Number.isSafeInteger(length) || length<=0 || length>32768 || !response.headers.get('content-type')?.includes('application/json'))return;
    try { const reader=response.clone().body?.getReader(); if(!reader)return; let bytes=0,text='';const decoder=new TextDecoder();
      try {for(let i=0;i<128;i++){const next=await metadataRead(reader);if(next.done){capabilities(text+decoder.decode(),'PROVIDER_METADATA');return;}bytes+=next.value.length;if(bytes>32768)return;text+=decoder.decode(next.value,{stream:true});}}
      finally{await reader.cancel().catch(()=>{});}
    }catch{/* Metadata failure never changes a website response. */}
  }

  function network(event) {
    if (discoveryEnabled) emit({type: 'network', ...event});
    if (event.status === 429 && generation && event.request_id === generation.request) { emit({type: 'quota', state: 'RATE_LIMITED'}); stopGeneration('PROVIDER_RATE_LIMITED'); }
    if (event.status === 401 && generation && event.request_id === generation.request) { emit({type: 'login_required'}); stopGeneration('AUTH_REQUIRED'); }
  }
  try {
    const original = window.fetch;
    window.fetch = async function(input, init) {
      const url = safeURL(input instanceof Request ? input.url : String(input), location.href);
      const rawURL = input instanceof Request ? input.url : String(input);
      if (metadataEndpoint(rawURL) || (typeof init?.body === 'string' && shape(init.body).known_fields?.includes('messages'))) capabilities(init?.body,'OBSERVED_REQUEST');
      const start = performance.now(); const request_id = generation?.submitted ? generation.request : null;
      try {
        const response = await Reflect.apply(original, this, [input, init]);
        network({transport: 'fetch', request_id, method: String(init?.method || (input instanceof Request ? input.method : 'GET')).slice(0, 12),
          url_pattern: url, status: response.status, content_type: String(response.headers.get('Content-Type') || '').split(';')[0].slice(0, 80),
          duration_ms: Math.round(performance.now() - start), request_shape: shape(init?.body)});
        void responseMetadata(response,rawURL);
        return response; // No arbitrary response capture; only bounded capability endpoints above.
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
      if (meta) { capabilities(args[0],'OBSERVED_REQUEST'); this.addEventListener('loadend', () => network({...meta, request_id, status: this.status}), {once: true}); }
      return Reflect.apply(send, this, args);
    };
    if (window.WebSocket) {
      const Original = window.WebSocket;
      window.WebSocket = class extends Original {
        constructor(...args) { super(...args); const url = safeURL(args[0], location.href);
          this.addEventListener('message', e => {if(typeof e.data==='string' && e.data.length<=32768)capabilities(e.data,'PROVIDER_METADATA');});
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
  document.addEventListener('pointerdown', event => {const node=event.target instanceof Element?event.target.closest('[aria-haspopup],[role="combobox"]'):null;if(node&&visible(node)&&!forbidden(node)){lastMenuTrigger=node;lastMenuAt=Date.now();}},true);
  document.addEventListener('change', scheduleSnapshot,true);
  document.addEventListener('click', event => {
    const node = event.target instanceof Element ? event.target.closest('button,select,[role="button"],[role="option"],textarea,[contenteditable="true"]') : null;
    if (!picker && node && visible(node) && !forbidden(node)) emit({type: 'interaction', node: id(node), role: node.getAttribute('role') || node.tagName.toLowerCase(), label: label(node)});
    scheduleSnapshot();
  }, true);
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function(...args) { const result = Reflect.apply(original, this, args); scheduleSnapshot(); return result; };
  }
  document.addEventListener('keydown', event => {
    if (!event.isTrusted || !(event.metaKey || event.ctrlKey) || !['l','k'].includes(event.key.toLowerCase())) return;
    event.preventDefault(); emit({type:'shortcut',key:event.key.toLowerCase()==='l'?'address':'commands'});
  }, true);
  window.addEventListener('popstate', scheduleSnapshot);
  window.addEventListener('pagehide', () => {endPicker();stopGeneration('NAVIGATED');});
  const observer = new MutationObserver(scheduleSnapshot);
  function start() {
    observer.observe(document.documentElement, {subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ['aria-busy', 'aria-disabled', 'aria-hidden', 'hidden', 'disabled', 'aria-label', 'role','aria-checked','aria-selected','aria-pressed','aria-expanded','aria-controls','data-value','data-state']});
    snapshot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true}); else start();
})();
