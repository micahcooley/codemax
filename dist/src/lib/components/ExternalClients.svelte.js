import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';
import { onDestroy } from '../../../runtime/svelte_svelte.js';
import { app } from '../state/app.svelte.js';
import * as bridge from '../api/bridge.js';
import Icon from './Icon.svelte.js';
import { privateLaunch, buildOpencodeConfig } from '../launch-command.js';
import { catalogLookup, formatTokens, formatPlans } from '../model-catalog.js';
import { modelReady, modelStatus } from '../format.js';

var root = $.from_html(`<option>Choose an available model</option>`);
var root_1 = $.from_html(`<option> </option>`);
var root_2 = $.from_html(` <!>`, 1);
var root_3 = $.from_html(`<p class="field-hint"> <!><!><!>.</p>`);
var root_4 = $.from_html(`<p class="note warning">Your selected model is unavailable. Choose another explicitly; no automatic replacement.</p>`);
var root_5 = $.from_html(`<div class="note"><!><div>The local gateway needs the Zag backend (Linux x86_64). On this Mac, Codemax browses, signs in, and lists observed website models; coding-client connections stay off.</div></div>`);
var root_6 = $.from_html(`<p class="connect-empty">Visit an AI chat website and sign in. Your available models appear here automatically.</p><button class="secondary">Browse a website</button>`, 1);
var root_7 = $.from_html(`<span class="spinner"></span>`);
var root_8 = $.from_html(`<button class="secondary"><!>Copy opencode config</button> <p class="field-hint">The codemax provider with every included model — no launch command. Merge it once (see below), export the key once, then just run opencode.</p>`, 1);
var root_9 = $.from_html(`<p class="field-hint">The included Koryphaios integration discovers this gateway and its available models on this computer. Existing installations need the integration applied first.</p>`);
var root_10 = $.from_html(`<p class="field-hint"> </p> <p class="private-command-note"><!>Includes your local access key. Paste only into your terminal; clipboard and terminal history may retain it.</p>`, 1);
var root_11 = $.from_html(`<button class="primary launch-connect"><!> </button> <!> <!>`, 1);
var root_12 = $.from_html(`<p role="status"> </p>`);
var root_13 = $.from_html(`<p class="field-hint compatibility-note">Non-Claude website models may not support every Claude Code feature. This does not certify vendor compatibility.</p>`);
var root_14 = $.from_html(`<button> </button>`);
var root_15 = $.from_html(`<option>Select an available model</option>`);
var root_16 = $.from_html(`<div class="note warning" role="status">Your previous selection is no longer available. Choose a model above; Codemax will not switch it silently.</div>`);
var root_17 = $.from_html(`<div class="note"><!><div>There are no ready, enabled models yet. <button class="text-button">Review providers</button> or <button class="text-button">open a website</button>.</div></div>`);
var root_18 = $.from_html(`<p>The local gateway is part of the Zag backend, which runs on Linux x86_64. In browsing-only mode there is nothing to start here; website browsing and model detection above keep working.</p>`);
var root_19 = $.from_html(`<button class="secondary"> </button><button class="text-button">Stop gateway</button>`, 1);
var root_20 = $.from_html(`<button class="primary"> </button>`);
var root_21 = $.from_html(`<p>Your client talks to Codemax on this computer. Codemax sends requests through your signed-in website—not a paid provider API.</p> <div class="button-group" style="margin-top:15px"><!><button class="text-button">Gateway settings</button></div>`, 1);
var root_22 = $.from_html(`<button class="text-button"><!>Save config</button>`);
var root_23 = $.from_html(`<label class="setting-line"><div><strong> </strong><p> </p></div><input type="checkbox"/></label>`);
var root_24 = $.from_html(`<p class="note warning">None of the selected models are currently servable by the local gateway. The config still saves; requests will fail until a website session is ready.</p>`);
var root_25 = $.from_html(`<p class="note warning">The default website model is not included above. Include it or choose another default.</p>`);
var root_26 = $.from_html(`<div class="field"><span>Models to include in opencode.json</span> <p class="field-hint">Choose every website model OpenCode may use — the provider carries the whole set. An explicitly chosen default above must stay included and is never replaced silently; otherwise the first included model is the default.</p></div> <!> <!> <!>`, 1);
var root_27 = $.from_html(`<p class="field-hint">To skip launch commands: save the config once, merge it with <code>node scripts/opencode-merge.mjs --from opencode.json</code> (backs up first, keeps your other providers), and export <code>CODEMAX_API_KEY</code> once in your shell profile.</p>`);
var root_28 = $.from_html(`<label class="field"><span>Endpoint URL</span><div class="readout"><code> </code><button class="icon-button" aria-label="Copy custom API endpoint"><!></button></div><span class="field-hint"> </span></label> <div class="field"><span>API key · local gateway token</span><div class="readout"><code> </code><button class="icon-button"><!></button><button class="icon-button" aria-label="Copy custom API key"><!></button></div><span class="field-hint">Send as <code>Authorization: Bearer</code> — the same key the example request uses. Revealed keys disappear after 30 seconds or when you leave this page.</span></div>`, 1);
var root_29 = $.from_html(`<div class="code-panel launch-command"><div class="code-heading"><!><span>Start OpenCode · Bash</span><button class="text-button">Copy setup command</button></div><pre></pre></div>`);
var root_30 = $.from_html(`<div class="button-group" style="margin-top:14px"><button class="secondary"><!>Copy local key</button><span class="field-hint">Paste at the terminal prompt. It will not be displayed or saved in the config.</span></div>`);
var root_31 = $.from_html(`<div class="note"><!><span>This non-Claude model connection is not vendor-supported. Actual compatibility depends on the website model and Claude Code’s protocol requirements.</span></div>`);
var root_32 = $.from_html(`<p class="connection-instruction"> </p> <!> <div class="code-panel"><div class="code-heading"><!><span> </span><button class="text-button"><!>Copy</button></div><pre> </pre></div> <!> <!> <!> <!>`, 1);
var root_33 = $.from_html(`<p class="muted">Configuration appears when a website model is ready. Nothing needs to be copied yet.</p>`);
var root_34 = $.from_html(`<section class="quick-connect" aria-label="Simple client connection"><div class="quick-connection-status"><span></span><span> </span></div> <label class="field"><span>Coding client</span><select aria-label="Quick coding client"><option>Koryphaios</option><option>OpenCode</option><option>Claude Code</option><option>Other · Chat Completions</option><option>Other · Responses API</option><option>Other · Messages API</option></select></label> <label class="field"><span>Website model</span><select aria-label="Quick website model"><!><!></select></label> <!> <!> <!> <!> <!> <!> <div class="connect-checklist"><!><span>Website account → Codemax → your coding client</span></div></section> <details class="connection-advanced" aria-label="Advanced client configuration"><summary>Advanced setup and connection details</summary> <div class="connection-layout"><div class="connection-main"><section class="section"><div class="section-title"><h2>1. Choose your client</h2><span class="tag">Website quota</span></div> <div class="segmented" aria-label="Client format"></div> <details class="advanced-client client-formats"><summary>Other clients · protocol examples</summary><div class="segmented"></div><p class="field-hint">Use a protocol your client supports. These are example requests, not one-click installers.</p></details> <label class="field"><span>Website model</span><select aria-label="Client model"><!><!></select></label> <!> <!></section> <section class="section"><div class="section-title"><h2>2. Start the local connection</h2><span><span></span> </span></div> <!> <!></section> <section class="section"><div class="section-title"><h2> </h2><!></div> <!> <!> <details class="advanced-client"><summary>Manual connection details · endpoint and local access token</summary> <label class="field"><span>Local gateway endpoint</span><div class="readout"><code> </code><button class="icon-button" aria-label="Copy API endpoint"><!></button></div></label> <div class="field"><span>Local access token · not a provider credential</span><div class="readout"><code> </code><button class="icon-button"><!></button><button class="icon-button" aria-label="Copy API key"><!></button></div><span class="field-hint">Revealed keys disappear after 30 seconds or when you leave this page.</span></div> <p class="field-hint">Use the same session identifier for continuation. Some clients cache their model catalog; refresh or update their config after changing exposed models.</p></details></section></div> <aside class="connection-help"><h3>What happens next</h3><p>Keep Codemax running. Select your website model in the client and send a request.</p><p>The website tab’s ring spins while working and stays still when idle.</p><button class="text-button">View client sessions<!></button><hr/><h3>Who runs tools?</h3><p>Your coding client runs tools using its own permissions. Codemax’s separate website tool tasks require MCP setup and your approval.</p><button class="text-button">Tools & permissions<!></button><hr/><p class="field-hint">Website quotas still apply. No sign-in credentials are copied out of the browser.</p></aside></div></details>`, 1);

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

	const docs = $.derived(() => $.get(choice)
		? catalogLookup($.get(choice).id, $.get(choice).display_name)
		: null);

	const model = $.derived(() => $.get(choice)?.id || '');
	const running = $.derived(() => app.ready && app.snapshot?.api.running === true);
	const fallback = $.derived(() => app.host.code === 'FALLBACK_MODE');

	const formatNames = {
		koryphaios: 'Koryphaios',
		opencode: 'OpenCode',
		claude: 'Claude Code',
		chat: 'Chat API',
		responses: 'Responses API',
		messages: 'Messages API'
	};

	// Multi-choice opencode model set. Auto-selection mirrors the exposed
	// registry; once the user toggles anything explicitly, that manual set
	// rules (pruned only when models disappear). Explicit picks may include
	// observed-but-not-yet-servable models so fallback browsing can still
	// produce a config; the gateway refuses unservable models at request time.
	let picked = $.state($.proxy([]));

	let pickerTouched = $.state(false);

	$.user_effect(() => {
		const valid = new Set(app.models.map((m) => m.id));

		if (!$.get(pickerTouched)) {
			const auto = app.exposedModels.map((m) => m.id).filter((id) => valid.has(id));

			if (auto.join(' ') !== $.get(picked).join(' ')) $.set(picked, auto, true);
		} else if ($.get(picked).some((id) => !valid.has(id))) $.set(picked, $.get(picked).filter((id) => valid.has(id)), true);
	});

	const included = $.derived(() => app.models.filter((m) => $.get(picked).includes(m.id)));

	// Default model for opencode.json. The provider always carries the whole
	// multi-selected set; the default is just a starting point. An explicit
	// single-model choice is never silently replaced: when it is set but
	// unavailable (or not included) there is no default and saving disables.
	// With no explicit choice the default is the auto choice when included,
	// otherwise the first included model.
	const opencodeDefault = $.derived(() => app.clientModel
		? $.get(model)
		: $.get(model) && $.get(picked).includes($.get(model)) ? $.get(model) : $.get(picked)[0] || '');

	const defaultIncluded = $.derived(() => !$.get(opencodeDefault) || $.get(included).some((m) => m.id === $.get(opencodeDefault)));
	const opencodeValid = $.derived(() => !!$.get(opencodeDefault) && $.get(included).length > 0 && (!app.clientModel || $.get(defaultIncluded)));

	const config = $.derived(() => {
		if ($.get(client) !== 'opencode' || !$.get(opencodeValid)) return {
			$schema: 'https://opencode.ai/config.json',
			model: '',
			provider: {
				codemax: {
					npm: '@ai-sdk/openai-compatible',
					name: 'Codemax websites',
					options: {
						baseURL: `${$.get(endpoint)}/v1`,
						apiKey: '{env:CODEMAX_API_KEY}'
					},
					models: {}
				}
			}
		};

		return buildOpencodeConfig($.get(endpoint), $.get(opencodeDefault), $.get(included).map((m) => ({
			id: m.id,
			providerLabel: m.provider.label,
			displayName: m.display_name
		})));
	});

	function togglePick(id, on) {
		$.set(pickerTouched, true);

		$.set(
			picked,
			on
				? $.get(picked).includes(id) ? $.get(picked) : [...$.get(picked), id]
				: $.get(picked).filter((x) => x !== id),
			true
		);
	}

	const filename = $.derived(() => $.get(client) === 'koryphaios'
		? 'Automatic local connection'
		: $.get(client) === 'opencode'
			? 'opencode.json'
			: $.get(client) === 'claude'
				? 'Start Claude Code · Bash'
				: 'Streaming request · Bash');

	const snippet = $.derived(() => {
		const id = $.get(client) === 'opencode' ? $.get(opencodeDefault) : $.get(model);

		if (!id) return '';
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

	async function copyOpencodeConfig() {
		if (!app.ready || !$.get(opencodeValid)) return;

		await app.clipboard(JSON.stringify($.get(config), null, 2));
	}

	async function prepareAndCopy() {
		const need = $.get(client) === 'opencode' ? $.get(opencodeDefault) : $.get(model);

		if ($.get(setupBusy) || !app.ready || !need) return;
		if ($.get(client) === 'opencode' && (!$.get(opencodeValid) || app.clientModel && !$.get(choice))) return;

		const selected = {
			client: $.get(client),
			model: need,
			endpoint: $.get(endpoint),
			config: $.get(config)
		};

		$.set(setupBusy, true);
		$.set(setupError, false);
		$.set(setupMessage, 'Checking the local connection…');

		try {
			if ($.get(fallback)) throw Error('The local gateway needs the Zag backend, which runs on Linux x86_64. This Mac runs browsing-only mode: browse, sign in, and detect website models here.');
			if (!$.get(running) && await app.perform('api.start') === undefined) throw Error('Could not start the local connection.');

			const health = await bridge.probe();

			if (!health.healthy) throw Error('Local connection check failed.');
			if (!alive || !app.ready || selected.client !== $.get(client) || selected.model !== need || selected.endpoint !== $.get(endpoint)) throw Error('The connection changed. Review your selection and try again.');
			if ($.get(client) === 'opencode' && !$.get(opencodeValid)) throw Error('The selected opencode models changed. Review the include list and try again.');

			if (selected.client === 'koryphaios') {
				$.set(setupMessage, 'Local gateway ready. In Koryphaios, select Codemax websites. Requires the included Koryphaios integration; no secret was copied.');

				return;
			}

			const credentials = await app.perform('key.reveal');

			if (!credentials) throw Error('Local access key unavailable.');

			const command = privateLaunch(selected.client, selected.endpoint, selected.model, credentials.token, selected.config);

			if (!alive || !app.ready || selected.model !== need || selected.client !== $.get(client) || selected.endpoint !== $.get(endpoint)) throw Error('The connection changed before copying. Try again.');

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

	var fragment = root_34();
	var section = $.first_child(fragment);
	var div = $.child(section);
	var span = $.child(div);
	let classes;
	var span_1 = $.sibling(span);
	var text = $.only_child(span_1, true);

	$.reset(div);

	var label = $.sibling(div, 2);
	var select = $.sibling($.child(label));
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
	var node = $.child(select_1);

	{
		var consequent = ($$anchor) => {
			var option_6 = root();

			option_6.value = option_6.__value = '';
			$.append($$anchor, option_6);
		};

		$.if(node, ($$render) => {
			if (!$.get(model)) $$render(consequent);
		});
	}

	var node_1 = $.sibling(node);

	$.each(node_1, 17, () => app.exposedModels, (m) => m.id, ($$anchor, m) => {
		var option_7 = root_1();
		var text_1 = $.only_child(option_7);
		var option_7_value = {};

		$.template_effect(() => {
			$.set_text(text_1, `${$.get(m).provider.label ?? ''} / ${$.get(m).display_name ?? ''}`);

			if (option_7_value !== (option_7_value = $.get(m).id)) {
				option_7.value = (option_7.__value = option_7_value) ?? '';
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
		var consequent_6 = ($$anchor) => {
			var p = root_3();
			var text_2 = $.child(p);
			var node_3 = $.sibling(text_2);

			{
				var consequent_1 = ($$anchor) => {
					var text_3 = $.text();

					$.template_effect(($0) => $.set_text(text_3, `${$0 ?? ''} context (advertised; website budget unmeasured)`), [() => formatTokens($.get(docs).contextTokens)]);
					$.append($$anchor, text_3);
				};

				$.if(node_3, ($$render) => {
					if ($.get(docs).contextTokens) $$render(consequent_1);
				});
			}

			var node_4 = $.sibling(node_3);

			{
				var consequent_3 = ($$anchor) => {
					var fragment_2 = root_2();
					var text_4 = $.first_child(fragment_2);
					var node_5 = $.sibling(text_4);

					{
						var consequent_2 = ($$anchor) => {
							var text_5 = $.text();

							$.template_effect(() => $.set_text(text_5, `· ${$.get(docs).reasoningNote ?? ''}`));
							$.append($$anchor, text_5);
						};

						$.if(node_5, ($$render) => {
							if ($.get(docs).reasoningNote) $$render(consequent_2);
						});
					}

					$.template_effect(() => $.set_text(text_4, `· reasoning ${$.get(docs).reasoning ? 'supported' : 'not advertised'}`));
					$.append($$anchor, fragment_2);
				};

				$.if(node_4, ($$render) => {
					if ($.get(docs).reasoning !== null) $$render(consequent_3);
				});
			}

			var node_6 = $.sibling(node_4);

			{
				var consequent_5 = ($$anchor) => {
					var fragment_4 = root_2();
					var text_6 = $.first_child(fragment_4);
					var node_7 = $.sibling(text_6);

					{
						var consequent_4 = ($$anchor) => {
							var text_7 = $.text();

							$.template_effect(() => $.set_text(text_7, `(${$.get(docs).planNote ?? ''})`));
							$.append($$anchor, text_7);
						};

						$.if(node_7, ($$render) => {
							if ($.get(docs).planNote) $$render(consequent_4);
						});
					}

					$.template_effect(($0) => $.set_text(text_6, `· exposed on ${$0 ?? ''}`), [() => formatPlans($.get(docs).plans)]);
					$.append($$anchor, fragment_4);
				};

				$.if(node_6, ($$render) => {
					if ($.get(docs).plans) $$render(consequent_5);
				});
			}

			$.next();
			$.reset(p);
			$.template_effect(() => $.set_text(text_2, `Vendor docs${$.get(docs).contextSource ? ` · ${$.get(docs).contextSource.retrieved}` : ''}:`));
			$.append($$anchor, p);
		};

		$.if(node_2, ($$render) => {
			if ($.get(docs) && ($.get(docs).contextTokens || $.get(docs).reasoning !== null)) $$render(consequent_6);
		});
	}

	var node_8 = $.sibling(node_2, 2);

	{
		var consequent_7 = ($$anchor) => {
			var p_1 = root_4();

			$.append($$anchor, p_1);
		};

		$.if(node_8, ($$render) => {
			if (app.clientModel && !$.get(choice)) $$render(consequent_7);
		});
	}

	var node_9 = $.sibling(node_8, 2);

	{
		var consequent_8 = ($$anchor) => {
			var div_1 = root_5();
			var node_10 = $.child(div_1);

			Icon(node_10, { name: 'globe', size: 16 });
			$.next();
			$.reset(div_1);
			$.append($$anchor, div_1);
		};

		$.if(node_9, ($$render) => {
			if ($.get(fallback)) $$render(consequent_8);
		});
	}

	var node_11 = $.sibling(node_9, 2);

	{
		var consequent_9 = ($$anchor) => {
			var fragment_6 = root_6();
			var button = $.sibling($.first_child(fragment_6));

			$.delegated('click', button, () => app.newTab());
			$.append($$anchor, fragment_6);
		};

		var alternate_2 = ($$anchor) => {
			var fragment_7 = root_11();
			var button_1 = $.first_child(fragment_7);
			var node_12 = $.child(button_1);

			{
				var consequent_10 = ($$anchor) => {
					var span_2 = root_7();

					$.append($$anchor, span_2);
				};

				var alternate = ($$anchor) => {
					Icon($$anchor, { name: 'copy', size: 15 });
				};

				$.if(node_12, ($$render) => {
					if ($.get(setupBusy)) $$render(consequent_10); else $$render(alternate, -1);
				});
			}

			var text_8 = $.sibling(node_12, 1, true);

			$.reset(button_1);

			var node_13 = $.sibling(button_1, 2);

			{
				var consequent_11 = ($$anchor) => {
					var fragment_9 = root_8();
					var button_2 = $.first_child(fragment_9);
					var node_14 = $.child(button_2);

					Icon(node_14, { name: 'copy', size: 14 });
					$.next();
					$.reset(button_2);
					$.next(2);
					$.template_effect(() => button_2.disabled = !app.ready || !$.get(opencodeValid));
					$.delegated('click', button_2, copyOpencodeConfig);
					$.append($$anchor, fragment_9);
				};

				$.if(node_13, ($$render) => {
					if ($.get(client) === 'opencode') $$render(consequent_11);
				});
			}

			var node_15 = $.sibling(node_13, 2);

			{
				var consequent_12 = ($$anchor) => {
					var p_2 = root_9();

					$.append($$anchor, p_2);
				};

				var alternate_1 = ($$anchor) => {
					var fragment_10 = root_10();
					var p_3 = $.first_child(fragment_10);
					var text_9 = $.only_child(p_3);
					var p_4 = $.sibling(p_3, 2);
					var node_16 = $.child(p_4);

					Icon(node_16, { name: 'lock', size: 12 });
					$.next();
					$.reset(p_4);

					$.template_effect(() => $.set_text(text_9, `Starts and checks the gateway. Requires ${$.get(client) === 'opencode'
						? 'OpenCode'
						: $.get(client) === 'claude' ? 'Claude Code' : 'curl'} installed. No provider key, no config file editing.`));

					$.append($$anchor, fragment_10);
				};

				$.if(node_15, ($$render) => {
					if ($.get(client) === 'koryphaios') $$render(consequent_12); else $$render(alternate_1, -1);
				});
			}

			$.template_effect(() => {
				button_1.disabled = !app.ready || $.get(setupBusy) || $.get(fallback) || ($.get(client) === 'opencode' ? !$.get(opencodeValid) : !$.get(model));
				$.set_attribute(button_1, 'title', $.get(fallback) ? 'Unavailable in browsing-only mode' : undefined);

				$.set_text(text_8, $.get(setupBusy)
					? 'Preparing…'
					: $.get(client) === 'koryphaios'
						? 'Connect Koryphaios'
						: $.get(client) === 'opencode' || $.get(client) === 'claude'
							? 'Copy private launch command'
							: 'Copy private test request');
			});

			$.delegated('click', button_1, prepareAndCopy);
			$.append($$anchor, fragment_7);
		};

		$.if(node_11, ($$render) => {
			if (!app.models.length) $$render(consequent_9); else $$render(alternate_2, -1);
		});
	}

	var node_17 = $.sibling(node_11, 2);

	{
		var consequent_13 = ($$anchor) => {
			var p_5 = root_12();
			let classes_1;
			var text_10 = $.only_child(p_5, true);

			$.template_effect(() => {
				classes_1 = $.set_class(p_5, 1, 'setup-result', null, classes_1, { 'danger-text': $.get(setupError) });
				$.set_text(text_10, $.get(setupMessage));
			});

			$.append($$anchor, p_5);
		};

		$.if(node_17, ($$render) => {
			if ($.get(setupMessage)) $$render(consequent_13);
		});
	}

	var node_18 = $.sibling(node_17, 2);

	{
		var consequent_14 = ($$anchor) => {
			var p_6 = root_13();

			$.append($$anchor, p_6);
		};

		$.if(node_18, ($$render) => {
			if ($.get(client) === 'claude') $$render(consequent_14);
		});
	}

	var div_2 = $.sibling(node_18, 2);
	var node_19 = $.child(div_2);

	Icon(node_19, { name: 'globe', size: 14 });
	$.next();
	$.reset(div_2);
	$.reset(section);

	var details = $.sibling(section, 2);
	var div_3 = $.sibling($.child(details), 2);
	var div_4 = $.child(div_3);
	var section_1 = $.child(div_4);
	var div_5 = $.sibling($.child(section_1), 2);

	$.each(div_5, 20, () => ['koryphaios', 'opencode', 'claude'], $.index, ($$anchor, id) => {
		var button_3 = root_14();
		let classes_2;
		var text_11 = $.only_child(button_3, true);

		$.template_effect(
			($0) => {
				$.set_attribute(button_3, 'aria-pressed', $.get(client) === id);
				button_3.disabled = $0;
				classes_2 = $.set_class(button_3, 1, '', null, classes_2, { active: $.get(client) === id });
				$.set_text(text_11, formatNames[id]);
			},
			[() => !app.ready || app.busy('settings.update')]
		);

		$.delegated('click', button_3, () => app.settings({ harness: id }));
		$.append($$anchor, button_3);
	});

	$.reset(div_5);

	var details_1 = $.sibling(div_5, 2);
	var div_6 = $.sibling($.child(details_1));

	$.each(div_6, 20, () => ['chat', 'responses', 'messages'], $.index, ($$anchor, id) => {
		var button_4 = root_14();
		let classes_3;
		var text_12 = $.only_child(button_4, true);

		$.template_effect(
			($0) => {
				$.set_attribute(button_4, 'aria-pressed', $.get(client) === id);
				button_4.disabled = $0;
				classes_3 = $.set_class(button_4, 1, '', null, classes_3, { active: $.get(client) === id });
				$.set_text(text_12, formatNames[id]);
			},
			[() => !app.ready || app.busy('settings.update')]
		);

		$.delegated('click', button_4, () => app.settings({ harness: id }));
		$.append($$anchor, button_4);
	});

	$.reset(div_6);
	$.next();
	$.reset(details_1);

	var label_2 = $.sibling(details_1, 2);
	var select_2 = $.sibling($.child(label_2));
	var node_20 = $.child(select_2);

	{
		var consequent_15 = ($$anchor) => {
			var option_8 = root_15();

			option_8.value = option_8.__value = '';
			$.append($$anchor, option_8);
		};

		$.if(node_20, ($$render) => {
			if (!$.get(model)) $$render(consequent_15);
		});
	}

	var node_21 = $.sibling(node_20);

	$.each(node_21, 17, () => app.exposedModels, (m) => m.id, ($$anchor, m) => {
		var option_9 = root_1();
		var text_13 = $.only_child(option_9);
		var option_9_value = {};

		$.template_effect(() => {
			$.set_text(text_13, `${$.get(m).provider.label ?? ''} / ${$.get(m).display_name ?? ''}`);

			if (option_9_value !== (option_9_value = $.get(m).id)) {
				option_9.value = (option_9.__value = option_9_value) ?? '';
			}
		});

		$.append($$anchor, option_9);
	});

	$.reset(select_2);

	var select_2_value;

	$.init_select(select_2);
	$.reset(label_2);

	var node_22 = $.sibling(label_2, 2);

	{
		var consequent_16 = ($$anchor) => {
			var div_7 = root_16();

			$.append($$anchor, div_7);
		};

		$.if(node_22, ($$render) => {
			if (app.clientModel && !$.get(choice)) $$render(consequent_16);
		});
	}

	var node_23 = $.sibling(node_22, 2);

	{
		var consequent_17 = ($$anchor) => {
			var div_8 = root_17();
			var node_24 = $.child(div_8);

			Icon(node_24, { name: 'globe', size: 16 });

			var div_9 = $.sibling(node_24);
			var button_5 = $.sibling($.child(div_9));
			var button_6 = $.sibling(button_5, 2);

			$.next();
			$.reset(div_9);
			$.reset(div_8);
			$.delegated('click', button_5, () => app.navigate('providers'));
			$.delegated('click', button_6, () => app.newTab());
			$.append($$anchor, div_8);
		};

		$.if(node_23, ($$render) => {
			if (!app.exposedModels.length) $$render(consequent_17);
		});
	}

	$.reset(section_1);

	var section_2 = $.sibling(section_1, 2);
	var div_10 = $.child(section_2);
	var span_3 = $.sibling($.child(div_10));
	let classes_4;
	var span_4 = $.child(span_3);
	let classes_5;
	var text_14 = $.sibling(span_4, 1, true);

	$.reset(span_3);
	$.reset(div_10);

	var node_25 = $.sibling(div_10, 2);

	{
		var consequent_18 = ($$anchor) => {
			var p_7 = root_18();

			$.append($$anchor, p_7);
		};

		var alternate_4 = ($$anchor) => {
			var fragment_11 = root_21();
			var div_11 = $.sibling($.first_child(fragment_11), 2);
			var node_26 = $.child(div_11);

			{
				var consequent_19 = ($$anchor) => {
					var fragment_12 = root_19();
					var button_7 = $.first_child(fragment_12);
					var text_15 = $.only_child(button_7, true);
					var button_8 = $.sibling(button_7);

					$.template_effect(
						($0) => {
							button_7.disabled = $.get(probing);
							$.set_text(text_15, $.get(probing) ? 'Checking…' : 'Check connection');
							button_8.disabled = $0;
						},
						[() => app.busy('api.stop')]
					);

					$.delegated('click', button_7, probe);
					$.delegated('click', button_8, stop);
					$.append($$anchor, fragment_12);
				};

				var alternate_3 = ($$anchor) => {
					var button_9 = root_20();
					var text_16 = $.only_child(button_9, true);

					$.template_effect(
						($0, $1) => {
							button_9.disabled = $0;
							$.set_text(text_16, $1);
						},
						[
							() => !app.ready || app.busy('api.start'),
							() => app.busy('api.start') ? 'Starting…' : 'Start gateway'
						]
					);

					$.delegated('click', button_9, () => app.perform('api.start'));
					$.append($$anchor, button_9);
				};

				$.if(node_26, ($$render) => {
					if ($.get(running)) $$render(consequent_19); else $$render(alternate_3, -1);
				});
			}

			var button_10 = $.sibling(node_26);

			$.reset(div_11);
			$.delegated('click', button_10, () => app.settingsPage('gateway'));
			$.append($$anchor, fragment_11);
		};

		$.if(node_25, ($$render) => {
			if ($.get(fallback)) $$render(consequent_18); else $$render(alternate_4, -1);
		});
	}

	var node_27 = $.sibling(node_25, 2);

	{
		var consequent_20 = ($$anchor) => {
			var p_8 = root_12();
			let classes_6;
			var text_17 = $.only_child(p_8);

			$.template_effect(() => {
				classes_6 = $.set_class(p_8, 1, 'connection-result', null, classes_6, { 'danger-text': $.get(probeFailed) });
				$.set_text(text_17, `${$.get(probeMessage) ?? ''} Website access and client interoperability are separate checks.`);
			});

			$.append($$anchor, p_8);
		};

		$.if(node_27, ($$render) => {
			if ($.get(probeMessage)) $$render(consequent_20);
		});
	}

	$.reset(section_2);

	var section_3 = $.sibling(section_2, 2);
	var div_12 = $.child(section_3);
	var h2 = $.child(div_12);
	var text_18 = $.only_child(h2);
	var node_28 = $.sibling(h2);

	{
		var consequent_21 = ($$anchor) => {
			var button_11 = root_22();
			var node_29 = $.child(button_11);

			Icon(node_29, { name: 'download', size: 14 });
			$.next();
			$.reset(button_11);
			$.template_effect(() => button_11.disabled = !app.ready || !$.get(opencodeValid));
			$.delegated('click', button_11, () => app.export('opencode.json', $.get(config)));
			$.append($$anchor, button_11);
		};

		$.if(node_28, ($$render) => {
			if ($.get(client) === 'opencode') $$render(consequent_21);
		});
	}

	$.reset(div_12);

	var node_30 = $.sibling(div_12, 2);

	{
		var consequent_24 = ($$anchor) => {
			var fragment_13 = root_26();
			var node_31 = $.sibling($.first_child(fragment_13), 2);

			$.each(node_31, 17, () => app.models, (m) => m.id, ($$anchor, m) => {
				const servable = $.derived(() => modelReady($.get(m), $.get(m).provider));

				const badge = $.derived(() => $.get(servable)
					? 'Ready'
					: $.get(fallback)
						? 'Observed on this Mac · unverified'
						: modelStatus($.get(m), $.get(m).provider));

				const locked = $.derived(() => !$.get(fallback) && !($.get(m).enabled && $.get(m).provider.exposed));
				var label_3 = root_23();
				var div_13 = $.child(label_3);
				var strong = $.child(div_13);
				var text_19 = $.only_child(strong);
				var p_9 = $.sibling(strong);
				var text_20 = $.only_child(p_9);

				$.reset(div_13);

				var input = $.sibling(div_13);

				$.remove_input_defaults(input);
				$.reset(label_3);

				$.template_effect(
					($0, $1) => {
						$.set_text(text_19, `${$.get(m).provider.label ?? ''} / ${$.get(m).display_name ?? ''}`);
						$.set_text(text_20, `${$.get(badge) ?? ''}${$0 ?? ''}`);
						$.set_attribute(input, 'aria-label', `Include ${$.get(m).display_name} in opencode config`);
						$.set_checked(input, $1);
						input.disabled = $.get(locked) || !app.ready;
					},
					[
						() => $.get(m).provider.state !== 'READY' && !$.get(fallback)
							? ` · ${$.get(m).provider.state === 'CANDIDATE'
								? 'inspecting chat controls'
								: $.get(m).provider.state.toLowerCase()}`
							: '',
						() => $.get(picked).includes($.get(m).id)
					]
				);

				$.delegated('change', input, (e) => togglePick($.get(m).id, e.currentTarget.checked));
				$.append($$anchor, label_3);
			});

			var node_32 = $.sibling(node_31, 2);

			{
				var consequent_22 = ($$anchor) => {
					var p_10 = root_24();

					$.append($$anchor, p_10);
				};

				var d = $.derived(() => $.get(included).length > 0 && !$.get(included).some((m) => modelReady(m, m.provider)));

				$.if(node_32, ($$render) => {
					if ($.get(d)) $$render(consequent_22);
				});
			}

			var node_33 = $.sibling(node_32, 2);

			{
				var consequent_23 = ($$anchor) => {
					var p_11 = root_25();

					$.append($$anchor, p_11);
				};

				$.if(node_33, ($$render) => {
					if ($.get(opencodeDefault) && !$.get(defaultIncluded)) $$render(consequent_23);
				});
			}

			$.append($$anchor, fragment_13);
		};

		$.if(node_30, ($$render) => {
			if ($.get(client) === 'opencode' && app.models.length) $$render(consequent_24);
		});
	}

	var node_34 = $.sibling(node_30, 2);

	{
		var consequent_30 = ($$anchor) => {
			var fragment_14 = root_32();
			var p_12 = $.first_child(fragment_14);
			var text_21 = $.only_child(p_12, true);
			var node_35 = $.sibling(p_12, 2);

			{
				var consequent_25 = ($$anchor) => {
					var p_13 = root_27();

					$.append($$anchor, p_13);
				};

				$.if(node_35, ($$render) => {
					if ($.get(client) === 'opencode') $$render(consequent_25);
				});
			}

			var div_14 = $.sibling(node_35, 2);
			var div_15 = $.child(div_14);
			var node_36 = $.child(div_15);

			{
				let $0 = $.derived(() => $.get(client) === 'opencode' ? 'folder' : 'terminal');

				Icon(node_36, {
					get name() {
						return $.get($0);
					},
					size: 13
				});
			}

			var span_5 = $.sibling(node_36);
			var text_22 = $.only_child(span_5, true);
			var button_12 = $.sibling(span_5);
			var node_37 = $.child(button_12);

			Icon(node_37, { name: 'copy', size: 13 });
			$.next();
			$.reset(button_12);
			$.reset(div_15);

			var pre = $.sibling(div_15);
			var text_23 = $.only_child(pre, true);

			$.reset(div_14);

			var node_38 = $.sibling(div_14, 2);

			{
				var consequent_26 = ($$anchor) => {
					var fragment_15 = root_28();
					var label_4 = $.first_child(fragment_15);
					var div_16 = $.sibling($.child(label_4));
					var code = $.child(div_16);
					var text_24 = $.only_child(code, true);
					var button_13 = $.sibling(code);
					var node_39 = $.child(button_13);

					Icon(node_39, { name: 'copy', size: 14 });
					$.reset(button_13);
					$.reset(div_16);

					var span_6 = $.sibling(div_16);
					var text_25 = $.only_child(span_6, true);

					$.reset(label_4);

					var div_17 = $.sibling(label_4, 2);
					var div_18 = $.sibling($.child(div_17));
					var code_1 = $.child(div_18);
					var text_26 = $.only_child(code_1, true);
					var button_14 = $.sibling(code_1);
					var node_40 = $.child(button_14);

					{
						let $0 = $.derived(() => app.secret ? 'close' : 'eye');

						Icon(node_40, {
							get name() {
								return $.get($0);
							},
							size: 15
						});
					}

					$.reset(button_14);

					var button_15 = $.sibling(button_14);
					var node_41 = $.child(button_15);

					Icon(node_41, { name: 'copy', size: 14 });
					$.reset(button_15);
					$.reset(div_18);
					$.next();
					$.reset(div_17);

					$.template_effect(() => {
						$.set_text(text_24, $.get(client) === 'messages' ? $.get(endpoint) : `${$.get(endpoint)}/v1`);
						button_13.disabled = !app.ready;

						$.set_text(text_25, $.get(client) === 'messages'
							? 'Anthropic-compatible clients append /v1/messages themselves.'
							: 'OpenAI-compatible clients use this base URL directly.');

						$.set_text(text_26, app.secret || 'Hidden — reveal or copy explicitly');
						$.set_attribute(button_14, 'aria-label', app.secret ? 'Hide custom API key' : 'Reveal custom API key');
						button_14.disabled = !app.ready;
						button_15.disabled = !app.ready;
					});

					$.delegated('click', button_13, () => app.clipboard($.get(client) === 'messages' ? $.get(endpoint) : `${$.get(endpoint)}/v1`));
					$.delegated('click', button_14, reveal);
					$.delegated('click', button_15, copyKey);
					$.append($$anchor, fragment_15);
				};

				$.if(node_38, ($$render) => {
					if ($.get(client) === 'chat' || $.get(client) === 'responses' || $.get(client) === 'messages') $$render(consequent_26);
				});
			}

			var node_42 = $.sibling(node_38, 2);

			{
				var consequent_27 = ($$anchor) => {
					var div_19 = root_29();
					var div_20 = $.child(div_19);
					var node_43 = $.child(div_20);

					Icon(node_43, { name: 'terminal', size: 13 });

					var button_16 = $.sibling(node_43, 2);

					$.reset(div_20);

					var pre_1 = $.sibling(div_20);

					pre_1.textContent = 'read -rsp \'Codemax local key: \' CODEMAX_API_KEY; echo\nexport CODEMAX_API_KEY\nopencode';
					$.reset(div_19);
					$.template_effect(() => button_16.disabled = !app.ready);
					$.delegated('click', button_16, () => app.clipboard(startCommand));
					$.append($$anchor, div_19);
				};

				$.if(node_42, ($$render) => {
					if ($.get(client) === 'opencode') $$render(consequent_27);
				});
			}

			var node_44 = $.sibling(node_42, 2);

			{
				var consequent_28 = ($$anchor) => {
					var div_21 = root_30();
					var button_17 = $.child(div_21);
					var node_45 = $.child(button_17);

					Icon(node_45, { name: 'key', size: 14 });
					$.next();
					$.reset(button_17);
					$.next();
					$.reset(div_21);
					$.template_effect(($0) => button_17.disabled = $0, [() => !app.ready || app.busy('key.reveal')]);
					$.delegated('click', button_17, copyKey);
					$.append($$anchor, div_21);
				};

				$.if(node_44, ($$render) => {
					if ($.get(client) !== 'koryphaios') $$render(consequent_28);
				});
			}

			var node_46 = $.sibling(node_44, 2);

			{
				var consequent_29 = ($$anchor) => {
					var div_22 = root_31();
					var node_47 = $.child(div_22);

					Icon(node_47, { name: 'alert', size: 16 });
					$.next();
					$.reset(div_22);
					$.append($$anchor, div_22);
				};

				$.if(node_46, ($$render) => {
					if ($.get(client) === 'claude') $$render(consequent_29);
				});
			}

			$.template_effect(() => {
				$.set_text(text_21, $.get(client) === 'koryphaios'
					? 'The gateway publishes a private connection descriptor for Koryphaios. Metadata is refreshed with a short, authorization-scoped cache.'
					: $.get(client) === 'opencode'
						? 'Save this in your project, or merge the provider entry into your existing opencode.json. Do not replace an existing configuration without reviewing it.'
						: $.get(client) === 'claude'
							? 'Run this in a Bash terminal, then paste the copied local key at the prompt. It only changes that terminal’s environment.'
							: 'Run this example in a Bash terminal and paste the copied local key at the prompt.');

				$.set_text(text_22, $.get(filename));
				button_12.disabled = !app.ready;
				$.set_text(text_23, $.get(snippet));
			});

			$.delegated('click', button_12, () => app.clipboard($.get(snippet)));
			$.append($$anchor, fragment_14);
		};

		var alternate_5 = ($$anchor) => {
			var p_14 = root_33();

			$.append($$anchor, p_14);
		};

		$.if(node_34, ($$render) => {
			if ($.get(client) === 'opencode' ? $.get(opencodeDefault) : $.get(model)) $$render(consequent_30); else $$render(alternate_5, -1);
		});
	}

	var details_2 = $.sibling(node_34, 2);
	var label_5 = $.sibling($.child(details_2), 2);
	var div_23 = $.sibling($.child(label_5));
	var code_2 = $.child(div_23);
	var text_27 = $.only_child(code_2, true);
	var button_18 = $.sibling(code_2);
	var node_48 = $.child(button_18);

	Icon(node_48, { name: 'copy', size: 14 });
	$.reset(button_18);
	$.reset(div_23);
	$.reset(label_5);

	var div_24 = $.sibling(label_5, 2);
	var div_25 = $.sibling($.child(div_24));
	var code_3 = $.child(div_25);
	var text_28 = $.only_child(code_3, true);
	var button_19 = $.sibling(code_3);
	var node_49 = $.child(button_19);

	{
		let $0 = $.derived(() => app.secret ? 'close' : 'eye');

		Icon(node_49, {
			get name() {
				return $.get($0);
			},
			size: 15
		});
	}

	$.reset(button_19);

	var button_20 = $.sibling(button_19);
	var node_50 = $.child(button_20);

	Icon(node_50, { name: 'copy', size: 14 });
	$.reset(button_20);
	$.reset(div_25);
	$.next();
	$.reset(div_24);
	$.next(2);
	$.reset(details_2);
	$.reset(section_3);
	$.reset(div_4);

	var aside = $.sibling(div_4, 2);
	var button_21 = $.sibling($.child(aside), 3);
	var node_51 = $.sibling($.child(button_21));

	Icon(node_51, { name: 'arrow', size: 13 });
	$.reset(button_21);

	var button_22 = $.sibling(button_21, 4);
	var node_52 = $.sibling($.child(button_22));

	Icon(node_52, { name: 'arrow', size: 13 });
	$.reset(button_22);
	$.next(2);
	$.reset(aside);
	$.reset(div_3);
	$.reset(details);

	$.template_effect(
		($0) => {
			classes = $.set_class(span, 1, 'dot', null, classes, { online: $.get(running) });

			$.set_text(text, !app.ready
				? 'Reconnect Codemax to continue'
				: $.get(running)
					? 'Local gateway ready'
					: $.get(fallback)
						? 'No gateway in browsing-only mode'
						: 'Ready to set up');

			select.disabled = !app.ready || $.get(setupBusy);

			if (select_value !== (select_value = $.get(client))) {
				(
					select.value = (select.__value = select_value) ?? '',
					$.select_option(select, select_value)
				);
			}

			select_1.disabled = !app.ready || $.get(setupBusy) || !app.exposedModels.length;

			if (select_1_value !== (select_1_value = app.clientModel || $.get(model))) {
				(
					select_1.value = (select_1.__value = select_1_value) ?? '',
					$.select_option(select_1, select_1_value)
				);
			}

			details_1.open = $0;
			select_2.disabled = !app.ready || !app.exposedModels.length;

			if (select_2_value !== (select_2_value = app.clientModel || $.get(model))) {
				(
					select_2.value = (select_2.__value = select_2_value) ?? '',
					$.select_option(select_2, select_2_value)
				);
			}

			classes_4 = $.set_class(span_3, 1, 'tag', null, classes_4, { ready: $.get(running) });
			classes_5 = $.set_class(span_4, 1, 'dot', null, classes_5, { online: $.get(running) });

			$.set_text(text_14, !app.ready
				? 'Disconnected'
				: $.get(running) ? 'Ready' : $.get(fallback) ? 'Unavailable' : 'Stopped');

			$.set_text(text_18, `3. Configure ${formatNames[$.get(client)] ?? ''}`);
			$.set_text(text_27, $.get(client) === 'claude' || $.get(client) === 'messages' ? $.get(endpoint) : `${$.get(endpoint)}/v1`);
			button_18.disabled = !app.ready;
			$.set_text(text_28, app.secret || 'Hidden — reveal or copy explicitly');
			$.set_attribute(button_19, 'aria-label', app.secret ? 'Hide API key' : 'Reveal API key');
			button_19.disabled = !app.ready;
			button_20.disabled = !app.ready;
		},
		[
			() => ['chat', 'responses', 'messages'].includes($.get(client))
		]
	);

	$.delegated('change', select, (e) => app.settings({ harness: e.currentTarget.value }));
	$.delegated('change', select_1, (e) => app.clientModel = e.currentTarget.value);
	$.delegated('change', select_2, (e) => app.clientModel = e.currentTarget.value);
	$.delegated('click', button_18, () => app.clipboard($.get(client) === 'claude' || $.get(client) === 'messages' ? $.get(endpoint) : `${$.get(endpoint)}/v1`));
	$.delegated('click', button_19, reveal);
	$.delegated('click', button_20, copyKey);
	$.delegated('click', button_21, () => app.navigate('sessions'));
	$.delegated('click', button_22, () => app.navigate('tools'));
	$.append($$anchor, fragment);
	$.pop();
}

$.delegate(['change', 'click']);