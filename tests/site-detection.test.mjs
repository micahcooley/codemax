// Per-site detection fixtures: the agent's page observation must surface the
// controls each supported website actually exposes (signed-in and signed-out
// shapes), in English and Chinese, with and without testid-only buttons.
// Runs in linkedom (no browser needed); the backend admission half is proven
// natively in backend/tests/site_detection.zag.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {webcrypto} from 'node:crypto';
import {performance} from 'node:perf_hooks';

const root = new URL('..', import.meta.url);
const semanticsSrc = readFileSync(new URL('../browser/semantics.js', import.meta.url), 'utf8');
const agentSrc = readFileSync(new URL('../browser/agent.js', import.meta.url), 'utf8');

// linkedom reports zero-size boxes; every fixture element counts as laid out.
{
  const {document: probeDoc} = parseHTML('<!doctype html><html><body><div></div></body></html>');
  const rect = {x: 0, y: 0, width: 160, height: 28, top: 0, left: 0, bottom: 28, right: 160, toJSON() { return {...this}; }};
  Object.getPrototypeOf(probeDoc.createElement('div')).getBoundingClientRect = function () { return {...rect}; };
}

async function observeSite(origin, bodyHtml) {
  // Fresh linkedom document per fixture, but linkedom shares one window
  // realm across parses (re-running the agent sources would collide on the
  // frozen __BRIDGE globals). Each fixture therefore gets a fresh VM sandbox
  // global; only stateless linkedom classes are shared.
  const {document} = parseHTML(`<!doctype html><html><head></head><body>${bodyHtml}</body></html>`);
  const shared = document.defaultView;
  const facade = {};
  facade.top = facade;
  facade.fetch = shared.fetch ? shared.fetch.bind(shared) : undefined;
  facade.addEventListener = () => {};
  facade.removeEventListener = () => {};
  const sandbox = {
    document,
    window: facade,
    location: {origin, href: origin + '/', protocol: 'https:'},
    history: {pushState() {}, replaceState() {}},
    crypto: webcrypto,
    performance,
    navigator: {language: 'en-US'},
    TextEncoder,
    URL,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    getComputedStyle: el => ({display: 'block', visibility: 'visible', cursor: 'default', opacity: (el && el.style && el.style.opacity) || ''}),
    requestAnimationFrame: fn => setTimeout(fn, 0),
    MutationObserver: shared.MutationObserver,
  };
  for (const key of ['HTMLElement', 'HTMLTextAreaElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLButtonElement', 'Element', 'Node', 'Event', 'CustomEvent', 'XMLHttpRequest']) {
    if (shared[key] !== undefined) sandbox[key] = shared[key];
  }
  if (sandbox.Event !== undefined && sandbox.InputEvent === undefined) {
    sandbox.InputEvent = class extends sandbox.Event {
      constructor(type, init = {}) { super(type, init); this.inputType = init.inputType; this.data = init.data; }
    };
  }
  sandbox.__BRIDGE_BOOT__ = Object.freeze({origin});
  const events = [];
  sandbox.__TAURI_INTERNALS__ = {invoke: async (cmd, args) => { events.push(args.event); return null; }};
  const context = vm.createContext(sandbox);
  vm.runInContext(semanticsSrc, context);
  vm.runInContext(agentSrc, context);
  await new Promise(resolve => setTimeout(resolve, 120));
  const observations = events.filter(e => e && e.type === 'observation');
  assert.ok(observations.length >= 1, `${origin}: expected at least one observation`);
  return {controls: observations[observations.length - 1].controls, password: observations[observations.length - 1].password_fields_present, facts: events.filter(e => e && e.type === 'capabilities').flatMap(e => e.facts || []), document, context, events};
}
const has = (controls, pred) => controls.some(pred);
const label = c => `${c.label || ''} ${c.current_value || ''} ${c.value || ''}`;
const isSend = c => (c.role === 'button' || c.tag === 'button') && /send|发送/i.test(label(c));
const isModel = c => (c.role === 'button' || c.role === 'combobox' || c.tag === 'select') && /model|模型/i.test(label(c));
const isNewChat = c => /new chat|new conversation|new thread|新对话|新聊天|新会话|新的对话/i.test(c.label || '');
const isReason = c => /reason|think|思考|推理/i.test(label(c));
const isPrompt = c => !!c.editable;
const isAssistant = c => !!c.assistant;
const optionsOf = controls => controls.filter(c => (c.role === 'option' || c.role === 'menuitemradio' || c.role === 'menuitem') && c.menu_owner > 0);

