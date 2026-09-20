import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';
import { onDestroy } from '../../../runtime/svelte_svelte.js';
import { app } from '../state/app.svelte.js';
import * as bridge from '../api/bridge.js';
import Icon from './Icon.svelte.js';
import { privateLaunch } from '../launch-command.js';

var root_1 = $.from_html(`<option>Choose an available model</option>`);
var root_2 = $.from_html(`<option> </option>`);
var root_3 = $.from_html(`<p class="note warning">Your selected model is unavailable. Choose another explicitly; no automatic replacement.</p>`);
var root_4 = $.from_html(`<p class="connect-empty">Visit an AI chat website and sign in. Your available models appear here automatically.</p><button class="secondary">Browse a website</button>`, 1);
var root_6 = $.from_html(`<span class="spinner"></span>`);
var root_8 = $.from_html(`<p class="field-hint">The included Koryphaios integration discovers this gateway and its available models on this computer. Existing installations need the integration applied first.</p>`);
var root_9 = $.from_html(`<p class="field-hint"> </p> <p class="private-command-note"><!>Includes your local access key. Paste only into your terminal; clipboard and terminal history may retain it.</p>`, 1);
var root_5 = $.from_html(`<button class="primary launch-connect"><!> </button> <!>`, 1);
var root_10 = $.from_html(`<p role="status"> </p>`);
var root_11 = $.from_html(`<p class="field-hint compatibility-note">Non-Claude website models may not support every Claude Code feature. This does not certify vendor compatibility.</p>`);
var root_12 = $.from_html(`<button> </button>`);
var root_13 = $.from_html(`<button> </button>`);
var root_14 = $.from_html(`<option>Select an available model</option>`);
var root_15 = $.from_html(`<option> </option>`);
var root_16 = $.from_html(`<div class="note warning" role="status">Your previous selection is no longer available. Choose a model above; Codemax will not switch it silently.</div>`);
var root_17 = $.from_html(`<div class="note"><!><div>There are no ready, enabled models yet. <button class="text-button">Review providers</button> or <button class="text-button">open a website</button>.</div></div>`);
var root_18 = $.from_html(`<button class="secondary"> </button><button class="text-button">Stop gateway</button>`, 1);
var root_19 = $.from_html(`<button class="primary"> </button>`);
var root_20 = $.from_html(`<p role="status"> </p>`);
var root_21 = $.from_html(`<button class="text-button"><!>Save config</button>`);
var root_23 = $.from_html(`<div class="code-panel launch-command"><div class="code-heading"><!><span>Start OpenCode · Bash</span><button class="text-button">Copy setup command</button></div><pre></pre></div>`);
var root_24 = $.from_html(`<div class="button-group" style="margin-top:14px"><button class="secondary"><!>Copy local key</button><span class="field-hint">Paste at the terminal prompt. It will not be displayed or saved in the config.</span></div>`);
var root_25 = $.from_html(`<div class="note"><!><span>This non-Claude model connection is not vendor-supported. Actual compatibility depends on the website model and Claude Code’s protocol requirements.</span></div>`);
var root_22 = $.from_html(`<p class="connection-instruction"> </p> <div class="code-panel"><div class="code-heading"><!><span> </span><button class="text-button"><!>Copy</button></div><pre> </pre></div> <!> <!> <!>`, 1);
var root_26 = $.from_html(`<p class="muted">Configuration appears when a website model is ready. Nothing needs to be copied yet.</p>`);
var root = $.from_html(`<section class="quick-connect" aria-label="Simple client connection"><div class="quick-connection-status"><span></span><span> </span></div> <label class="field"><span>Coding client</span><select aria-label="Quick coding client"><option>Koryphaios</option><option>OpenCode</option><option>Claude Code</option><option>Other · Chat Completions</option><option>Other · Responses API</option><option>Other · Messages API</option></select></label> <label class="field"><span>Website model</span><select aria-label="Quick website model"><!><!></select></label> <!> <!> <!> <!> <div class="connect-checklist"><!><span>Website account → Codemax → your coding client</span></div></section> <details class="connection-advanced" aria-label="Advanced client configuration"><summary>Advanced setup and connection details</summary> <div class="connection-layout"><div class="connection-main"><section class="section"><div class="section-title"><h2>1. Choose your client</h2><span class="tag">Website quota</span></div> <div class="segmented" aria-label="Client format"></div> <details class="advanced-client client-formats"><summary>Other clients · protocol examples</summary><div class="segmented"></div><p class="field-hint">Use a protocol your client supports. These are example requests, not one-click installers.</p></details> <label class="field"><span>Website model</span><select aria-label="Client model"><!><!></select></label> <!> <!></section> <section class="section"><div class="section-title"><h2>2. Start the local connection</h2><span><span></span> </span></div> <p>Your client talks to Codemax on this computer. Codemax sends requests through your signed-in website—not a paid provider API.</p> <div class="button-group" style="margin-top:15px"><!><button class="text-button">Gateway settings</button></div> <!></section> <section class="section"><div class="section-title"><h2> </h2><!></div> <!> <details class="advanced-client"><summary>Manual connection details · endpoint and local access token</summary> <label class="field"><span>Local gateway endpoint</span><div class="readout"><code> </code><button class="icon-button" aria-label="Copy API endpoint"><!></button></div></label> <div class="field"><span>Local access token · not a provider credential</span><div class="readout"><code> </code><button class="icon-button"><!></button><button class="icon-button" aria-label="Copy API key"><!></button></div><span class="field-hint">Revealed keys disappear after 30 seconds or when you leave this page.</span></div> <p class="field-hint">Use the same session identifier for continuation. Some clients cache their model catalog; refresh or update their config after changing exposed models.</p></details></section></div> <aside class="connection-help"><h3>What happens next</h3><p>Keep Codemax running. Select your website model in the client and send a request.</p><p>The website tab’s ring spins while working and stays still when idle.</p><button class="text-button">View client sessions<!></button><hr/><h3>Who runs tools?</h3><p>Your coding client runs tools using its own permissions. Codemax’s separate website tool tasks require MCP setup and your approval.</p><button class="text-button">Tools & permissions<!></button><hr/><p class="field-hint">Website quotas still apply. No sign-in credentials are copied out of the browser.</p></aside></div></details>`, 1);

