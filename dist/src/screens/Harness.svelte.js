import '../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { onDestroy } from '../../runtime/svelte_svelte.js';
import { app } from '../lib/state/app.svelte.js';
import * as bridge from '../lib/api/bridge.js';
import Icon from '../lib/components/Icon.svelte.js';

var root_1 = $.from_html(`<span class="spinner"></span>`);
var root_3 = $.from_html(`<option> </option>`);
var root_4 = $.from_html(`<div class="note good"><!><span> </span></div>`);
var root_5 = $.from_html(`<button class="text-button"><!>Save config</button>`);
var root_6 = $.from_html(`<button> </button>`);
var root_7 = $.from_html(`<p class="field-hint" style="margin-top:12px">Save in your project. Set <code>BRIDGE_API_KEY</code> in the terminal before launching OpenCode, or connect provider <code>bridge</code> through its credential manager. Model limits are omitted when unknown.</p>`);
var root_9 = $.from_html(`<p class="field-hint" style="margin-top:12px">This sets the Messages gateway for this terminal only. Real Claude Code compatibility still depends on the selected website model and the client’s protocol requirements; it is not a vendor-supported non-Claude integration.</p>`);
var root_10 = $.from_html(`<p class="field-hint" style="margin-top:12px">Reuse the session header for continuation. Chat and Messages clients resend the ordered conversation; Responses clients can send <code>previous_response_id</code>. Never share the local key.</p>`);
var root = $.from_html(`<section class="screen"><div class="screen-inner"><header class="screen-head"><div><div class="breadcrumb">Workspace / Local gateway</div><h1>Connect a client</h1><p>Bring the models from your browser into the coding tools you already use.</p></div><button class="secondary"><!>Test gateway</button></header> <div class="split"><div><section class="section"><div class="section-title"><h2>Connection details</h2><span><span></span> </span></div><label class="field"><span>OpenAI-compatible base URL</span><div class="readout"><!><code> </code><button class="icon-button" aria-label="Copy API endpoint"><!></button></div></label><div class="field"><span>Local API key <span class="faint">Not a provider credential</span></span><div class="readout"><!><code> </code><button class="icon-button"><!></button><button class="icon-button" aria-label="Copy API key"><!></button></div><span class="field-hint">Revealed keys disappear after 30 seconds. Copying is an explicit action.</span></div><label class="field" style="margin-bottom:0"><span>Model</span><select aria-label="Client model"><option> </option><!></select></label><!></section> <section class="section" style="border:0"><div class="section-title"><h2>Client configuration</h2><!></div><div class="segmented" aria-label="Client format"></div><div class="code-panel"><div class="code-heading"><!><span> </span><button class="text-button"><!>Copy</button></div><pre> </pre></div><!></section></div><aside><section class="section"><span class="label">Three steps, no new account</span><div class="step"><span class="step-num">1</span><div><strong>Open your AI website</strong><p>Sign in and select the model on its own page. Open its model menu to help discovery.</p></div></div><div class="step"><span class="step-num">2</span><div><strong>Point your tool here</strong><p>Use the loopback endpoint and local key. The gateway stays on this machine.</p></div></div><div class="step"><span class="step-num">3</span><div><strong>Start a conversation</strong><p>Keep Bridge running. Requests stream through the corresponding website tab.</p></div></div></section><section class="section"><h3 style="margin-bottom:12px">What crosses the bridge</h3><p>Messages, model selections, framed tool calls, and cancellation. Website login credentials stay in the webview.</p><p style="margin-top:12px">The coding client executes tools. Bridge never executes a model’s shell command itself.</p></section><section class="section"><div class="note" style="padding:0"><!><span>Website limits and access rules still apply. Fallback is disabled unless you explicitly configure it.</span></div></section><button class="text-button" style="margin-top:15px">Watch session activity<!></button></aside></div></div></section>`);