const CHATGPT = `<button aria-label="New chat">New chat</button>
<main><div data-message-author-role="assistant">Hi</div></main>
<button id="m1" aria-label="Choose model" aria-haspopup="menu">GPT-5</button>
<div role="menu" aria-labelledby="m1"><div role="menuitemradio" data-value="gpt-5">GPT-5</div><div role="menuitemradio" data-value="gpt-5-mini">GPT-5 mini</div></div>
<textarea aria-label="Ask anything" placeholder="Ask anything"></textarea>
<button data-testid="send-button" aria-label="Send message">send</button>
<input type="file" aria-label="Attach files"/>`;

const CLAUDE = `<button aria-label="New chat">New chat</button>
<main><div data-role="assistant">Hello</div></main>
<button id="m2" aria-label="Model menu" aria-haspopup="menu">Claude Sonnet 4.5</button>
<div role="listbox" aria-labelledby="m2"><div role="option" data-value="claude-sonnet-4-5">Claude Sonnet 4.5</div><div role="option" data-value="claude-haiku-4-5">Claude Haiku 4.5</div></div>
<div contenteditable="true" aria-label="Write your prompt to Claude"> </div>
<button aria-label="Send message">send</button>`;

const GEMINI = `<button aria-label="New chat">New chat</button>
<main><div data-role="assistant">Hi</div></main>
<button id="m3" aria-label="Model" aria-haspopup="menu">Gemini 2.5 Flash</button>
<div role="menu" aria-labelledby="m3"><div role="menuitemradio" data-value="gemini-2.5-flash">2.5 Flash</div><div role="menuitemradio" data-value="gemini-2.5-pro">2.5 Pro</div></div>
<textarea aria-label="Ask Gemini" placeholder="Ask Gemini"></textarea>
<button aria-label="Send message">send</button>`;

const GROK = `<button aria-label="New chat">New chat</button>
<main><div data-role="assistant">Yo</div></main>
<button id="m4" aria-label="Model" aria-haspopup="menu">Grok 4</button>
<div role="menu" aria-labelledby="m4"><div role="menuitemradio" data-value="grok-4">Grok 4</div><div role="menuitemradio" data-value="grok-4-heavy">Grok 4 Heavy</div></div>
<button role="switch" aria-label="Think">Think</button>
<textarea aria-label="Ask Grok" placeholder="Ask Grok"></textarea>
<button data-testid="send-button" aria-label="Send">send</button>`;

const QWEN = `<button aria-label="新对话">新对话</button>
<main><div data-role="assistant">你好</div></main>
<button id="m5" aria-label="模型" aria-haspopup="menu">Qwen3-Max</button>
<div role="menu" aria-labelledby="m5"><div role="menuitemradio" data-value="qwen3-max">Qwen3-Max</div><div role="menuitemradio" data-value="qwen3-235b">Qwen3-235B</div></div>
<button role="switch" aria-label="深度思考">深度思考</button>
<textarea placeholder="输入你的问题，Enter 发送"></textarea>
<button aria-label="发送">发送</button>
<input type="file" aria-label="上传附件"/>`;