export default function ExternalClients($$anchor, $$props) {
	$.push($$props, true);

	let alive = true;
	let setupBusy = $.state(false);
	let setupMessage = $.state('');
	let setupError = $.state(false);
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
		koryphaios: 'Koryphaios',
		opencode: 'OpenCode',
		claude: 'Claude Code',
		chat: 'Chat API',
		responses: 'Responses API',
		messages: 'Messages API'
	};

	const config = $.derived(() => ({
		$schema: 'https://opencode.ai/config.json',
		model: `codemax/${$.get(model)}`,
		provider: {
			codemax: {
				npm: '@ai-sdk/openai-compatible',
				name: 'Codemax websites',
				options: {
					baseURL: `${$.get(endpoint)}/v1`,
					apiKey: '{env:CODEMAX_API_KEY}'
				},
				models: Object.fromEntries(app.exposedModels.map((m) => [m.id, { name: `${m.provider.label} / ${m.display_name}` }]))
			}
		}
	}));

	const filename = $.derived(() => $.get(client) === 'koryphaios'
		? 'Automatic local connection'
		: $.get(client) === 'opencode'
			? 'opencode.json'
			: $.get(client) === 'claude'
				? 'Start Claude Code · Bash'
				: 'Streaming request · Bash');

	const snippet = $.derived(() => {
		if (!$.get(model)) return '';
		if ($.get(client) === 'koryphaios') return '1. Keep Codemax and its local gateway running.\n2. Open Koryphaios with the included Codemax provider integration installed.\n3. Select Codemax websites, then your detected model.\n\nThe integration reads Codemax’s private connection file and refreshes its model catalog.\nNo provider key, terminal command, or secret copying is required.';
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

		return `read -rsp 'Codemax local key: ' CODEMAX_API_KEY; echo\nexport CODEMAX_API_KEY\ncurl --no-buffer '${$.get(endpoint)}${path}' \\\n  -H "Authorization: Bearer $CODEMAX_API_KEY" \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Bridge-Session: terminal-review' \\\n${$.get(client) === 'messages' ? "  -H 'anthropic-version: 2023-06-01' \\\n" : ''}  --data ${sh(JSON.stringify(payload))}`;
	});

	const startCommand = "read -rsp 'Codemax local key: ' CODEMAX_API_KEY; echo\nexport CODEMAX_API_KEY\nopencode";

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

	async function prepareAndCopy() {
		if ($.get(setupBusy) || !app.ready || !$.get(model)) return;

		const selected = {
			client: $.get(client),
			model: $.get(model),
			endpoint: $.get(endpoint),
			config: $.get(config)
		};

		$.set(setupBusy, true);
		$.set(setupError, false);
		$.set(setupMessage, 'Checking the local connection…');

		try {
			if (!$.get(running) && await app.perform('api.start') === undefined) throw Error('Could not start the local connection.');

			const health = await bridge.probe();

			if (!health.healthy) throw Error('Local connection check failed.');
			if (!alive || !app.ready || selected.client !== $.get(client) || selected.model !== $.get(model) || selected.endpoint !== $.get(endpoint)) throw Error('The connection changed. Review your selection and try again.');

			if (selected.client === 'koryphaios') {
				$.set(setupMessage, 'Local gateway ready. In Koryphaios, select Codemax websites. Requires the included Koryphaios integration; no secret was copied.');

				return;
			}

			const credentials = await app.perform('key.reveal');

			if (!credentials) throw Error('Local access key unavailable.');

			const command = privateLaunch(selected.client, selected.endpoint, selected.model, credentials.token, selected.config);

			if (!alive || !app.ready || selected.model !== $.get(model) || selected.client !== $.get(client) || selected.endpoint !== $.get(endpoint)) throw Error('The connection changed before copying. Try again.');

			await bridge.copy(command);
			$.set(setupMessage, 'Launch command copied. Paste it into a terminal in your project. Keep Codemax open.');
		} catch(error) {
			$.set(setupError, true);
			$.set(setupMessage, error instanceof Error ? error.message : String(error), true);
		} finally {
			$.set(setupBusy, false);
		}
	}

	let selectionSignature = '';

	$.user_effect(() => {
		const signature = `${$.get(client)}|${$.get(model)}|${$.get(endpoint)}`;

		if (selectionSignature !== signature) {
			selectionSignature = signature;

			if (!$.get(setupBusy)) $.set(setupMessage, '');
		}
	});

	onDestroy(() => {
		alive = false;
		clearTimeout(timer);
		app.secret = '';
	});

	var fragment = root();
	var section = $.first_child(fragment);
	var div = $.child(section);
	var span = $.child(div);
	let classes;
	var span_1 = $.sibling(span);
	var text = $.child(span_1, true);

	$.reset(span_1);
	$.reset(div);

	var label = $.sibling(div, 2);
	var select = $.sibling($.child(label));

	select.__change = (e) => app.settings({ harness: e.currentTarget.value });

	var option = $.child(select);

	option.value = option.__value = 'koryphaios';

	var option_1 = $.sibling(option);

	option_1.value = option_1.__value = 'opencode';

	var option_2 = $.sibling(option_1);

	option_2.value = option_2.__value = 'claude';

	var option_3 = $.sibling(option_2);

	option_3.value = option_3.__value = 'chat';

	var option_4 = $.sibling(option_3);

	option_4.value = option_4.__value = 'responses';

	var option_5 = $.sibling(option_4);

	option_5.value = option_5.__value = 'messages';
	$.reset(select);

	var select_value;

	$.init_select(select);
	$.reset(label);

	var label_1 = $.sibling(label, 2);
	var select_1 = $.sibling($.child(label_1));

	select_1.__change = (e) => app.clientModel = e.currentTarget.value;

	var node = $.child(select_1);

	{
		var consequent = ($$anchor) => {
			var option_6 = root_1();

			option_6.value = option_6.__value = '';
			$.append($$anchor, option_6);
		};

		$.if(node, ($$render) => {
			if (!$.get(model)) $$render(consequent);
		});
	}

	var node_1 = $.sibling(node);

	$.each(node_1, 17, () => app.exposedModels, (m) => m.id, ($$anchor, m) => {
		var option_7 = root_2();
		var text_1 = $.child(option_7);

		$.reset(option_7);

		var option_7_value = {};

		$.template_effect(() => {
			$.set_text(text_1, `${$.get(m).provider.label ?? ''} / ${$.get(m).display_name ?? ''}`);

			if (option_7_value !== (option_7_value = $.get(m).id)) {
				option_7.value = (option_7.__value = $.get(m).id) ?? '';
			}
		});

		$.append($$anchor, option_7);
	});

	$.reset(select_1);

	var select_1_value;

	$.init_select(select_1);
	$.reset(label_1);

	var node_2 = $.sibling(label_1, 2);

	{
		var consequent_1 = ($$anchor) => {
			var p = root_3();

			$.append($$anchor, p);
		};

		$.if(node_2, ($$render) => {
			if (app.clientModel && !$.get(choice)) $$render(consequent_1);
		});
	}

	var node_3 = $.sibling(node_2, 2);

	{
		var consequent_2 = ($$anchor) => {
			var fragment_1 = root_4();
			var button = $.sibling($.first_child(fragment_1));

			button.__click = () => app.newTab();
			$.append($$anchor, fragment_1);
		};

		var alternate_2 = ($$anchor) => {
			var fragment_2 = root_5();
			var button_1 = $.first_child(fragment_2);

			button_1.__click = prepareAndCopy;

			var node_4 = $.child(button_1);

			{
				var consequent_3 = ($$anchor) => {
					var span_2 = root_6();

					$.append($$anchor, span_2);
				};

				var alternate = ($$anchor) => {
					Icon($$anchor, { name: 'copy', size: 15 });
				};

				$.if(node_4, ($$render) => {
					if ($.get(setupBusy)) $$render(consequent_3); else $$render(alternate, false);
				});
			}

			var text_2 = $.sibling(node_4, 1, true);

			$.reset(button_1);

			var node_5 = $.sibling(button_1, 2);

			{
				var consequent_4 = ($$anchor) => {
					var p_1 = root_8();

					$.append($$anchor, p_1);
				};

				var alternate_1 = ($$anchor) => {
					var fragment_4 = root_9();
					var p_2 = $.first_child(fragment_4);
					var text_3 = $.child(p_2);

					$.reset(p_2);

					var p_3 = $.sibling(p_2, 2);
					var node_6 = $.child(p_3);

					Icon(node_6, { name: 'lock', size: 12 });
					$.next();
					$.reset(p_3);

					$.template_effect(() => $.set_text(text_3, `Starts and checks the gateway. Requires ${$.get(client) === 'opencode'
						? 'OpenCode'
						: $.get(client) === 'claude' ? 'Claude Code' : 'curl'} installed. No provider key, no config file editing.`));

					$.append($$anchor, fragment_4);
				};

				$.if(node_5, ($$render) => {
					if ($.get(client) === 'koryphaios') $$render(consequent_4); else $$render(alternate_1, false);
				});
			}

			$.template_effect(() => {
				button_1.disabled = !app.ready || !$.get(model) || $.get(setupBusy);

				$.set_text(text_2, $.get(setupBusy)
					? 'Preparing…'
					: $.get(client) === 'koryphaios'
						? 'Connect Koryphaios'
						: $.get(client) === 'opencode' || $.get(client) === 'claude'
							? 'Copy private launch command'
							: 'Copy private test request');
			});

			$.append($$anchor, fragment_2);
		};

		$.if(node_3, ($$render) => {
			if (!app.exposedModels.length) $$render(consequent_2); else $$render(alternate_2, false);
		});
	}

	var node_7 = $.sibling(node_3, 2);

	{
		var consequent_5 = ($$anchor) => {
			var p_4 = root_10();
			let classes_1;
			var text_4 = $.child(p_4, true);

			$.reset(p_4);

			$.template_effect(() => {
				classes_1 = $.set_class(p_4, 1, 'setup-result', null, classes_1, { 'danger-text': $.get(setupError) });
				$.set_text(text_4, $.get(setupMessage));
			});

			$.append($$anchor, p_4);
		};

		$.if(node_7, ($$render) => {
			if ($.get(setupMessage)) $$render(consequent_5);
		});
	}

	var node_8 = $.sibling(node_7, 2);

	{
		var consequent_6 = ($$anchor) => {
			var p_5 = root_11();

			$.append($$anchor, p_5);
		};

		$.if(node_8, ($$render) => {
			if ($.get(client) === 'claude') $$render(consequent_6);
		});
	}

	var div_1 = $.sibling(node_8, 2);
	var node_9 = $.child(div_1);

	Icon(node_9, { name: 'globe', size: 14 });
	$.next();
	$.reset(div_1);
	$.reset(section);

	var details = $.sibling(section, 2);
	var div_2 = $.sibling($.child(details), 2);
	var div_3 = $.child(div_2);
	var section_1 = $.child(div_3);
	var div_4 = $.sibling($.child(section_1), 2);

	$.each(div_4, 20, () => ['koryphaios', 'opencode', 'claude'], $.index, ($$anchor, id) => {
		var button_2 = root_12();

		button_2.__click = () => app.settings({ harness: id });

		let classes_2;
		var text_5 = $.child(button_2, true);

		$.reset(button_2);

		$.template_effect(
			($0) => {
				$.set_attribute(button_2, 'aria-pressed', $.get(client) === id);
				button_2.disabled = $0;
				classes_2 = $.set_class(button_2, 1, '', null, classes_2, { active: $.get(client) === id });
				$.set_text(text_5, formatNames[id]);
			},
			[() => !app.ready || app.busy('settings.update')]
		);

		$.append($$anchor, button_2);
	});

	$.reset(div_4);

	var details_1 = $.sibling(div_4, 2);
	var div_5 = $.sibling($.child(details_1));

	$.each(div_5, 20, () => ['chat', 'responses', 'messages'], $.index, ($$anchor, id) => {
		var button_3 = root_13();

		button_3.__click = () => app.settings({ harness: id });

		let classes_3;
		var text_6 = $.child(button_3, true);

		$.reset(button_3);

		$.template_effect(
			($0) => {
				$.set_attribute(button_3, 'aria-pressed', $.get(client) === id);
				button_3.disabled = $0;
				classes_3 = $.set_class(button_3, 1, '', null, classes_3, { active: $.get(client) === id });
				$.set_text(text_6, formatNames[id]);
			},
			[() => !app.ready || app.busy('settings.update')]
		);

		$.append($$anchor, button_3);
	});

	$.reset(div_5);
	$.next();
	$.reset(details_1);

	var label_2 = $.sibling(details_1, 2);
	var select_2 = $.sibling($.child(label_2));

	select_2.__change = (e) => app.clientModel = e.currentTarget.value;

	var node_10 = $.child(select_2);

	{
		var consequent_7 = ($$anchor) => {
			var option_8 = root_14();

			option_8.value = option_8.__value = '';
			$.append($$anchor, option_8);
		};

		$.if(node_10, ($$render) => {
			if (!$.get(model)) $$render(consequent_7);
		});
	}

	var node_11 = $.sibling(node_10);

	$.each(node_11, 17, () => app.exposedModels, (m) => m.id, ($$anchor, m) => {
		var option_9 = root_15();
		var text_7 = $.child(option_9);

		$.reset(option_9);

		var option_9_value = {};

		$.template_effect(() => {
			$.set_text(text_7, `${$.get(m).provider.label ?? ''} / ${$.get(m).display_name ?? ''}`);

			if (option_9_value !== (option_9_value = $.get(m).id)) {
				option_9.value = (option_9.__value = $.get(m).id) ?? '';
			}
		});

		$.append($$anchor, option_9);
	});

	$.reset(select_2);

	var select_2_value;

	$.init_select(select_2);
	$.reset(label_2);

	var node_12 = $.sibling(label_2, 2);

	{
		var consequent_8 = ($$anchor) => {
			var div_6 = root_16();

			$.append($$anchor, div_6);
		};

		$.if(node_12, ($$render) => {
			if (app.clientModel && !$.get(choice)) $$render(consequent_8);
		});
	}

	var node_13 = $.sibling(node_12, 2);

	{
		var consequent_9 = ($$anchor) => {
			var div_7 = root_17();
			var node_14 = $.child(div_7);

			Icon(node_14, { name: 'globe', size: 16 });

			var div_8 = $.sibling(node_14);
			var button_4 = $.sibling($.child(div_8));

			button_4.__click = () => app.navigate('providers');

			var button_5 = $.sibling(button_4, 2);

			button_5.__click = () => app.newTab();
			$.next();
			$.reset(div_8);
			$.reset(div_7);
			$.append($$anchor, div_7);
		};

		$.if(node_13, ($$render) => {
			if (!app.exposedModels.length) $$render(consequent_9);
		});
	}

	$.reset(section_1);

	var section_2 = $.sibling(section_1, 2);
	var div_9 = $.child(section_2);
	var span_3 = $.sibling($.child(div_9));
	let classes_4;
	var span_4 = $.child(span_3);
	let classes_5;
	var text_8 = $.sibling(span_4, 1, true);

	$.reset(span_3);
	$.reset(div_9);

	var div_10 = $.sibling(div_9, 4);
	var node_15 = $.child(div_10);

	{
		var consequent_10 = ($$anchor) => {
			var fragment_5 = root_18();
			var button_6 = $.first_child(fragment_5);

			button_6.__click = probe;

			var text_9 = $.child(button_6, true);

			$.reset(button_6);

			var button_7 = $.sibling(button_6);

			button_7.__click = stop;

			$.template_effect(
				($0) => {
					button_6.disabled = $.get(probing);
					$.set_text(text_9, $.get(probing) ? 'Checking…' : 'Check connection');
					button_7.disabled = $0;
				},
				[() => app.busy('api.stop')]
			);

			$.append($$anchor, fragment_5);
		};

		var alternate_3 = ($$anchor) => {
			var button_8 = root_19();

			button_8.__click = () => app.perform('api.start');

			var text_10 = $.child(button_8, true);

			$.reset(button_8);

			$.template_effect(
				($0, $1) => {
					button_8.disabled = $0;
					$.set_text(text_10, $1);
				},
				[
					() => !app.ready || app.busy('api.start'),
					() => app.busy('api.start') ? 'Starting…' : 'Start gateway'
				]
			);

			$.append($$anchor, button_8);
		};

		$.if(node_15, ($$render) => {
			if ($.get(running)) $$render(consequent_10); else $$render(alternate_3, false);
		});
	}

	var button_9 = $.sibling(node_15);

	button_9.__click = () => app.settingsPage('gateway');
	$.reset(div_10);

	var node_16 = $.sibling(div_10, 2);

	{
		var consequent_11 = ($$anchor) => {
			var p_6 = root_20();
			let classes_6;
			var text_11 = $.child(p_6);

			$.reset(p_6);

			$.template_effect(() => {
				classes_6 = $.set_class(p_6, 1, 'connection-result', null, classes_6, { 'danger-text': $.get(probeFailed) });
				$.set_text(text_11, `${$.get(probeMessage) ?? ''} Website access and client interoperability are separate checks.`);
			});

			$.append($$anchor, p_6);
		};

		$.if(node_16, ($$render) => {
			if ($.get(probeMessage)) $$render(consequent_11);
		});
	}

	$.reset(section_2);

	var section_3 = $.sibling(section_2, 2);
	var div_11 = $.child(section_3);
	var h2 = $.child(div_11);
	var text_12 = $.child(h2);

	$.reset(h2);

	var node_17 = $.sibling(h2);

	{
		var consequent_12 = ($$anchor) => {
			var button_10 = root_21();

			button_10.__click = () => app.export('opencode.json', $.get(config));

			var node_18 = $.child(button_10);

			Icon(node_18, { name: 'download', size: 14 });
			$.next();
			$.reset(button_10);
			$.template_effect(() => button_10.disabled = !app.ready || !$.get(model));
			$.append($$anchor, button_10);
		};

		$.if(node_17, ($$render) => {
			if ($.get(client) === 'opencode') $$render(consequent_12);
		});
	}

	$.reset(div_11);

	var node_19 = $.sibling(div_11, 2);

	{
		var consequent_16 = ($$anchor) => {
			var fragment_6 = root_22();
			var p_7 = $.first_child(fragment_6);
			var text_13 = $.child(p_7, true);

			$.reset(p_7);

			var div_12 = $.sibling(p_7, 2);
			var div_13 = $.child(div_12);
			var node_20 = $.child(div_13);

			{
				let $0 = $.derived(() => $.get(client) === 'opencode' ? 'folder' : 'terminal');

				Icon(node_20, {
					get name() {
						return $.get($0);
					},
					size: 13
				});
			}

			var span_5 = $.sibling(node_20);
			var text_14 = $.child(span_5, true);

			$.reset(span_5);

			var button_11 = $.sibling(span_5);

			button_11.__click = () => app.clipboard($.get(snippet));

			var node_21 = $.child(button_11);

			Icon(node_21, { name: 'copy', size: 13 });
			$.next();
			$.reset(button_11);
			$.reset(div_13);

			var pre = $.sibling(div_13);
			var text_15 = $.child(pre, true);

			$.reset(pre);
			$.reset(div_12);

			var node_22 = $.sibling(div_12, 2);

			{
				var consequent_13 = ($$anchor) => {
					var div_14 = root_23();
					var div_15 = $.child(div_14);
					var node_23 = $.child(div_15);

					Icon(node_23, { name: 'terminal', size: 13 });

					var button_12 = $.sibling(node_23, 2);

					button_12.__click = () => app.clipboard(startCommand);
					$.reset(div_15);

					var pre_1 = $.sibling(div_15);

					pre_1.textContent = 'read -rsp \'Codemax local key: \' CODEMAX_API_KEY; echo\nexport CODEMAX_API_KEY\nopencode';
					$.reset(div_14);
					$.template_effect(() => button_12.disabled = !app.ready);
					$.append($$anchor, div_14);
				};

				$.if(node_22, ($$render) => {
					if ($.get(client) === 'opencode') $$render(consequent_13);
				});
			}

			var node_24 = $.sibling(node_22, 2);

			{
				var consequent_14 = ($$anchor) => {
					var div_16 = root_24();
					var button_13 = $.child(div_16);

					button_13.__click = copyKey;

					var node_25 = $.child(button_13);

					Icon(node_25, { name: 'key', size: 14 });
					$.next();
					$.reset(button_13);
					$.next();
					$.reset(div_16);
					$.template_effect(($0) => button_13.disabled = $0, [() => !app.ready || app.busy('key.reveal')]);
					$.append($$anchor, div_16);
				};

				$.if(node_24, ($$render) => {
					if ($.get(client) !== 'koryphaios') $$render(consequent_14);
				});
			}

			var node_26 = $.sibling(node_24, 2);

			{
				var consequent_15 = ($$anchor) => {
					var div_17 = root_25();
					var node_27 = $.child(div_17);

					Icon(node_27, { name: 'alert', size: 16 });
					$.next();
					$.reset(div_17);
					$.append($$anchor, div_17);
				};

				$.if(node_26, ($$render) => {
					if ($.get(client) === 'claude') $$render(consequent_15);
				});
			}

			$.template_effect(() => {
				$.set_text(text_13, $.get(client) === 'koryphaios'
					? 'The gateway publishes a private connection descriptor for Koryphaios. Metadata is refreshed with a short, authorization-scoped cache.'
					: $.get(client) === 'opencode'
						? 'Save this in your project, or merge the provider entry into your existing opencode.json. Do not replace an existing configuration without reviewing it.'
						: $.get(client) === 'claude'
							? 'Run this in a Bash terminal, then paste the copied local key at the prompt. It only changes that terminal’s environment.'
							: 'Run this example in a Bash terminal and paste the copied local key at the prompt.');

				$.set_text(text_14, $.get(filename));
				button_11.disabled = !app.ready;
				$.set_text(text_15, $.get(snippet));
			});

			$.append($$anchor, fragment_6);
		};

		var alternate_4 = ($$anchor) => {
			var p_8 = root_26();

			$.append($$anchor, p_8);
		};

		$.if(node_19, ($$render) => {
			if ($.get(model)) $$render(consequent_16); else $$render(alternate_4, false);
		});
	}

	var details_2 = $.sibling(node_19, 2);
	var label_3 = $.sibling($.child(details_2), 2);
	var div_18 = $.sibling($.child(label_3));
	var code = $.child(div_18);
	var text_16 = $.child(code, true);

	$.reset(code);

	var button_14 = $.sibling(code);

	button_14.__click = () => app.clipboard($.get(client) === 'claude' || $.get(client) === 'messages' ? $.get(endpoint) : `${$.get(endpoint)}/v1`);

	var node_28 = $.child(button_14);

	Icon(node_28, { name: 'copy', size: 14 });
	$.reset(button_14);
	$.reset(div_18);
	$.reset(label_3);

	var div_19 = $.sibling(label_3, 2);
	var div_20 = $.sibling($.child(div_19));
	var code_1 = $.child(div_20);
	var text_17 = $.child(code_1, true);

	$.reset(code_1);

	var button_15 = $.sibling(code_1);

	button_15.__click = reveal;

	var node_29 = $.child(button_15);

	{
		let $0 = $.derived(() => app.secret ? 'close' : 'eye');

		Icon(node_29, {
			get name() {
				return $.get($0);
			},
			size: 15
		});
	}

	$.reset(button_15);

	var button_16 = $.sibling(button_15);

	button_16.__click = copyKey;

	var node_30 = $.child(button_16);

	Icon(node_30, { name: 'copy', size: 14 });
	$.reset(button_16);
	$.reset(div_20);
	$.next();
	$.reset(div_19);
	$.next(2);
	$.reset(details_2);
	$.reset(section_3);
	$.reset(div_3);

	var aside = $.sibling(div_3, 2);
	var button_17 = $.sibling($.child(aside), 3);

	button_17.__click = () => app.navigate('sessions');

	var node_31 = $.sibling($.child(button_17));

	Icon(node_31, { name: 'arrow', size: 13 });
	$.reset(button_17);

	var button_18 = $.sibling(button_17, 4);

	button_18.__click = () => app.navigate('tools');

	var node_32 = $.sibling($.child(button_18));

	Icon(node_32, { name: 'arrow', size: 13 });
	$.reset(button_18);
	$.next(2);
	$.reset(aside);
	$.reset(div_2);
	$.reset(details);

	$.template_effect(
		($0) => {
			classes = $.set_class(span, 1, 'dot', null, classes, { online: $.get(running) });

			$.set_text(text, !app.ready
				? 'Reconnect Codemax to continue'
				: $.get(running) ? 'Local gateway ready' : 'Ready to set up');

			select.disabled = !app.ready || $.get(setupBusy);

			if (select_value !== (select_value = $.get(client))) {
				(
					select.value = (select.__value = $.get(client)) ?? '',
					$.select_option(select, $.get(client))
				);
			}

			select_1.disabled = !app.ready || $.get(setupBusy) || !app.exposedModels.length;

			if (select_1_value !== (select_1_value = app.clientModel || $.get(model))) {
				(
					select_1.value = (select_1.__value = app.clientModel || $.get(model)) ?? '',
					$.select_option(select_1, app.clientModel || $.get(model))
				);
			}

			details_1.open = $0;
			select_2.disabled = !app.ready || !app.exposedModels.length;

			if (select_2_value !== (select_2_value = app.clientModel || $.get(model))) {
				(
					select_2.value = (select_2.__value = app.clientModel || $.get(model)) ?? '',
					$.select_option(select_2, app.clientModel || $.get(model))
				);
			}

			classes_4 = $.set_class(span_3, 1, 'tag', null, classes_4, { ready: $.get(running) });
			classes_5 = $.set_class(span_4, 1, 'dot', null, classes_5, { online: $.get(running) });
			$.set_text(text_8, !app.ready ? 'Disconnected' : $.get(running) ? 'Ready' : 'Stopped');
			$.set_text(text_12, `3. Configure ${formatNames[$.get(client)] ?? ''}`);
			$.set_text(text_16, $.get(client) === 'claude' || $.get(client) === 'messages' ? $.get(endpoint) : `${$.get(endpoint)}/v1`);
			button_14.disabled = !app.ready;
			$.set_text(text_17, app.secret || 'Hidden — reveal or copy explicitly');
			$.set_attribute(button_15, 'aria-label', app.secret ? 'Hide API key' : 'Reveal API key');
			button_15.disabled = !app.ready;
			button_16.disabled = !app.ready;
		},
		[
			() => ['chat', 'responses', 'messages'].includes($.get(client))
		]
	);

	$.append($$anchor, fragment);
	$.pop();
}

$.delegate(['change', 'click']);