import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';
import { onDestroy } from '../../../runtime/svelte_svelte.js';
import { app } from '../state/app.svelte.js';
import * as bridge from '../api/bridge.js';
import Icon from './Icon.svelte.js';

var root_1 = $.from_html(`<button> </button>`);
var root_2 = $.from_html(`<button> </button>`);
var root_3 = $.from_html(`<option>Select an available model</option>`);
var root_4 = $.from_html(`<option> </option>`);
var root_5 = $.from_html(`<div class="note warning" role="status">Your previous selection is no longer available. Choose a model above; Codemax will not switch it silently.</div>`);
var root_6 = $.from_html(`<div class="note"><!><div>There are no ready, enabled models yet. <button class="text-button">Review providers</button> or <button class="text-button">open a website</button>.</div></div>`);
var root_7 = $.from_html(`<button class="secondary"> </button><button class="text-button">Stop gateway</button>`, 1);
var root_8 = $.from_html(`<button class="primary"> </button>`);
var root_9 = $.from_html(`<p role="status"> </p>`);
var root_10 = $.from_html(`<button class="text-button"><!>Save config</button>`);
var root_12 = $.from_html(`<div class="code-panel launch-command"><div class="code-heading"><!><span>Start OpenCode · Bash</span><button class="text-button">Copy setup command</button></div><pre></pre></div>`);
var root_13 = $.from_html(`<div class="note"><!><span>This non-Claude model connection is not vendor-supported. Actual compatibility depends on the website model and Claude Code’s protocol requirements.</span></div>`);
var root_11 = $.from_html(`<p class="connection-instruction"> </p> <div class="code-panel"><div class="code-heading"><!><span> </span><button class="text-button"><!>Copy</button></div><pre> </pre></div> <!> <div class="button-group" style="margin-top:14px"><button class="secondary"><!>Copy local key</button><span class="field-hint">Paste at the terminal prompt. It will not be displayed or saved in the config.</span></div> <!>`, 1);
var root_14 = $.from_html(`<p class="muted">Configuration appears when a website model is ready. Nothing needs to be copied yet.</p>`);
var root = $.from_html(`<div class="connection-layout"><div class="connection-main"><section class="section"><div class="section-title"><h2>1. Choose your client</h2><span class="tag">Website quota</span></div> <div class="segmented" aria-label="Client format"></div> <details class="advanced-client client-formats"><summary>Other clients · protocol examples</summary><div class="segmented"></div><p class="field-hint">Use a protocol your client supports. These are example requests, not one-click installers.</p></details> <label class="field"><span>Website model</span><select aria-label="Client model"><!><!></select></label> <!> <!></section> <section class="section"><div class="section-title"><h2>2. Start the local connection</h2><span><span></span> </span></div> <p>Your client talks to Codemax on this computer. Codemax sends requests through your signed-in website—not a paid provider API.</p> <div class="button-group" style="margin-top:15px"><!><button class="text-button">Gateway settings</button></div> <!></section> <section class="section"><div class="section-title"><h2> </h2><!></div> <!> <details class="advanced-client"><summary>Manual connection details · endpoint and local access token</summary> <label class="field"><span>Local gateway endpoint</span><div class="readout"><code> </code><button class="icon-button" aria-label="Copy API endpoint"><!></button></div></label> <div class="field"><span>Local access token · not a provider credential</span><div class="readout"><code> </code><button class="icon-button"><!></button><button class="icon-button" aria-label="Copy API key"><!></button></div><span class="field-hint">Revealed keys disappear after 30 seconds or when you leave this page.</span></div> <p class="field-hint">Use the same session identifier for continuation. Some clients cache their model catalog; refresh or update their config after changing exposed models.</p></details></section></div> <aside class="connection-help"><h3>What happens next</h3><p>Keep Codemax running. Select your website model in the client and send a request.</p><p>The website tab’s ring spins while working and stays still when idle.</p><button class="text-button">View client sessions<!></button><hr/><h3>Who runs tools?</h3><p>Your coding client runs tools using its own permissions. Codemax’s separate website tool tasks require MCP setup and your approval.</p><button class="text-button">Tools & permissions<!></button><hr/><p class="field-hint">Website quotas still apply. No sign-in credentials are copied out of the browser.</p></aside></div>`);