const KIMI = `<button aria-label="新对话">新对话</button>
<main><div data-role="assistant">你好，我是 Kimi</div></main>
<button id="m6" aria-haspopup="menu">Kimi K2</button>
<div role="menu" aria-labelledby="m6"><div role="menuitemradio" data-value="k2">Kimi K2</div><div role="menuitemradio" data-value="k2-thinking">Kimi K2 Thinking</div></div>
<button role="switch" aria-label="深度思考">深度思考</button>
<textarea placeholder="问问 Kimi"></textarea>
<button aria-label="发送">发送</button>`;

const ZAI = `<button aria-label="New Chat">New Chat</button>
<main><div data-message-author-role="assistant">Hello</div></main>
<button id="m7" aria-label="Model" aria-haspopup="menu">GLM-4.6</button>
<div role="menu" aria-labelledby="m7"><div role="menuitemradio" data-value="glm-4.6">GLM-4.6</div><div role="menuitemradio" data-value="glm-4.5">GLM-4.5</div></div>
<textarea placeholder="Send a message"></textarea>
<button aria-label="Send">Send</button>`;

const ZAI_ANON = `<button aria-label="New Chat">New Chat</button>
<main></main>
<button id="m8" aria-label="Model" aria-haspopup="menu">GLM-5.3-Flash</button>
<div role="menu" aria-labelledby="m8"><div role="menuitemradio" data-value="glm-5.3-flash">GLM-5.3-Flash</div></div>
<textarea placeholder="Send a message"></textarea>
<button aria-label="Send">Send</button>`;

const STEPFUN = `<button aria-label="新对话">新对话</button>
<main><div data-role="assistant">有什么可以帮你</div></main>
<button id="m9" aria-label="模型" aria-haspopup="menu">Step 3.5 Flash</button>
<div role="menu" aria-labelledby="m9"><div role="menuitemradio" data-value="step-3.5-flash">Step 3.5 Flash</div><div role="menuitemradio" data-value="step-2">Step 2</div></div>
<textarea placeholder="想知道什么？"></textarea>
<button aria-label="发送">发送</button>`;

const DEEPSEEK = `<button aria-label="新的对话">新的对话</button>
<main><div data-role="assistant">你好</div></main>
<button aria-label="深度思考" aria-pressed="false">深度思考</button>
<button aria-label="联网搜索">联网搜索</button>
<textarea placeholder="给 DeepSeek 发送消息"></textarea>
<button aria-label="发送">发送</button>`;

const MINIMAX = `<button aria-label="New chat">New chat</button>
<main><div data-role="assistant">Hello</div></main>
<button id="m11" aria-label="Model" aria-haspopup="menu">MiniMax M2</button>
<div role="menu" aria-labelledby="m11"><div role="menuitemradio" data-value="minimax-m2">MiniMax M2</div><div role="menuitemradio" data-value="minimax-m2-her">MiniMax M2-her</div></div>
<textarea aria-label="Ask MiniMax" placeholder="Ask MiniMax"></textarea>
<button aria-label="Send message">send</button>`;

const MISTRAL = `<button aria-label="New chat">New chat</button>
<main><div data-role="assistant">Bonjour</div></main>
<button id="m12" aria-label="Model" aria-haspopup="menu">Mistral Large</button>
<div role="menu" aria-labelledby="m12"><div role="menuitemradio" data-value="mistral-large">Mistral Large</div><div role="menuitemradio" data-value="mistral-medium">Mistral Medium</div></div>
<textarea aria-label="Ask Mistral" placeholder="Ask Mistral"></textarea>
<button aria-label="Send message">send</button>`;

const LOGIN_WALL = `<main><h1>Welcome</h1></main>
<form><input type="email" aria-label="Email" autocomplete="email"/><input type="password" aria-label="密码"/><button aria-label="登录">登录</button></form>`;

const EPHEMERAL_CHAT = `<button aria-label="New chat">New chat</button>
<main><div data-message-author-role="assistant">Hi</div></main>
<button role="switch" aria-label="Temporary chat" aria-checked="false">Temporary chat</button>
<textarea aria-label="Ask anything" placeholder="Ask anything"></textarea>
<button aria-label="Send message">send</button>`;

