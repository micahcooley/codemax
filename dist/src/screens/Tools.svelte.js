import '../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import * as bridge from '../lib/api/bridge.js';
import Icon from '../lib/components/Icon.svelte.js';
import FileProbe from '../lib/components/FileProbe.svelte.js';

var root_3 = $.from_html(`<option> </option>`);
var root_2 = $.from_html(`<label class="field"><span>Imported definition</span><select></select><span class="field-hint">Command and arguments only. No credentials or environment values are copied.</span></label>`);
var root_1 = $.from_html(`<section class="section"><div class="section-title"><h2>Add an MCP server</h2><button class="text-button">Import configuration</button></div> <!> <label class="field"><span>Name</span><input aria-label="MCP server name" maxlength="120"/></label> <label class="field"><span>Executable</span><input class="mono" aria-label="MCP executable" maxlength="2000"/><span class="field-hint">An installed command such as npx, uvx, or an absolute executable path. Arguments stay separate; Codemax does not interpret a shell command.</span></label> <label class="field"><span>Arguments · JSON array</span><textarea class="mono" aria-label="MCP arguments" rows="3"></textarea></label> <div class="button-group"><button class="primary">Save server</button><button class="secondary">Cancel</button></div></section>`);
var root_4 = $.from_html(`<section class="section permission-box" aria-label="Local process permission"><div class="section-title"><h2>Allow this local process?</h2><!></div><p><strong> </strong> runs on your computer with your user account’s access. A package runner may download code. Tool-call approval does not sandbox the server itself.</p><pre class="code"> </pre><label class="setting-line"><span>I trust this executable and its arguments.</span><input type="checkbox" aria-label="Trust MCP executable"/></label><div class="button-group"><button class="primary">Allow process and connect</button><button class="secondary">Do not run</button></div></section>`);
var root_5 = $.from_html(`<div class="discovery-note"><!><div>No tool servers connected. Add one or import an existing MCP configuration. The model gateway works independently and does not require an MCP server.</div></div>`);
var root_7 = $.from_html(`<button class="secondary">Connect</button>`);
var root_8 = $.from_html(`<button class="secondary">Disconnect</button>`);
var root_9 = $.from_html(`<p class="error-banner" role="alert"> </p>`);
var root_10 = $.from_html(`<label class="setting-line"><div><strong> </strong><p> </p></div><input type="checkbox"/></label>`);
var root_11 = $.from_html(`<details><summary> </summary><pre class="code"> </pre></details>`);
var root_6 = $.from_html(`<div class="tool-server"><div class="section-title"><div><strong> </strong><p class="field-hint"> </p></div><div class="button-group"><!></div></div> <!> <!> <details class="advanced-client"><summary>Advanced · executable and tool schemas</summary><pre class="code"> </pre><!><p class="field-hint">Tool descriptions and schemas come from the server. Read-only hints are not permissions. Catalog changes and reconnects revoke enabled choices and active task grants.</p><button class="text-button danger-text">Remove server</button></details></div>`);
var root_12 = $.from_html(`<option> </option>`);
var root_13 = $.from_html(`<button class="secondary danger-text">Stop task and revoke permissions</button>`);
var root_14 = $.from_html(`<button class="primary"><!>Start in website</button>`);
var root_15 = $.from_html(`<button class="text-button">Show website</button>`);
var root_17 = $.from_html(`<p class="error-banner" role="alert"> </p>`);
var root_18 = $.from_html(`<div class="tool-call"><div class="section-title"><h3>Approve this tool call</h3><!></div><p><strong> </strong> </p><pre class="code"> </pre><p class="field-hint"> </p> <details class="advanced-client"><summary>Advanced · automatic execution for this task</summary><label class="setting-line"><div><strong>Allow this tool for the rest of this task</strong><p>Allows future calls to this exact tool with different arguments. This is not a path-limited filesystem grant. It ends with this task, connection change, or cancellation.</p></div><input type="checkbox" aria-label="Allow MCP tool for task"/></label></details> <div class="button-group"><button class="primary"> </button><button class="secondary">Deny and stop</button></div></div>`);
var root_19 = $.from_html(`<p>The approved tool finished. Its result is ready to send back to the model.</p><button class="primary">Insert result and send</button>`, 1);
var root_20 = $.from_html(`<pre class="tool-answer"> </pre>`);
var root_21 = $.from_html(`<details class="advanced-client"><summary>Last tool result · untrusted data</summary><pre class="code"> </pre></details>`);
var root_16 = $.from_html(`<section class="section" aria-label="MCP task activity"><div class="section-title"><h2>Task activity</h2><span class="tag"> </span></div> <!> <!> <!> <!> <!></section>`);
var root = $.from_html(`<section class="screen"><div class="screen-inner"><header class="screen-head"><div><div class="breadcrumb">Codemax / Local tool client</div><h1>Tools & MCP</h1><p>Let a website model work with tools you trust. Codemax inserts the instructions, handles approved calls, and returns results to the same conversation.</p></div><button class="secondary"><!>Add tool server</button></header> <div class="setup-strip"><div><span>1</span><strong>Connect trusted tools</strong><small>Use an existing MCP configuration.</small></div><div><span>2</span><strong>Start a website task</strong><small>The browser supplies the model.</small></div><div><span>3</span><strong>Approve what runs</strong><small>Results continue the conversation.</small></div></div> <!> <!> <section class="section"><div class="section-title"><h2>Tool servers</h2><span class="tag"> </span></div> <!> <!></section> <section class="section"><div class="section-title"><h2>Start a task</h2><span class="tag">Website quota · no provider key</span></div> <label class="field"><span>Website model</span><select aria-label="MCP website model"><option> </option><!></select></label> <label class="field"><span>What should the model do?</span><textarea aria-label="MCP task" maxlength="8191" rows="3"></textarea><span class="field-hint">Your task, enabled tool schemas, and approved tool results are sent to this website. Web search requires an enabled search-capable tool server; Codemax does not invent search results.</span></label> <label class="setting-line"><div><strong>Automatically continue after approved tools</strong><p>Insert results and send the next turn in the same website conversation. Execution still requires approval.</p></div><input type="checkbox" aria-label="Automatically continue tool results"/></label> <div class="button-group"><!><!></div> <p class="field-hint" style="margin-top:14px">One task at a time, up to 20 model turns and 10 minutes. Tasks begin in a new conversation so an unrelated website chat cannot supply tool instructions.</p></section> <!> <details class="advanced-client"><summary>Advanced · synthetic file permission diagnostic</summary><!></details></div></section>`);