export default function ExternalClients($$anchor, $$props) {
	$.push($$props, true);

	let probing = $.state(false);
	let probeMessage = $.state('');
	let probeFailed = $.state(false);
	let timer;
	const client = $.derived(() => app.preferences.harness || 'opencode');
	const sh = (value) => "'" + value.replaceAll("'", "'\\''") + "'";
	const endpoint = $.derived(() => `http://127.0.0.1:${app.snapshot?.api.port ?? 7331}`);

	const choice = $.derived(() => app.clientModel
		? app.exposedModels.find((m) => m.id === app.clientModel)
		: app.exposedModels.find((m) => m.id === app.preferences.default_model) || app.exposedModels[0]);

	const model = $.derived(() => $.get(choice)?.id || '');
	const running = $.derived(() => app.ready && app.snapshot?.api.running === true);

	const formatNames = {
		opencode: 'OpenCode',
		claude: 'Claude Code',
		chat: 'Chat API',
		responses: 'Responses API',
		messages: 'Messages API'
	};

	const config = $.derived(() => ({
		$schema: 'https://opencode.ai/config.json',
		model: `bridge/${$.get(model)}`,
		provider: {
			bridge: {
				npm: '@ai-sdk/openai-compatible',
				name: 'Codemax websites',
				options: {
					baseURL: `${$.get(endpoint)}/v1`,
					apiKey: '{env:BRIDGE_API_KEY}'
				},
				models: Object.fromEntries(app.exposedModels.map((m) => [m.id, { name: `${m.provider.label} / ${m.display_name}` }]))
			}
		}
	}));

	const filename = $.derived(() => $.get(client) === 'opencode'
		? 'opencode.json'
		: $.get(client) === 'claude'
			? 'Start Claude Code · Bash'
			: 'Streaming request · Bash');

	const snippet = $.derived(() => {
		if (!$.get(model)) return '';
		if ($.get(client) === 'opencode') return JSON.stringify($.get(config), null, 2);
		if ($.get(client) === 'claude') return `read -rsp 'Codemax local key: ' ANTHROPIC_AUTH_TOKEN; echo\nexport ANTHROPIC_AUTH_TOKEN\nexport ANTHROPIC_BASE_URL='${$.get(endpoint)}'\nexport ANTHROPIC_MODEL=${sh($.get(model))}\nexport ANTHROPIC_DEFAULT_HAIKU_MODEL=${sh($.get(model))}\nexport ANTHROPIC_DEFAULT_SONNET_MODEL=${sh($.get(model))}\nexport ANTHROPIC_DEFAULT_OPUS_MODEL=${sh($.get(model))}\nclaude`;

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

		return `read -rsp 'Codemax local key: ' BRIDGE_API_KEY; echo\nexport BRIDGE_API_KEY\ncurl --no-buffer '${$.get(endpoint)}${path}' \\\n  -H "Authorization: Bearer $BRIDGE_API_KEY" \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Bridge-Session: terminal-review' \\\n${$.get(client) === 'messages' ? "  -H 'anthropic-version: 2023-06-01' \\\n" : ''}  --data ${sh(JSON.stringify(payload))}`;
	});

	const startCommand = "read -rsp 'Codemax local key: ' BRIDGE_API_KEY; echo\nexport BRIDGE_API_KEY\nopencode";

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
		if ($.get(probing) || !$.get(running)) return;

		$.set(probing, true);
		$.set(probeMessage, '');
		$.set(probeFailed, false);

		try {
			const result = await bridge.probe();

			if (!result.healthy) throw Error('GATEWAY_HEALTH_FAILED');

			$.set(probeMessage, `Local gateway reachable in ${result.round_trip_ms} ms. No website prompt was sent.`);
		} catch(error) {
			$.set(probeFailed, true);
			$.set(probeMessage, 'The local connection check failed. Check the gateway settings and retry.');
			app.error = String(error);
		} finally {
			$.set(probing, false);
		}
	}

	function stop() {
		void app.ask('Stop the local gateway?', 'Connected client requests will be cancelled. Browser tabs and website logins will stay open.', 'Stop gateway', () => app.perform('api.stop'));
	}

	// A port/host change invalidates the old health result; it is not a live probe.
	let checkedEndpoint = '';

	$.user_effect(() => {
		const fingerprint = `${$.get(endpoint)}:${$.get(running)}`;

		if (checkedEndpoint !== fingerprint) {
			checkedEndpoint = fingerprint;
			$.set(probeMessage, '');
			$.set(probeFailed, false);
		}
	});

	onDestroy(() => {
		clearTimeout(timer);
		app.secret = '';
	});

	var div = root();
	var div_1 = $.child(div);
	var section = $.child(div_1);
	var div_2 = $.sibling($.child(section), 2);

	$.each(div_2, 20, () => ['opencode', 'claude'], $.index, ($$anchor, id) => {
		var button = root_1();

		button.__click = () => app.settings({ harness: id });

		let classes;
		var text = $.child(button, true);

		$.reset(button);

		$.template_effect(
			($0) => {
				$.set_attribute(button, 'aria-pressed', $.get(client) === id);
				button.disabled = $0;
				classes = $.set_class(button, 1, '', null, classes, { active: $.get(client) === id });
				$.set_text(text, formatNames[id]);
			},
			[() => !app.ready || app.busy('settings.update')]
		);

		$.append($$anchor, button);
	});

	$.reset(div_2);

	var details = $.sibling(div_2, 2);
	var div_3 = $.sibling($.child(details));

	$.each(div_3, 20, () => ['chat', 'responses', 'messages'], $.index, ($$anchor, id) => {
		var button_1 = root_2();

		button_1.__click = () => app.settings({ harness: id });

		let classes_1;
		var text_1 = $.child(button_1, true);

		$.reset(button_1);

		$.template_effect(
			($0) => {
				$.set_attribute(button_1, 'aria-pressed', $.get(client) === id);
				button_1.disabled = $0;
				classes_1 = $.set_class(button_1, 1, '', null, classes_1, { active: $.get(client) === id });
				$.set_text(text_1, formatNames[id]);
			},
			[() => !app.ready || app.busy('settings.update')]
		);

		$.append($$anchor, button_1);
	});

	$.reset(div_3);
	$.next();
	$.reset(details);

	var label = $.sibling(details, 2);
	var select = $.sibling($.child(label));

	select.__change = (e) => app.clientModel = e.currentTarget.value;

	var node = $.child(select);

	{
		var consequent = ($$anchor) => {
			var option = root_3();

			option.value = option.__value = '';
			$.append($$anchor, option);
		};

		$.if(node, ($$render) => {
			if (!$.get(model)) $$render(consequent);
		});
	}

	var node_1 = $.sibling(node);

	$.each(node_1, 17, () => app.exposedModels, (m) => m.id, ($$anchor, m) => {
		var option_1 = root_4();
		var text_2 = $.child(option_1);

		$.reset(option_1);

		var option_1_value = {};

		$.template_effect(() => {
			$.set_text(text_2, `${$.get(m).provider.label ?? ''} / ${$.get(m).display_name ?? ''}`);

			if (option_1_value !== (option_1_value = $.get(m).id)) {
				option_1.value = (option_1.__value = $.get(m).id) ?? '';
			}
		});

		$.append($$anchor, option_1);
	});

	$.reset(select);

	var select_value;

	$.init_select(select);
	$.reset(label);

	var node_2 = $.sibling(label, 2);

	{
		var consequent_1 = ($$anchor) => {
			var div_4 = root_5();

			$.append($$anchor, div_4);
		};

		$.if(node_2, ($$render) => {
			if (app.clientModel && !$.get(choice)) $$render(consequent_1);
		});
	}

	var node_3 = $.sibling(node_2, 2);

	{
		var consequent_2 = ($$anchor) => {
			var div_5 = root_6();
			var node_4 = $.child(div_5);

			Icon(node_4, { name: 'globe', size: 16 });

			var div_6 = $.sibling(node_4);
			var button_2 = $.sibling($.child(div_6));

			button_2.__click = () => app.navigate('providers');

			var button_3 = $.sibling(button_2, 2);

			button_3.__click = () => app.newTab();
			$.next();
			$.reset(div_6);
			$.reset(div_5);
			$.append($$anchor, div_5);
		};

		$.if(node_3, ($$render) => {
			if (!app.exposedModels.length) $$render(consequent_2);
		});
	}

	$.reset(section);

	var section_1 = $.sibling(section, 2);
	var div_7 = $.child(section_1);
	var span = $.sibling($.child(div_7));
	let classes_2;
	var span_1 = $.child(span);
	let classes_3;
	var text_3 = $.sibling(span_1, 1, true);

	$.reset(span);
	$.reset(div_7);

	var div_8 = $.sibling(div_7, 4);
	var node_5 = $.child(div_8);

	{
		var consequent_3 = ($$anchor) => {
			var fragment = root_7();
			var button_4 = $.first_child(fragment);

			button_4.__click = probe;

			var text_4 = $.child(button_4, true);

			$.reset(button_4);

			var button_5 = $.sibling(button_4);

			button_5.__click = stop;

			$.template_effect(
				($0) => {
					button_4.disabled = $.get(probing);
					$.set_text(text_4, $.get(probing) ? 'Checking…' : 'Check connection');
					button_5.disabled = $0;
				},
				[() => app.busy('api.stop')]
			);

			$.append($$anchor, fragment);
		};

		var alternate = ($$anchor) => {
			var button_6 = root_8();

			button_6.__click = () => app.perform('api.start');

			var text_5 = $.child(button_6, true);

			$.reset(button_6);

			$.template_effect(
				($0, $1) => {
					button_6.disabled = $0;
					$.set_text(text_5, $1);
				},
				[
					() => !app.ready || app.busy('api.start'),
					() => app.busy('api.start') ? 'Starting…' : 'Start gateway'
				]
			);

			$.append($$anchor, button_6);
		};

		$.if(node_5, ($$render) => {
			if ($.get(running)) $$render(consequent_3); else $$render(alternate, false);
		});
	}

	var button_7 = $.sibling(node_5);

	button_7.__click = () => app.settingsPage('gateway');
	$.reset(div_8);

	var node_6 = $.sibling(div_8, 2);

	{
		var consequent_4 = ($$anchor) => {
			var p = root_9();
			let classes_4;
			var text_6 = $.child(p);

			$.reset(p);

			$.template_effect(() => {
				classes_4 = $.set_class(p, 1, 'connection-result', null, classes_4, { 'danger-text': $.get(probeFailed) });
				$.set_text(text_6, `${$.get(probeMessage) ?? ''} Website access and client interoperability are separate checks.`);
			});

			$.append($$anchor, p);
		};

		$.if(node_6, ($$render) => {
			if ($.get(probeMessage)) $$render(consequent_4);
		});
	}

	$.reset(section_1);

	var section_2 = $.sibling(section_1, 2);
	var div_9 = $.child(section_2);
	var h2 = $.child(div_9);
	var text_7 = $.child(h2);

	$.reset(h2);

	var node_7 = $.sibling(h2);

	{
		var consequent_5 = ($$anchor) => {
			var button_8 = root_10();

			button_8.__click = () => app.export('opencode.json', $.get(config));

			var node_8 = $.child(button_8);

			Icon(node_8, { name: 'download', size: 14 });
			$.next();
			$.reset(button_8);
			$.template_effect(() => button_8.disabled = !app.ready || !$.get(model));
			$.append($$anchor, button_8);
		};

		$.if(node_7, ($$render) => {
			if ($.get(client) === 'opencode') $$render(consequent_5);
		});
	}

	$.reset(div_9);

	var node_9 = $.sibling(div_9, 2);

	{
		var consequent_8 = ($$anchor) => {
			var fragment_1 = root_11();
			var p_1 = $.first_child(fragment_1);
			var text_8 = $.child(p_1, true);

			$.reset(p_1);

			var div_10 = $.sibling(p_1, 2);
			var div_11 = $.child(div_10);
			var node_10 = $.child(div_11);

			{
				let $0 = $.derived(() => $.get(client) === 'opencode' ? 'folder' : 'terminal');

				Icon(node_10, {
					get name() {
						return $.get($0);
					},
					size: 13
				});
			}

			var span_2 = $.sibling(node_10);
			var text_9 = $.child(span_2, true);

			$.reset(span_2);

			var button_9 = $.sibling(span_2);

			button_9.__click = () => app.clipboard($.get(snippet));

			var node_11 = $.child(button_9);

			Icon(node_11, { name: 'copy', size: 13 });
			$.next();
			$.reset(button_9);
			$.reset(div_11);

			var pre = $.sibling(div_11);
			var text_10 = $.child(pre, true);

			$.reset(pre);
			$.reset(div_10);

			var node_12 = $.sibling(div_10, 2);

			{
				var consequent_6 = ($$anchor) => {
					var div_12 = root_12();
					var div_13 = $.child(div_12);
					var node_13 = $.child(div_13);

					Icon(node_13, { name: 'terminal', size: 13 });

					var button_10 = $.sibling(node_13, 2);

					button_10.__click = () => app.clipboard(startCommand);
					$.reset(div_13);

					var pre_1 = $.sibling(div_13);

					pre_1.textContent = 'read -rsp \'Codemax local key: \' BRIDGE_API_KEY; echo\nexport BRIDGE_API_KEY\nopencode';
					$.reset(div_12);
					$.template_effect(() => button_10.disabled = !app.ready);
					$.append($$anchor, div_12);
				};

				$.if(node_12, ($$render) => {
					if ($.get(client) === 'opencode') $$render(consequent_6);
				});
			}

			var div_14 = $.sibling(node_12, 2);
			var button_11 = $.child(div_14);

			button_11.__click = copyKey;

			var node_14 = $.child(button_11);

			Icon(node_14, { name: 'key', size: 14 });
			$.next();
			$.reset(button_11);
			$.next();
			$.reset(div_14);

			var node_15 = $.sibling(div_14, 2);

			{
				var consequent_7 = ($$anchor) => {
					var div_15 = root_13();
					var node_16 = $.child(div_15);

					Icon(node_16, { name: 'alert', size: 16 });
					$.next();
					$.reset(div_15);
					$.append($$anchor, div_15);
				};

				$.if(node_15, ($$render) => {
					if ($.get(client) === 'claude') $$render(consequent_7);
				});
			}

			$.template_effect(
				($0) => {
					$.set_text(text_8, $.get(client) === 'opencode'
						? 'Save this in your project, or merge the provider entry into your existing opencode.json. Do not replace an existing configuration without reviewing it.'
						: $.get(client) === 'claude'
							? 'Run this in a Bash terminal, then paste the copied local key at the prompt. It only changes that terminal’s environment.'
							: 'Run this example in a Bash terminal and paste the copied local key at the prompt.');

					$.set_text(text_9, $.get(filename));
					button_9.disabled = !app.ready;
					$.set_text(text_10, $.get(snippet));
					button_11.disabled = $0;
				},
				[() => !app.ready || app.busy('key.reveal')]
			);

			$.append($$anchor, fragment_1);
		};

		var alternate_1 = ($$anchor) => {
			var p_2 = root_14();

			$.append($$anchor, p_2);
		};

		$.if(node_9, ($$render) => {
			if ($.get(model)) $$render(consequent_8); else $$render(alternate_1, false);
		});
	}

	var details_1 = $.sibling(node_9, 2);
	var label_1 = $.sibling($.child(details_1), 2);
	var div_16 = $.sibling($.child(label_1));
	var code = $.child(div_16);
	var text_11 = $.child(code, true);

	$.reset(code);

	var button_12 = $.sibling(code);

	button_12.__click = () => app.clipboard($.get(client) === 'claude' || $.get(client) === 'messages' ? $.get(endpoint) : `${$.get(endpoint)}/v1`);

	var node_17 = $.child(button_12);

	Icon(node_17, { name: 'copy', size: 14 });
	$.reset(button_12);
	$.reset(div_16);
	$.reset(label_1);

	var div_17 = $.sibling(label_1, 2);
	var div_18 = $.sibling($.child(div_17));
	var code_1 = $.child(div_18);
	var text_12 = $.child(code_1, true);

	$.reset(code_1);

	var button_13 = $.sibling(code_1);

	button_13.__click = reveal;

	var node_18 = $.child(button_13);

	{
		let $0 = $.derived(() => app.secret ? 'close' : 'eye');

		Icon(node_18, {
			get name() {
				return $.get($0);
			},
			size: 15
		});
	}

	$.reset(button_13);

	var button_14 = $.sibling(button_13);

	button_14.__click = copyKey;

	var node_19 = $.child(button_14);

	Icon(node_19, { name: 'copy', size: 14 });
	$.reset(button_14);
	$.reset(div_18);
	$.next();
	$.reset(div_17);
	$.next(2);
	$.reset(details_1);
	$.reset(section_2);
	$.reset(div_1);

	var aside = $.sibling(div_1, 2);
	var button_15 = $.sibling($.child(aside), 3);

	button_15.__click = () => app.navigate('sessions');

	var node_20 = $.sibling($.child(button_15));

	Icon(node_20, { name: 'arrow', size: 13 });
	$.reset(button_15);

	var button_16 = $.sibling(button_15, 4);

	button_16.__click = () => app.navigate('tools');

	var node_21 = $.sibling($.child(button_16));

	Icon(node_21, { name: 'arrow', size: 13 });
	$.reset(button_16);
	$.next(2);
	$.reset(aside);
	$.reset(div);

	$.template_effect(
		($0) => {
			details.open = $0;
			select.disabled = !app.ready || !app.exposedModels.length;

			if (select_value !== (select_value = app.clientModel || $.get(model))) {
				(
					select.value = (select.__value = app.clientModel || $.get(model)) ?? '',
					$.select_option(select, app.clientModel || $.get(model))
				);
			}

			classes_2 = $.set_class(span, 1, 'tag', null, classes_2, { ready: $.get(running) });
			classes_3 = $.set_class(span_1, 1, 'dot', null, classes_3, { online: $.get(running) });
			$.set_text(text_3, !app.ready ? 'Disconnected' : $.get(running) ? 'Ready' : 'Stopped');
			$.set_text(text_7, `3. Configure ${formatNames[$.get(client)] ?? ''}`);
			$.set_text(text_11, $.get(client) === 'claude' || $.get(client) === 'messages' ? $.get(endpoint) : `${$.get(endpoint)}/v1`);
			button_12.disabled = !app.ready;
			$.set_text(text_12, app.secret || 'Hidden — reveal or copy explicitly');
			$.set_attribute(button_13, 'aria-label', app.secret ? 'Hide API key' : 'Reveal API key');
			button_13.disabled = !app.ready;
			button_14.disabled = !app.ready;
		},
		[
			() => ['chat', 'responses', 'messages'].includes($.get(client))
		]
	);

	$.append($$anchor, div);
	$.pop();
}

$.delegate(['click', 'change']);