const ZAI_LOCKED = `<button aria-label="New Chat">New Chat</button>
<main><div data-message-author-role="assistant">Here is your answer</div></main>
<button id="m20" aria-label="Model" aria-haspopup="menu" disabled>GLM-4.6</button>
<button aria-label="Think" aria-pressed="true" disabled>Think</button>
<textarea placeholder="Send a message"></textarea>
<button aria-label="Send">Send</button>`;

const ZAI_UNLOCKED = `<button aria-label="New Chat">New Chat</button>
<main></main>
<button id="m21" aria-label="Model" aria-haspopup="menu" disabled>GLM-4.6</button>
<textarea placeholder="Send a message"></textarea>
<button aria-label="Send">Send</button>`;

const COPILOT = `<button aria-label="New chat">New chat</button>
<main><div data-role="assistant">Hello</div></main>
<button id="m13" aria-label="Model" aria-haspopup="menu">GPT-5</button>
<div role="menu" aria-labelledby="m13"><div role="menuitemradio" data-value="gpt-5">GPT-5</div><div role="menuitemradio" data-value="think-deeper">Think Deeper</div></div>
<textarea aria-label="Ask me anything" placeholder="Ask me anything"></textarea>
<button aria-label="Send message">send</button>`;

const GHCOPILOT = `<button aria-label="New chat">New chat</button>
<main><div data-role="assistant">Hello</div></main>
<button id="m14" aria-label="Model" aria-haspopup="menu">GPT-5</button>
<div role="menu" aria-labelledby="m14"><div role="menuitemradio" data-value="gpt-5">GPT-5</div><div role="menuitemradio" data-value="claude-sonnet-4-5">Claude Sonnet 4.5</div></div>
<textarea aria-label="Ask Copilot" placeholder="Ask Copilot"></textarea>
<button aria-label="Send message">send</button>`;

const PERPLEXITY = `<button aria-label="New Thread">New Thread</button>
<main><div data-role="assistant">Hello</div></main>
<button id="m15" aria-label="Model" aria-haspopup="menu">Sonar</button>
<div role="menu" aria-labelledby="m15"><div role="menuitemradio" data-value="sonar">Sonar</div><div role="menuitemradio" data-value="claude-sonnet-4-5">Claude Sonnet 4.5</div></div>
<textarea aria-label="Ask anything" placeholder="Ask anything"></textarea>
<button aria-label="Send message">send</button>`;

const META = `<button aria-label="New chat">New chat</button>
<main><div data-role="assistant">Hello</div></main>
<textarea aria-label="Ask Meta AI" placeholder="Ask Meta AI"></textarea>
<button aria-label="Send message">send</button>`;

const KIMI_LANDING = `<button aria-label="New chat">New chat</button>
<main><h1>KIMI</h1></main>
<textarea aria-label="Ask anything" placeholder="Ask anything"></textarea>
<button aria-label="Send">send</button>
<button aria-label="Think" style="opacity:0.5">think</button>
<button aria-label="Stop generating" style="opacity:0">stop</button>`;

const MODES = `<button aria-label="New chat">New chat</button>
<main><div data-role="assistant">Hello</div></main>
<button id="m16" aria-label="Model" aria-haspopup="menu">GLM-4.6</button>
<div role="menu" aria-labelledby="m16"><div role="menuitemradio" data-value="glm-4.6">GLM-4.6</div><div role="menuitemradio" data-value="glm-4.5">GLM-4.5</div></div>
<button id="r16" aria-label="Thinking mode" aria-haspopup="menu">Auto</button>
<div role="menu" aria-labelledby="r16"><div role="menuitemradio" data-value="auto">Auto</div><div role="menuitemradio" data-value="thinking">Thinking</div><div role="menuitemradio" data-value="fast">Fast</div></div>
<textarea aria-label="Send a message" placeholder="Send a message"></textarea>
<button aria-label="Send">Send</button>`;