export default function Harness($$anchor, $$props) {
	$.push($$props, true);

	let client = $.state('opencode');
	let selected = $.state('');
	let probing = $.state(false);
	let probeMessage = $.state('');
	let timer;
	const endpoint = $.derived(() => `http://127.0.0.1:${app.snapshot?.api.port ?? 7331}`);
	const model = $.derived(() => $.get(selected) || app.preferences.default_model || app.models[0]?.id || 'bridge/default');

	const clients = [
		{ id: 'opencode', name: 'OpenCode' },
		{ id: 'claude', name: 'Claude Code' },
		{ id: 'chat', name: 'Chat API' },
		{ id: 'responses', name: 'Responses API' },
		{ id: 'messages', name: 'Messages API' }
	];

	const config = $.derived(() => ({
		$schema: 'https://opencode.ai/config.json',
		model: `bridge/${$.get(model)}`,
		provider: {
			bridge: {
				npm: '@ai-sdk/openai-compatible',
				name: 'Desktop AI Bridge',
				options: {
					baseURL: `${$.get(endpoint)}/v1`,
					apiKey: '{env:BRIDGE_API_KEY}'
				},
				models: Object.fromEntries(app.models.map((m) => [m.id, { name: `${m.provider.label} / ${m.display_name}` }]))
			}
		}
	}));

	const filename = $.derived(() => $.get(client) === 'opencode'
		? 'opencode.json'
		: $.get(client) === 'claude'
			? 'Terminal · current session'
			: 'Terminal · streaming request');

	const snippet = $.derived(() => {
		if ($.get(client) === 'opencode') return JSON.stringify($.get(config), null, 2);
		if ($.get(client) === 'claude') return `read -rsp 'Local Bridge key: ' ANTHROPIC_AUTH_TOKEN; echo\nexport ANTHROPIC_AUTH_TOKEN\nexport ANTHROPIC_BASE_URL='${$.get(endpoint)}'\nexport ANTHROPIC_MODEL='${$.get(model)}'\nexport ANTHROPIC_DEFAULT_HAIKU_MODEL='${$.get(model)}'\nexport ANTHROPIC_DEFAULT_SONNET_MODEL='${$.get(model)}'\nexport ANTHROPIC_DEFAULT_OPUS_MODEL='${$.get(model)}'\nclaude`;

		const path = $.get(client) === 'chat'
			? '/v1/chat/completions'
			: $.get(client) === 'responses' ? '/v1/responses' : '/v1/messages';

		const payload = $.get(client) === 'responses'
			? {
				model: $.get(model),
				input: 'Explain how you will approach a code review.',
				stream: true
			}
			: $.get(client) === 'messages'
				? {
					model: $.get(model),
					max_tokens: 1024,
					stream: true,
					messages: [
						{
							role: 'user',
							content: 'Explain how you will approach a code review.'
						}
					]
				}
				: {
					model: $.get(model),
					stream: true,
					messages: [
						{
							role: 'user',
							content: 'Explain how you will approach a code review.'
						}
					]
				};

		return `read -rsp 'Local Bridge key: ' BRIDGE_API_KEY; echo\nexport BRIDGE_API_KEY\ncurl --no-buffer '${$.get(endpoint)}${path}' \\\n  -H "Authorization: Bearer $BRIDGE_API_KEY" \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Bridge-Session: terminal-review' \\\n${$.get(client) === 'messages' ? "  -H 'anthropic-version: 2023-06-01' \\\n" : ''}  --data '${JSON.stringify(payload)}'`;
	});

	async function reveal() {
		if (app.secret) {
			app.secret = '';
			clearTimeout(timer);

			return;
		}

		const result = await app.perform('key.reveal');

		if (result) {
			app.secret = result.token;
			clearTimeout(timer);
			timer = setTimeout(() => app.secret = '', 30000);
		}
	}

	async function copyKey() {
		const result = await app.perform('key.reveal');

		if (result) await app.clipboard(result.token);
	}

	async function probe() {
		$.set(probing, true);
		$.set(probeMessage, '');

		try {
			const result = await bridge.probe();

			$.set(probeMessage, `HTTP /health answered in ${result.round_trip_ms} ms. Zag protocol 1 confirmed.`);
		} catch(error) {
			app.error = String(error);
		} finally {
			$.set(probing, false);
		}
	}

	onDestroy(() => {
		clearTimeout(timer);
		app.secret = '';
	});

	var section = root();
	var div = $.child(section);
	var header = $.child(div);
	var button = $.sibling($.child(header));

	button.__click = probe;

	var node = $.child(button);

	{
		var consequent = ($$anchor) => {
			var span = root_1();

			$.append($$anchor, span);
		};

		var alternate = ($$anchor) => {
			Icon($$anchor, { name: 'bolt', size: 15 });
		};

		$.if(node, ($$render) => {
			if ($.get(probing)) $$render(consequent); else $$render(alternate, false);
		});
	}

	$.next();
	$.reset(button);
	$.reset(header);

	var div_1 = $.sibling(header, 2);
	var div_2 = $.child(div_1);
	var section_1 = $.child(div_2);
	var div_3 = $.child(section_1);
	var span_1 = $.sibling($.child(div_3));
	let classes;
	var span_2 = $.child(span_1);
	let classes_1;
	var text = $.sibling(span_2, 1, true);

	$.reset(span_1);
	$.reset(div_3);

	var label = $.sibling(div_3);
	var div_4 = $.sibling($.child(label));
	var node_1 = $.child(div_4);

	Icon(node_1, { name: 'globe', size: 15 });

	var code = $.sibling(node_1);
	var text_1 = $.child(code);

	$.reset(code);

	var button_1 = $.sibling(code);

	button_1.__click = () => app.clipboard(`${$.get(endpoint)}/v1`);

	var node_2 = $.child(button_1);

	Icon(node_2, { name: 'copy', size: 14 });
	$.reset(button_1);
	$.reset(div_4);
	$.reset(label);

	var div_5 = $.sibling(label);
	var div_6 = $.sibling($.child(div_5));
	var node_3 = $.child(div_6);

	Icon(node_3, { name: 'key', size: 15 });

	var code_1 = $.sibling(node_3);
	var text_2 = $.child(code_1, true);

	$.reset(code_1);

	var button_2 = $.sibling(code_1);

	button_2.__click = reveal;

	var node_4 = $.child(button_2);

	{
		let $0 = $.derived(() => app.secret ? 'close' : 'eye');

		Icon(node_4, {
			get name() {
				return $.get($0);
			},
			size: 15
		});
	}

	$.reset(button_2);

	var button_3 = $.sibling(button_2);

	button_3.__click = copyKey;

	var node_5 = $.child(button_3);

	Icon(node_5, { name: 'copy', size: 14 });
	$.reset(button_3);
	$.reset(div_6);
	$.next();
	$.reset(div_5);

	var label_1 = $.sibling(div_5);
	var select = $.sibling($.child(label_1));
	var option = $.child(select);
	var text_3 = $.child(option, true);

	$.reset(option);
	option.value = option.__value = '';

	var node_6 = $.sibling(option);

	$.each(node_6, 17, () => app.models, (m) => m.id, ($$anchor, m) => {
		var option_1 = root_3();
		var text_4 = $.child(option_1);

		$.reset(option_1);

		var option_1_value = {};

		$.template_effect(() => {
			$.set_text(text_4, `${$.get(m).provider.label ?? ''} / ${$.get(m).display_name ?? ''}`);

			if (option_1_value !== (option_1_value = $.get(m).id)) {
				option_1.value = (option_1.__value = $.get(m).id) ?? '';
			}
		});

		$.append($$anchor, option_1);
	});

	$.reset(select);
	$.reset(label_1);

	var node_7 = $.sibling(label_1);

	{
		var consequent_1 = ($$anchor) => {
			var div_7 = root_4();
			var node_8 = $.child(div_7);

			Icon(node_8, { name: 'check', size: 15 });

			var span_3 = $.sibling(node_8);
			var text_5 = $.child(span_3);

			$.reset(span_3);
			$.reset(div_7);
			$.template_effect(() => $.set_text(text_5, `${$.get(probeMessage) ?? ''} This does not send a prompt to a website.`));
			$.append($$anchor, div_7);
		};

		$.if(node_7, ($$render) => {
			if ($.get(probeMessage)) $$render(consequent_1);
		});
	}

	$.reset(section_1);

	var section_2 = $.sibling(section_1, 2);
	var div_8 = $.child(section_2);
	var node_9 = $.sibling($.child(div_8));

	{
		var consequent_2 = ($$anchor) => {
			var button_4 = root_5();

			button_4.__click = () => app.export('opencode.json', $.get(config));

			var node_10 = $.child(button_4);

			Icon(node_10, { name: 'download', size: 14 });
			$.next();
			$.reset(button_4);
			$.template_effect(() => button_4.disabled = !app.models.length);
			$.append($$anchor, button_4);
		};

		$.if(node_9, ($$render) => {
			if ($.get(client) === 'opencode') $$render(consequent_2);
		});
	}

	$.reset(div_8);

	var div_9 = $.sibling(div_8);

	$.each(div_9, 21, () => clients, $.index, ($$anchor, c) => {
		var button_5 = root_6();

		button_5.__click = () => $.set(client, $.get(c).id, true);

		let classes_2;
		var text_6 = $.child(button_5, true);

		$.reset(button_5);

		$.template_effect(() => {
			classes_2 = $.set_class(button_5, 1, '', null, classes_2, { active: $.get(client) === $.get(c).id });
			$.set_text(text_6, $.get(c).name);
		});

		$.append($$anchor, button_5);
	});

	$.reset(div_9);

	var div_10 = $.sibling(div_9);
	var div_11 = $.child(div_10);
	var node_11 = $.child(div_11);

	{
		let $0 = $.derived(() => $.get(client) === 'opencode' ? 'folder' : 'terminal');

		Icon(node_11, {
			get name() {
				return $.get($0);
			},
			size: 13
		});
	}

	var span_4 = $.sibling(node_11);
	var text_7 = $.child(span_4, true);

	$.reset(span_4);

	var button_6 = $.sibling(span_4);

	button_6.__click = () => app.clipboard($.get(snippet));

	var node_12 = $.child(button_6);

	Icon(node_12, { name: 'copy', size: 13 });
	$.next();
	$.reset(button_6);
	$.reset(div_11);

	var pre = $.sibling(div_11);
	var text_8 = $.child(pre, true);

	$.reset(pre);
	$.reset(div_10);

	var node_13 = $.sibling(div_10);

	{
		var consequent_3 = ($$anchor) => {
			var p = root_7();

			$.append($$anchor, p);
		};

		var alternate_2 = ($$anchor) => {
			var fragment_1 = $.comment();
			var node_14 = $.first_child(fragment_1);

			{
				var consequent_4 = ($$anchor) => {
					var p_1 = root_9();

					$.append($$anchor, p_1);
				};

				var alternate_1 = ($$anchor) => {
					var p_2 = root_10();

					$.append($$anchor, p_2);
				};

				$.if(
					node_14,
					($$render) => {
						if ($.get(client) === 'claude') $$render(consequent_4); else $$render(alternate_1, false);
					},
					true
				);
			}

			$.append($$anchor, fragment_1);
		};

		$.if(node_13, ($$render) => {
			if ($.get(client) === 'opencode') $$render(consequent_3); else $$render(alternate_2, false);
		});
	}

	$.reset(section_2);
	$.reset(div_2);

	var aside = $.sibling(div_2);
	var section_3 = $.sibling($.child(aside), 2);
	var div_12 = $.child(section_3);
	var node_15 = $.child(div_12);

	Icon(node_15, { name: 'shield', size: 16 });
	$.next();
	$.reset(div_12);
	$.reset(section_3);

	var button_7 = $.sibling(section_3);

	button_7.__click = () => app.navigate('sessions');

	var node_16 = $.sibling($.child(button_7));

	Icon(node_16, { name: 'arrow', size: 13 });
	$.reset(button_7);
	$.reset(aside);
	$.reset(div_1);
	$.reset(div);
	$.reset(section);

	$.template_effect(() => {
		button.disabled = !app.ready || $.get(probing) || !app.snapshot?.api.running;
		classes = $.set_class(span_1, 1, 'tag', null, classes, { ready: app.snapshot?.api.running });
		classes_1 = $.set_class(span_2, 1, 'dot', null, classes_1, { online: app.snapshot?.api.running });
		$.set_text(text, app.snapshot?.api.running ? 'Listening on loopback' : 'Stopped');
		$.set_text(text_1, `${$.get(endpoint) ?? ''}/v1`);
		$.set_text(text_2, app.secret || 'sk-local-••••••••••••••••••••••••••••');
		$.set_attribute(button_2, 'aria-label', app.secret ? 'Hide API key' : 'Reveal API key');
		button_2.disabled = !app.ready;
		button_3.disabled = !app.ready;
		select.disabled = !app.models.length;
		$.set_text(text_3, app.preferences.default_model ? 'Workspace default' : 'First discovered model');
		$.set_text(text_7, $.get(filename));
		button_6.disabled = !app.models.length;
		$.set_text(text_8, $.get(snippet));
	});

	$.bind_select_value(select, () => $.get(selected), ($$value) => $.set(selected, $$value));
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click']);