export default function Tools($$anchor, $$props) {
	$.push($$props, true);

	let adding = $.state(false);
	let label = $.state('');
	let command = $.state('');
	let argv = $.state('[]');
	let task = $.state('');
	let chosen = $.state('');
	let automatic = $.state(true);
	let forRun = $.state(false);
	let consent = $.state(null);
	let trust = $.state(false);
	let imported = $.state($.proxy([]));
	let importChoice = $.state(0);
	const servers = $.derived(() => app.snapshot?.mcp_servers ?? []);
	const run = $.derived(() => app.snapshot?.mcp_run);

	const running = $.derived(() => !!$.get(run) && [
		'GENERATING',
		'PERMISSION_REQUIRED',
		'EXECUTING_TOOL',
		'RESULT_READY'
	].includes($.get(run).state));

	const model = $.derived(() => app.exposedModels.find((m) => m.id === $.get(chosen)) || app.exposedModels.find((m) => m.provider.id === app.selectedProvider) || app.exposedModels[0]);
	const tools = $.derived(() => $.get(servers).flatMap((server) => server.tools.map((tool) => ({ ...tool, server }))));
	const enabled = $.derived(() => $.get(tools).filter((t) => t.enabled && t.server.state === 'READY'));
	const pending = $.derived(() => $.get(tools).find((t) => t.alias === $.get(run)?.tool));

	async function add() {
		try {
			const args = JSON.parse($.get(argv));

			if (!Array.isArray(args) || args.some((a) => typeof a !== 'string')) throw Error('Arguments must be a JSON array of strings.');

			const result = await app.perform('mcp.server.add', {
				label: $.get(label).trim(),
				command: $.get(command).trim(),
				args
			});

			if (result) {
				$.set(adding, false);
				$.set(label, '');
				$.set(command, '');
				$.set(argv, '[]');
				app.notification = 'Saved. Review and allow the local process before connecting.';
			}
		} catch(e) {
			app.error = String(e);
		}
	}

	async function importServers() {
		try {
			const file = await bridge.importDocument();

			if (!file) return;

			const source = file.mcpServers ?? file;

			$.set(
				imported,
				Object.entries(source).flatMap(([name, v]) => {
					const x = v;

					return x && typeof x.command === 'string' && Array.isArray(x.args) && x.args.every((a) => typeof a === 'string')
						? [{ label: name, command: x.command, args: x.args }]
						: [];
				}),
				true
			);

			if (!$.get(imported).length) throw Error('This file has no stdio command-and-arguments definitions. Remote URLs and environment secrets are not imported.');

			$.set(importChoice, 0);
			useImported();
			$.set(adding, true);
		} catch(e) {
			app.error = String(e);
		}
	}

	function useImported() {
		const item = $.get(imported)[$.get(importChoice)];

		if (item) {
			$.set(label, item.label, true);
			$.set(command, item.command, true);
			$.set(argv, JSON.stringify(item.args, null, 2), true);
		}
	}

	async function connect() {
		if (!$.get(consent) || !$.get(trust)) return;

		await app.perform('mcp.server.connect', { server_id: $.get(consent).id, confirmed: true });
		$.set(consent, null);
		$.set(trust, false);
	}

	async function start() {
		if (!$.get(model)) return;

		$.set(forRun, false);

		await app.perform('mcp.run.start', {
			provider_id: $.get(model).provider.id,
			model: $.get(model).id,
			task: $.get(task),
			auto_continue: $.get(automatic)
		});
	}

	async function approve() {
		if ($.get(run)) await app.perform('mcp.run.approve', {
			run_id: $.get(run).id,
			call_id: $.get(run).call_id,
			confirmed: true,
			allow_run: $.get(forRun)
		});
	}

	async function cancel() {
		if ($.get(run)) await app.perform('mcp.run.cancel', { run_id: $.get(run).id });
	}

	var section = root();
	var div = $.child(section);
	var header = $.child(div);
	var button = $.sibling($.child(header));

	button.__click = () => $.set(adding, !$.get(adding));

	var node = $.child(button);

	Icon(node, { name: 'plus', size: 15 });
	$.next();
	$.reset(button);
	$.reset(header);

	var node_1 = $.sibling(header, 4);

	{
		var consequent_1 = ($$anchor) => {
			var section_1 = root_1();
			var div_1 = $.child(section_1);
			var button_1 = $.sibling($.child(div_1));

			button_1.__click = importServers;
			$.reset(div_1);

			var node_2 = $.sibling(div_1, 2);

			{
				var consequent = ($$anchor) => {
					var label_1 = root_2();
					var select = $.sibling($.child(label_1));

					select.__change = useImported;

					$.each(select, 21, () => $.get(imported), $.index, ($$anchor, definition, i) => {
						var option = root_3();
						var text = $.child(option, true);

						$.reset(option);
						option.value = option.__value = i;
						$.template_effect(() => $.set_text(text, $.get(definition).label));
						$.append($$anchor, option);
					});

					$.reset(select);
					$.next();
					$.reset(label_1);
					$.bind_select_value(select, () => $.get(importChoice), ($$value) => $.set(importChoice, $$value));
					$.append($$anchor, label_1);
				};

				$.if(node_2, ($$render) => {
					if ($.get(imported).length) $$render(consequent);
				});
			}

			var label_2 = $.sibling(node_2, 2);
			var input = $.sibling($.child(label_2));

			$.remove_input_defaults(input);
			$.reset(label_2);

			var label_3 = $.sibling(label_2, 2);
			var input_1 = $.sibling($.child(label_3));

			$.remove_input_defaults(input_1);
			$.next();
			$.reset(label_3);

			var label_4 = $.sibling(label_3, 2);
			var textarea = $.sibling($.child(label_4));

			$.remove_textarea_child(textarea);
			$.reset(label_4);

			var div_2 = $.sibling(label_4, 2);
			var button_2 = $.child(div_2);

			button_2.__click = add;

			var button_3 = $.sibling(button_2);

			button_3.__click = () => $.set(adding, false);
			$.reset(div_2);
			$.reset(section_1);

			$.template_effect(($0) => button_2.disabled = $0, [
				() => !$.get(label).trim() || !$.get(command).trim() || $.get(running)
			]);

			$.bind_value(input, () => $.get(label), ($$value) => $.set(label, $$value));
			$.bind_value(input_1, () => $.get(command), ($$value) => $.set(command, $$value));
			$.bind_value(textarea, () => $.get(argv), ($$value) => $.set(argv, $$value));
			$.append($$anchor, section_1);
		};

		$.if(node_1, ($$render) => {
			if ($.get(adding)) $$render(consequent_1);
		});
	}

	var node_3 = $.sibling(node_1, 2);

	{
		var consequent_2 = ($$anchor) => {
			var section_2 = root_4();
			var div_3 = $.child(section_2);
			var node_4 = $.sibling($.child(div_3));

			Icon(node_4, { name: 'shield', size: 18 });
			$.reset(div_3);

			var p_1 = $.sibling(div_3);
			var strong = $.child(p_1);
			var text_1 = $.child(strong, true);

			$.reset(strong);
			$.next();
			$.reset(p_1);

			var pre = $.sibling(p_1);
			var text_2 = $.child(pre);

			$.reset(pre);

			var label_5 = $.sibling(pre);
			var input_2 = $.sibling($.child(label_5));

			$.remove_input_defaults(input_2);
			$.reset(label_5);

			var div_4 = $.sibling(label_5);
			var button_4 = $.child(div_4);

			button_4.__click = connect;

			var button_5 = $.sibling(button_4);

			button_5.__click = () => {
				$.set(consent, null);
				$.set(trust, false);
			};

			$.reset(div_4);
			$.reset(section_2);

			$.template_effect(
				($0) => {
					$.set_text(text_1, $.get(consent).label);

					$.set_text(text_2, `${$.get(consent).command ?? ''}
${$0 ?? ''}`);

					button_4.disabled = !$.get(trust);
				},
				[() => JSON.stringify($.get(consent).args, null, 2)]
			);

			$.bind_checked(input_2, () => $.get(trust), ($$value) => $.set(trust, $$value));
			$.append($$anchor, section_2);
		};

		$.if(node_3, ($$render) => {
			if ($.get(consent)) $$render(consequent_2);
		});
	}

	var section_3 = $.sibling(node_3, 2);
	var div_5 = $.child(section_3);
	var span = $.sibling($.child(div_5));
	var text_3 = $.child(span);

	$.reset(span);
	$.reset(div_5);

	var node_5 = $.sibling(div_5, 2);

	{
		var consequent_3 = ($$anchor) => {
			var div_6 = root_5();
			var node_6 = $.child(div_6);

			Icon(node_6, { name: 'terminal', size: 16 });
			$.next();
			$.reset(div_6);
			$.append($$anchor, div_6);
		};

		$.if(node_5, ($$render) => {
			if (!$.get(servers).length) $$render(consequent_3);
		});
	}

	var node_7 = $.sibling(node_5, 2);

	$.each(node_7, 17, () => $.get(servers), (server) => server.id, ($$anchor, server) => {
		var div_7 = root_6();
		var div_8 = $.child(div_7);
		var div_9 = $.child(div_8);
		var strong_1 = $.child(div_9);
		var text_4 = $.child(strong_1, true);

		$.reset(strong_1);

		var p_2 = $.sibling(strong_1);
		var text_5 = $.child(p_2);

		$.reset(p_2);
		$.reset(div_9);

		var div_10 = $.sibling(div_9);
		var node_8 = $.child(div_10);

		{
			var consequent_4 = ($$anchor) => {
				var button_6 = root_7();

				button_6.__click = () => {
					$.set(consent, $.get(server), true);
					$.set(trust, false);
				};

				$.template_effect(() => button_6.disabled = $.get(running));
				$.append($$anchor, button_6);
			};

			var alternate = ($$anchor) => {
				var button_7 = root_8();

				button_7.__click = () => app.perform('mcp.server.disconnect', { server_id: $.get(server).id });
				$.template_effect(() => button_7.disabled = $.get(running));
				$.append($$anchor, button_7);
			};

			$.if(node_8, ($$render) => {
				if (['DISCONNECTED', 'ERROR'].includes($.get(server).state)) $$render(consequent_4); else $$render(alternate, false);
			});
		}

		$.reset(div_10);
		$.reset(div_8);

		var node_9 = $.sibling(div_8, 2);

		{
			var consequent_5 = ($$anchor) => {
				var p_3 = root_9();
				var text_6 = $.child(p_3, true);

				$.reset(p_3);
				$.template_effect(() => $.set_text(text_6, $.get(server).error));
				$.append($$anchor, p_3);
			};

			$.if(node_9, ($$render) => {
				if ($.get(server).error) $$render(consequent_5);
			});
		}

		var node_10 = $.sibling(node_9, 2);

		$.each(node_10, 17, () => $.get(server).tools, (tool) => tool.alias, ($$anchor, tool) => {
			var label_6 = root_10();
			var div_11 = $.child(label_6);
			var strong_2 = $.child(div_11);
			var text_7 = $.child(strong_2, true);

			$.reset(strong_2);

			var p_4 = $.sibling(strong_2);
			var text_8 = $.child(p_4, true);

			$.reset(p_4);
			$.reset(div_11);

			var input_3 = $.sibling(div_11);

			$.remove_input_defaults(input_3);
			input_3.__change = (e) => app.perform('mcp.tool.update', { tool: $.get(tool).alias, enabled: e.currentTarget.checked });
			$.reset(label_6);

			$.template_effect(() => {
				$.set_text(text_7, $.get(tool).name);
				$.set_text(text_8, $.get(tool).description);
				$.set_attribute(input_3, 'aria-label', `Enable MCP tool ${$.get(tool).name}`);
				$.set_checked(input_3, $.get(tool).enabled);
				input_3.disabled = $.get(running);
			});

			$.append($$anchor, label_6);
		});

		var details = $.sibling(node_10, 2);
		var pre_1 = $.sibling($.child(details));
		var text_9 = $.child(pre_1);

		$.reset(pre_1);

		var node_11 = $.sibling(pre_1);

		$.each(node_11, 17, () => $.get(server).tools, (tool) => tool.alias, ($$anchor, tool) => {
			var details_1 = root_11();
			var summary = $.child(details_1);
			var text_10 = $.child(summary, true);

			$.reset(summary);

			var pre_2 = $.sibling(summary);
			var text_11 = $.child(pre_2, true);

			$.reset(pre_2);
			$.reset(details_1);

			$.template_effect(
				($0) => {
					$.set_text(text_10, $.get(tool).name);
					$.set_text(text_11, $0);
				},
				[() => JSON.stringify($.get(tool).schema, null, 2)]
			);

			$.append($$anchor, details_1);
		});

		var button_8 = $.sibling(node_11, 2);

		button_8.__click = () => app.perform('mcp.server.remove', { server_id: $.get(server).id, confirmed: true });
		$.reset(details);
		$.reset(div_7);

		$.template_effect(
			($0, $1) => {
				$.set_text(text_4, $.get(server).label);
				$.set_text(text_5, `${$0 ?? ''}${$.get(server).protocol ? ` · MCP ${$.get(server).protocol}` : ''} · stdio`);

				$.set_text(text_9, `${$.get(server).command ?? ''}
${$1 ?? ''}`);

				button_8.disabled = $.get(running);
			},
			[
				() => $.get(server).state.toLowerCase().replaceAll('_', ' '),
				() => JSON.stringify($.get(server).args, null, 2)
			]
		);

		$.append($$anchor, div_7);
	});

	$.reset(section_3);

	var section_4 = $.sibling(section_3, 2);
	var label_7 = $.sibling($.child(section_4), 2);
	var select_1 = $.sibling($.child(label_7));
	var option_1 = $.child(select_1);
	var text_12 = $.child(option_1, true);

	$.reset(option_1);
	option_1.value = option_1.__value = '';

	var node_12 = $.sibling(option_1);

	$.each(node_12, 17, () => app.exposedModels, (item) => item.id, ($$anchor, item) => {
		var option_2 = root_12();
		var text_13 = $.child(option_2);

		$.reset(option_2);

		var option_2_value = {};

		$.template_effect(() => {
			$.set_text(text_13, `${$.get(item).display_name ?? ''} · ${$.get(item).provider.label ?? ''}`);

			if (option_2_value !== (option_2_value = $.get(item).id)) {
				option_2.value = (option_2.__value = $.get(item).id) ?? '';
			}
		});

		$.append($$anchor, option_2);
	});

	$.reset(select_1);
	$.reset(label_7);

	var label_8 = $.sibling(label_7, 2);
	var textarea_1 = $.sibling($.child(label_8));

	$.remove_textarea_child(textarea_1);
	$.next();
	$.reset(label_8);

	var label_9 = $.sibling(label_8, 2);
	var input_4 = $.sibling($.child(label_9));

	$.remove_input_defaults(input_4);
	$.reset(label_9);

	var div_12 = $.sibling(label_9, 2);
	var node_13 = $.child(div_12);

	{
		var consequent_6 = ($$anchor) => {
			var button_9 = root_13();

			button_9.__click = cancel;
			$.append($$anchor, button_9);
		};

		var alternate_1 = ($$anchor) => {
			var button_10 = root_14();

			button_10.__click = start;

			var node_14 = $.child(button_10);

			Icon(node_14, { name: 'arrow', size: 15 });
			$.next();
			$.reset(button_10);

			$.template_effect(($0) => button_10.disabled = $0, [
				() => !$.get(model) || !$.get(task).trim() || !$.get(enabled).length || !app.ready
			]);

			$.append($$anchor, button_10);
		};

		$.if(node_13, ($$render) => {
			if ($.get(running)) $$render(consequent_6); else $$render(alternate_1, false);
		});
	}

	var node_15 = $.sibling(node_13);

	{
		var consequent_7 = ($$anchor) => {
			var button_11 = root_15();

			button_11.__click = () => app.openProvider($.get(model).provider.id);
			$.append($$anchor, button_11);
		};

		$.if(node_15, ($$render) => {
			if ($.get(model)) $$render(consequent_7);
		});
	}

	$.reset(div_12);
	$.next(2);
	$.reset(section_4);

	var node_16 = $.sibling(section_4, 2);

	{
		var consequent_13 = ($$anchor) => {
			var section_5 = root_16();
			var div_13 = $.child(section_5);
			var span_1 = $.sibling($.child(div_13));
			var text_14 = $.child(span_1);

			$.reset(span_1);
			$.reset(div_13);

			var node_17 = $.sibling(div_13, 2);

			{
				var consequent_8 = ($$anchor) => {
					var p_5 = root_17();
					var text_15 = $.child(p_5, true);

					$.reset(p_5);
					$.template_effect(() => $.set_text(text_15, $.get(run).error));
					$.append($$anchor, p_5);
				};

				$.if(node_17, ($$render) => {
					if ($.get(run).error) $$render(consequent_8);
				});
			}

			var node_18 = $.sibling(node_17, 2);

			{
				var consequent_9 = ($$anchor) => {
					var div_14 = root_18();
					var div_15 = $.child(div_14);
					var node_19 = $.sibling($.child(div_15));

					Icon(node_19, { name: 'shield', size: 17 });
					$.reset(div_15);

					var p_6 = $.sibling(div_15);
					var strong_3 = $.child(p_6);
					var text_16 = $.child(strong_3, true);

					$.reset(strong_3);

					var text_17 = $.sibling(strong_3);

					$.reset(p_6);

					var pre_3 = $.sibling(p_6);
					var text_18 = $.child(pre_3, true);

					$.reset(pre_3);

					var p_7 = $.sibling(pre_3);
					var text_19 = $.child(p_7);

					$.reset(p_7);

					var details_2 = $.sibling(p_7, 2);
					var label_10 = $.sibling($.child(details_2));
					var input_5 = $.sibling($.child(label_10));

					$.remove_input_defaults(input_5);
					$.reset(label_10);
					$.reset(details_2);

					var div_16 = $.sibling(details_2, 2);
					var button_12 = $.child(div_16);

					button_12.__click = approve;

					var text_20 = $.child(button_12, true);

					$.reset(button_12);

					var button_13 = $.sibling(button_12);

					button_13.__click = cancel;
					$.reset(div_16);
					$.reset(div_14);

					$.template_effect(
						($0) => {
							$.set_text(text_16, $.get(pending)?.name || $.get(run).tool);
							$.set_text(text_17, ` · ${($.get(pending)?.server.label || 'server unavailable') ?? ''}`);
							$.set_text(text_18, $.get(run).arguments);
							$.set_text(text_19, `The result will be shared with ${$0 ?? ''}. Review file paths, commands, and destinations before allowing.`);
							$.set_text(text_20, $.get(forRun) ? 'Allow tool for this task' : 'Allow once');
						},
						[
							() => app.providers.find((p) => p.id === $.get(run).provider_id)?.label || 'the selected website'
						]
					);

					$.bind_checked(input_5, () => $.get(forRun), ($$value) => $.set(forRun, $$value));
					$.append($$anchor, div_14);
				};

				$.if(node_18, ($$render) => {
					if ($.get(run).state === 'PERMISSION_REQUIRED') $$render(consequent_9);
				});
			}

			var node_20 = $.sibling(node_18, 2);

			{
				var consequent_10 = ($$anchor) => {
					var fragment = root_19();
					var button_14 = $.sibling($.first_child(fragment));

					button_14.__click = () => app.perform('mcp.run.continue', { run_id: $.get(run).id });
					$.append($$anchor, fragment);
				};

				$.if(node_20, ($$render) => {
					if ($.get(run).state === 'RESULT_READY') $$render(consequent_10);
				});
			}

			var node_21 = $.sibling(node_20, 2);

			{
				var consequent_11 = ($$anchor) => {
					var pre_4 = root_20();
					var text_21 = $.child(pre_4, true);

					$.reset(pre_4);
					$.template_effect(() => $.set_text(text_21, $.get(run).answer));
					$.append($$anchor, pre_4);
				};

				$.if(node_21, ($$render) => {
					if ($.get(run).answer) $$render(consequent_11);
				});
			}

			var node_22 = $.sibling(node_21, 2);

			{
				var consequent_12 = ($$anchor) => {
					var details_3 = root_21();
					var pre_5 = $.sibling($.child(details_3));
					var text_22 = $.child(pre_5, true);

					$.reset(pre_5);
					$.reset(details_3);
					$.template_effect(() => $.set_text(text_22, $.get(run).last_result));
					$.append($$anchor, details_3);
				};

				$.if(node_22, ($$render) => {
					if ($.get(run).last_result) $$render(consequent_12);
				});
			}

			$.reset(section_5);
			$.template_effect(($0) => $.set_text(text_14, `${$0 ?? ''} · ${$.get(run).turns ?? ''} turns · ${$.get(run).calls ?? ''} calls`), [() => $.get(run).state.toLowerCase().replaceAll('_', ' ')]);
			$.append($$anchor, section_5);
		};

		$.if(node_16, ($$render) => {
			if ($.get(run) && $.get(run).state !== 'IDLE') $$render(consequent_13);
		});
	}

	var details_4 = $.sibling(node_16, 2);
	var node_23 = $.sibling($.child(details_4));

	FileProbe(node_23, {});
	$.reset(details_4);
	$.reset(div);
	$.reset(section);

	$.template_effect(() => {
		button.disabled = $.get(running);
		$.set_text(text_3, `${$.get(servers).length ?? ''} configured`);
		select_1.disabled = $.get(running);

		$.set_text(text_12, $.get(model)
			? `${$.get(model).display_name} · ${$.get(model).provider.label}`
			: 'No exposed model ready');

		textarea_1.disabled = $.get(running);
		input_4.disabled = $.get(running);
	});

	$.bind_select_value(select_1, () => $.get(chosen), ($$value) => $.set(chosen, $$value));
	$.bind_value(textarea_1, () => $.get(task), ($$value) => $.set(task, $$value));
	$.bind_checked(input_4, () => $.get(automatic), ($$value) => $.set(automatic, $$value));
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click', 'change']);