async function expectChatSite(name, origin, html, {options = 0, reasoning = false, model = true, assistant = true} = {}) {
  const {controls, password} = await observeSite(origin, html);
  assert.equal(password, false, `${name}: no password fields on the chat surface`);
  assert.ok(has(controls, isPrompt), `${name}: composer observed`);
  assert.ok(has(controls, isSend), `${name}: send observed`);
  if (model) assert.ok(has(controls, isModel), `${name}: model control observed`);
  assert.ok(has(controls, isNewChat), `${name}: new-chat observed`);
  if (assistant) assert.ok(has(controls, isAssistant), `${name}: assistant region observed`);
  if (reasoning) assert.ok(has(controls, isReason), `${name}: reasoning control observed`);
  const owned = optionsOf(controls);
  assert.ok(owned.length >= options, `${name}: expected ${options} owned menu options, saw ${owned.length}`);
  return controls;
}

test('chatgpt composer, model menu and testid send are observed', async () => {
  const controls = await expectChatSite('chatgpt', 'https://chatgpt.com', CHATGPT, {options: 2});
  assert.ok(has(controls, c => c.role === 'menuitemradio' && /gpt-5-mini/i.test(label(c))), 'chatgpt: mini option observed');
  assert.ok(has(controls, c => c.file_input === true), 'chatgpt: attachment input observed');
});

test('claude composer, model menu and options are observed', async () => {
  await expectChatSite('claude', 'https://claude.ai', CLAUDE, {options: 2});
});

test('gemini composer, model menu and options are observed', async () => {
  await expectChatSite('gemini', 'https://gemini.google.com', GEMINI, {options: 2});
});

test('grok composer, model, think switch and testid send are observed', async () => {
  await expectChatSite('grok', 'https://grok.com', GROK, {options: 2, reasoning: true});
});

test('qwen chinese composer, send, model and reasoning are observed', async () => {
  const controls = await expectChatSite('qwen', 'https://chat.qwen.ai', QWEN, {options: 2, reasoning: true});
  assert.ok(has(controls, c => c.file_input === true), 'qwen: attachment input observed');
});

test('kimi separator-less model name resolves through menu options', async () => {
  const controls = await expectChatSite('kimi', 'https://kimi.moonshot.cn', KIMI, {options: 2, reasoning: true, model: false});
  const owned = optionsOf(controls);
  assert.ok(owned.some(c => /k2-thinking/i.test(label(c))), 'kimi: thinking option observed with owner');
});

test('zai open-webui composer and model menu are observed', async () => {
  await expectChatSite('zai', 'https://chat.z.ai', ZAI, {options: 2});
});

test('zai anonymous surface exposes only the flash model option', async () => {
  const controls = await expectChatSite('zai-anon', 'https://chat.z.ai', ZAI_ANON, {options: 1, model: true, assistant: false});
  const owned = optionsOf(controls);
  assert.equal(owned.length, 1, 'zai-anon: exactly one model option');
  assert.ok(/5\.3-flash/i.test(label(owned[0])), 'zai-anon: the anonymous model is flash');
});

const SEARCH_PAGE = `<form role="search"><input type="search" aria-label="搜索问题" placeholder="搜索问题"/><button aria-label="Search">Search</button></form>
<main><div><h2>Results</h2><p>ordinary web content</p></div></main>`;

test('ordinary search page yields no chat controls', async () => {
  const {controls, password} = await observeSite('https://search.example', SEARCH_PAGE);
  assert.equal(password, false, 'search: no password fields');
  assert.ok(!has(controls, isSend), 'search: no send control');
  assert.ok(!has(controls, isModel), 'search: no model control');
  assert.ok(!has(controls, isNewChat), 'search: no new-chat control');
});

test('stepfun chinese composer and versioned model are observed', async () => {
  await expectChatSite('stepfun', 'https://chat.stepfun.com', STEPFUN, {options: 2});
});

