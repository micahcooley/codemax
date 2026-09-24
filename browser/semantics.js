/* Pure production helpers, shared by instrumentation and direct unit tests. */
(() => {
  'use strict';
  const encoder = new TextEncoder();
  // Auth words stay out of evidence in English and Chinese: login buttons and
  // credential-adjacent labels must never become control mappings or facts.
  const sensitive = /password|passcode|credit.?card|card.?number|security.?code|verification.?code|one.?time|billing|payment|delete.?account|sign.?out|log.?out|sign.?in|log.?in|sign.?up|authori[sz]e|grant.?access|continue.?with|subscribe|purchase|upgrade|oauth|secret|密码|登录|登陆|注册|账号|帳號|手机号|驗證|验证码|微信|扫码/i;
  const isSensitive = value => sensitive.test(String(value));
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
    const safe = x => typeof x === 'string' && x.length > 0 && x.length <= 180 && !isSensitive(x) && redact(x) === x;
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
  // Only explicit token counts are numeric. Ambiguous K/M labels stay labels.
  function contextEvidence(value) {
    if (typeof value !== 'string' || value.length > 1024 || isSensitive(value)) return null;
    const text = value.replace(/\s+/g, ' ').trim();
    const match = /\bcontext\b(?: window| length| limit)?\s*[:=]?\s*([\d,]+(?:\.\d+)?\s*[kKmM]?)\s*(?:tokens?)?\b/i.exec(text) ||
      /\b([\d,]+(?:\.\d+)?\s*[kKmM]?)\s*(?:tokens?)?\s+context(?: window| length| limit)?\b/i.exec(text);
    if (!match || redact(match[0]) !== match[0]) return null;
    const literal = match[1].trim();
    const exact = /^(?:[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)$/.test(literal);
    const n = exact ? Number(literal.replaceAll(',', '')) : NaN;
    return { context_tokens: Number.isSafeInteger(n) && n >= 128 && n <= 10000000 ? n : null,
      context_display: match[0].slice(0,180) };
  }

  Object.defineProperty(globalThis,'__CODEMAX_SEMANTICS__',{value:Object.freeze({isSensitive,redact,safeURL,shape,metadata,splitText,appendDelta,contextEvidence})});
})();