test('deepseek chinese composer, send and think toggle are observed', async () => {
  const {controls} = await observeSite('https://chat.deepseek.com', DEEPSEEK);
  assert.ok(has(controls, isPrompt), 'deepseek: composer observed');
  assert.ok(has(controls, isSend), 'deepseek: send observed');
  assert.ok(has(controls, isNewChat), 'deepseek: new-conversation observed');
  assert.ok(has(controls, isReason), 'deepseek: think toggle observed');
});

test('minimax composer and model menu are observed', async () => {
  await expectChatSite('minimax', 'https://agent.minimax.io', MINIMAX, {options: 2});
});

test('mistral composer and model menu are observed', async () => {
  await expectChatSite('mistral', 'https://chat.mistral.ai', MISTRAL, {options: 2});
});

test('signed-out login wall reports password fields and no chat controls', async () => {
  const {controls, password} = await observeSite('https://claude.ai', LOGIN_WALL);
  assert.equal(password, true, 'login wall: password presence reported');
  assert.ok(!has(controls, isPrompt), 'login wall: no composer');
  assert.ok(!has(controls, isSend), 'login wall: no send');
});

test('ephemeral switch flips on before submission, timers cleaned', async () => {
  const env = await observeSite('https://chatgpt.com', EPHEMERAL_CHAT);
  const docId = (env.events.find(e => e && e.document_id) || {}).document_id;
  assert.ok(docId, 'document id observed');
  const prompt = env.controls.find(c => c.editable);
  const send = env.controls.find(c => /send message/i.test(c.label || ''));
  const togg = env.controls.find(c => /temporary chat/i.test(c.label || ''));
  const region = env.controls.find(c => c.tag === 'main');
  assert.ok(prompt && send && togg && region, 'ephemeral mappings present');
  // The website flips its own switch on click; the test models that behavior.
  const sw = env.document.querySelector('[aria-label="Temporary chat"]');
  sw.addEventListener('click', () => sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true'));
  vm.runInContext(`__BRIDGE_EXECUTE__(${JSON.stringify({type: 'generate', document_id: docId, request_id: 't9', prompt: 'Hello', prompt_node: prompt.id, send_node: send.id, response_node: region.id, stop_node: 0, ephemeral: 'on', ephemeral_control: togg.id})});`, env.context);
  await new Promise(resolve => setTimeout(resolve, 1500));
  assert.equal(sw.getAttribute('aria-checked'), 'true', 'temporary switch flipped on');
  assert.ok(env.events.some(e => e && e.type === 'action_result' && e.status === 'submitted'), 'prompt submitted after ephemeral setup');
  vm.runInContext(`__BRIDGE_EXECUTE__(${JSON.stringify({type: 'stop', document_id: docId, request_id: 't9'})});`, env.context);
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.ok(env.events.some(e => e && e.type === 'generation_error'), 'stop issued, generation timers cleared');
});

test('browser shortcut contract matches across page, host and bridge', () => {
  const agent = readFileSync(new URL('../browser/agent.js', import.meta.url), 'utf8');
  const host = readFileSync(new URL('../src-tauri/src/views.rs', import.meta.url), 'utf8');
  const bridge = readFileSync(new URL('../src/lib/api/bridge.ts', import.meta.url), 'utf8');
  const keys = ['close-tab', 'reopen-tab', 'new-tab', 'next-tab', 'prev-tab'];
  for (const key of keys) {
    assert.ok(agent.includes(`'${key}'`), `agent forwards ${key}`);
    assert.ok(bridge.includes(`'${key}'`), `bridge types ${key}`);
  }
  assert.ok(agent.includes("'tab-' + key"), 'agent builds numbered tabs');
  assert.ok(bridge.includes('`tab-${1|2|3|4|5|6|7|8|9}`'), 'bridge types numbered tabs');
  for (const key of ['close-tab', 'reopen-tab', 'new-tab', 'next-tab', 'prev-tab']) {
    assert.ok(host.includes(`"${key}"`), `host allows ${key}`);
  }
  assert.ok(host.includes("tab-"), 'host allows numbered tabs');
  assert.ok(agent.includes('isTrusted'), 'forwarder requires trusted input');
});

async function dispatchKey(origin, html, init, trusted) {
  const {document} = parseHTML(`<!doctype html><html><head></head><body>${html}</body></html>`);
  const shared = document.defaultView;
  const sandbox = {
    document, window: {}, location: {origin, href: origin + '/', protocol: 'https:'},
    history: {pushState() {}, replaceState() {}}, crypto: webcrypto, performance,
    TextEncoder, URL, setTimeout, clearTimeout, queueMicrotask,
    getComputedStyle: () => ({display: 'block', visibility: 'visible', cursor: 'default'}),
    requestAnimationFrame: fn => setTimeout(fn, 0), MutationObserver: shared.MutationObserver,
  };
  sandbox.window.top = sandbox.window;
  sandbox.window.addEventListener = () => {};
  sandbox.window.removeEventListener = () => {};
  for (const key of ['HTMLElement', 'HTMLTextAreaElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLButtonElement', 'Element', 'Node', 'Event', 'CustomEvent', 'KeyboardEvent']) {
    if (shared[key] !== undefined) sandbox[key] = shared[key];
  }
  if (sandbox.Event !== undefined && sandbox.InputEvent === undefined) {
    sandbox.InputEvent = class extends sandbox.Event {
      constructor(type, init = {}) { super(type, init); this.inputType = init.inputType; this.data = init.data; }
    };
  }
  sandbox.__BRIDGE_BOOT__ = Object.freeze({origin});
  const events = [];
  sandbox.__TAURI_INTERNALS__ = {invoke: async (cmd, args) => { events.push(args.event); return null; }};
  const context = vm.createContext(sandbox);
  vm.runInContext(semanticsSrc, context);
  vm.runInContext(agentSrc, context);
  await new Promise(resolve => setTimeout(resolve, 60));
  const target = document.querySelector('textarea');
  const Evt = sandbox.KeyboardEvent || sandbox.Event;
  const event = new Evt('keydown', {bubbles: true, cancelable: true});
  for (const [prop, value] of Object.entries({key: init.key ?? '', metaKey: !!init.metaKey, ctrlKey: !!init.ctrlKey, shiftKey: !!init.shiftKey})) {
    try { event[prop] = value; } catch { Object.defineProperty(event, prop, {value, configurable: true}); }
    if (event[prop] !== value) Object.defineProperty(event, prop, {value, configurable: true});
  }
  if (trusted) Object.defineProperty(event, 'isTrusted', {value: true});
  target.dispatchEvent(event);
  await new Promise(resolve => setTimeout(resolve, 60));
  return events.filter(e => e && e.type === 'shortcut');
}

test('untrusted page keystrokes never become UI gestures', async () => {
  const shortcuts = await dispatchKey('https://chatgpt.com', CHATGPT, {key: 'w', metaKey: true}, false);
  assert.equal(shortcuts.length, 0, 'synthetic mod+w ignored');
});

test('trusted browser keys forward as named gestures', async () => {
  const closed = await dispatchKey('https://chatgpt.com', CHATGPT, {key: 'w', metaKey: true}, true);
  assert.ok(closed.some(e => e.key === 'close-tab'), 'meta+w forwards close-tab');
  const digits = await dispatchKey('https://chatgpt.com', CHATGPT, {key: '3', ctrlKey: true}, true);
  assert.ok(digits.some(e => e.key === 'tab-3'), 'ctrl+3 forwards tab-3');
  const plain = await dispatchKey('https://chatgpt.com', CHATGPT, {key: 'c', metaKey: true}, true);
  assert.equal(plain.length, 0, 'meta+c stays with the page');
});

test('locked conversation flags disabled model and reasoning once history exists', async () => {
  const {controls} = await observeSite('https://chat.z.ai', ZAI_LOCKED);
  const model = controls.find(c => /GLM-4\.6/i.test(label(c)));
  assert.ok(model && model.locked === true, 'zai-locked: model control flagged locked');
  const think = controls.find(c => /^think$/i.test((c.label || '').trim()));
  assert.ok(think && think.locked === true, 'zai-locked: reasoning control flagged locked');
});

test('disabled controls before any history are not locks', async () => {
  const {controls} = await observeSite('https://chat.z.ai', ZAI_UNLOCKED);
  const model = controls.find(c => /GLM-4\.6/i.test(label(c)));
  assert.ok(model && !model.locked, 'zai-unlocked: no lock without conversation');
});

test('copilot composer, model menu and options are observed', async () => {
  await expectChatSite('copilot', 'https://copilot.microsoft.com', COPILOT, {options: 2});
});

test('github copilot composer and multi-vendor model menu are observed', async () => {
  await expectChatSite('ghcopilot', 'https://github.com', GHCOPILOT, {options: 2});
});

test('perplexity thread, sonar menu and options are observed', async () => {
  await expectChatSite('perplexity', 'https://perplexity.ai', PERPLEXITY, {options: 2});
});

test('separate reasoning menu keeps Auto Thinking Fast distinct from models', async () => {
  const {controls} = await observeSite('https://modes.example', MODES);
  assert.ok(has(controls, isPrompt), 'modes: composer observed');
  assert.ok(has(controls, isSend), 'modes: send observed');
  assert.ok(has(controls, isModel), 'modes: model control observed');
  assert.ok(has(controls, isReason), 'modes: reasoning control observed');
  const owned = optionsOf(controls);
  assert.ok(owned.length >= 5, `modes: expected 5 owned menu options, saw ${owned.length}`);
  const byValue = new Map(owned.map(c => [(c.value || '').toLowerCase(), c]));
  for (const mode of ['auto', 'thinking', 'fast']) {
    const opt = byValue.get(mode);
    assert.ok(opt, `modes: ${mode} option observed`);
  }
  const modelBtn = controls.find(c => /model/i.test(c.label || '') && ['button', 'combobox'].includes(c.role));
  const reasonBtn = controls.find(c => /thinking mode/i.test(c.label || ''));
  assert.ok(modelBtn && reasonBtn && modelBtn.id !== reasonBtn.id, 'modes: distinct model and reasoning controls');
  for (const mode of ['auto', 'thinking', 'fast']) {
    const opt = byValue.get(mode);
    assert.equal(opt.menu_owner, reasonBtn.id, `modes: ${mode} owned by reasoning control, not the model menu`);
  }
});

test('opacity-hidden stop button is not evidence; mid-transition controls still count', async () => {
  const {controls} = await observeSite('https://kimi.ai', KIMI_LANDING);
  assert.ok(has(controls, isPrompt), 'kimi-landing: composer observed');
  assert.ok(has(controls, isSend), 'kimi-landing: send observed');
  assert.ok(has(controls, isNewChat), 'kimi-landing: new-chat observed');
  const stopCtl = controls.find(c => /stop/i.test(c.label || ''));
  assert.ok(stopCtl && stopCtl.visible === false, 'kimi-landing: transparent stop reports invisible, page reads idle');
  assert.ok(!controls.some(c => /stop/i.test(c.label || '') && c.visible), 'kimi-landing: no visible stop control');
  const thinkCtl = controls.find(c => /^think$/i.test((c.label || '').trim()));
  assert.ok(thinkCtl && thinkCtl.visible === true, 'kimi-landing: mid-fade think control still observed');
});

test('meta ai composer and send map without a model menu', async () => {
  const {controls} = await observeSite('https://meta.ai', META);
  assert.ok(has(controls, isPrompt), 'meta: composer observed');
  assert.ok(has(controls, isSend), 'meta: send observed');
  assert.ok(has(controls, isNewChat), 'meta: new-chat observed');
});
