import '../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { tick } from '../../runtime/svelte_svelte.js';
import { app } from '../lib/state/app.svelte.js';
import * as bridge from '../lib/api/bridge.js';
import ToolLibrary from '../lib/components/tools/ToolLibrary.svelte.js';
import Icon from '../lib/components/Icon.svelte.js';
import FileProbe from '../lib/components/FileProbe.svelte.js';
import { errorText } from '../lib/format.js';

var root_1 = $.from_html(`<button class="secondary">Tool library</button><details class="setup-menu"><summary>More setup</summary><div><button class="secondary">Import configuration</button><button class="secondary"><!>Add tool server</button></div></details>`, 1);
var root_3 = $.from_html(`<p class="error-banner" role="alert"> </p>`);
var root_4 = $.from_html(`<div class="task-pause"><p>Reached the chosen work budget at a safe boundary. Your conversation, pending call and last result are retained. No completed tool is replayed.</p><button class="primary"> </button><p class="field-hint">Continuing renews the work budget, not tool permissions. Broader grants must be approved again. Progress is retained in this app session, not after a restart.</p></div>`);
var root_5 = $.from_html(`<div class="task-running" role="status"><span class="mini-working" aria-hidden="true"></span><span> </span></div>`);
var root_6 = $.from_html(`<div class="tool-call"><div class="section-title"><h3>Approve this tool call</h3><!></div><p><strong> </strong> </p><pre class="code"> </pre><p class="field-hint"> </p> <details class="advanced-client"><summary>Advanced · automatic execution for this task</summary><label class="setting-line"><div><strong>Allow this tool for the rest of this task</strong><p>Includes future calls with different arguments. This is not a path-limited file permission. The grant ends at the next work-budget pause, after 30 minutes, when the task ends, or when the connection changes.</p></div><input type="checkbox" aria-label="Allow MCP tool for task"/></label></details> <div class="button-group"><button class="primary"> </button><button class="secondary">Deny and stop</button></div></div>`);
var root_7 = $.from_html(`<p>The approved tool finished. Send its result to continue the website conversation.</p><button class="primary">Insert result and send</button>`, 1);
var root_8 = $.from_html(`<pre class="tool-answer"> </pre>`);
var root_9 = $.from_html(`<details class="advanced-client"><summary>Last tool result · untrusted data</summary><pre class="code"> </pre></details>`);
var root_10 = $.from_html(`<div class="button-group" style="margin-top:15px"><button class="secondary danger-text">Stop task and revoke permissions</button><button class="text-button">Show website</button></div>`);
var root_2 = $.from_html(`<section class="section task-activity" aria-label="MCP task activity"><div class="section-title"><h2>Task activity</h2><span> </span></div> <!> <!> <!> <!> <!> <!> <!> <!></section>`);
var root_12 = $.from_html(`<option>Select an available model</option>`);
var root_13 = $.from_html(`<option> </option>`);
var root_14 = $.from_html(`<button class="text-button">Show website</button>`);
var root_11 = $.from_html(`<section class="section"><div class="section-title"><h2>Start a task</h2><span class="tag"> </span></div> <label class="field"><span>Website model</span><select aria-label="MCP website model"><!><!></select></label> <label class="field"><span>What should the model do?</span><textarea aria-label="MCP task" maxlength="8191" rows="3" placeholder="Describe a task for the selected website model"></textarea><span class="field-hint">Your task, enabled tool descriptions and approved results are shared with the selected website. Drafts stay in memory until you close the application.</span></label> <details class="advanced-client task-options"><summary>Task options</summary><label class="setting-line"><div><strong>Automatically continue after approved tools</strong><p>Insert results and send the next turn. Tool execution still requires your approval.</p></div><input type="checkbox" aria-label="Automatically continue tool results"/></label> <div class="budget-fields"><label class="field"><span>Model turns per work budget</span><input type="number" aria-label="Task turn budget" min="10" max="500" step="1"/></label><label class="field"><span>Active minutes per work budget</span><input type="number" aria-label="Task work minutes" min="5" max="240" step="1"/></label></div> <p class="field-hint">Waiting for your approval does not spend the work budget. A running tool is not interrupted when the budget ends; the task pauses at its next safe boundary. Site quotas, context limits and stalled connections still apply.</p></details> <div class="button-group"><button class="primary"><!> </button><!></div> <p class="field-hint" role="status" style="margin-top:12px"> </p></section>`);
var root_15 = $.from_html(`<section class="section"><div class="section-title"><h2>Tool library</h2><button class="text-button">Close library</button></div><!></section>`);
var root_18 = $.from_html(`<option> </option>`);
var root_17 = $.from_html(`<label class="field"><span>Imported definition</span><select></select><span class="field-hint">Command and arguments only. No credentials or environment values are copied.</span></label>`);
var root_19 = $.from_html(`<p class="form-error" role="alert"> </p>`);
var root_16 = $.from_html(`<section class="section" aria-label="MCP server editor"><h2>Add an MCP server</h2><form><!> <label class="field"><span>Name</span><input aria-label="MCP server name" maxlength="120" required/></label> <label class="field"><span>Executable</span><input class="mono" aria-label="MCP executable" maxlength="2000" required/><span class="field-hint">An installed command or absolute executable path. Arguments go below; do not paste a shell command.</span></label> <label class="field"><span>Arguments · JSON array</span><textarea class="mono" aria-label="MCP arguments" rows="3"></textarea></label> <!> <div class="button-group"><button class="primary"> </button><button type="button" class="secondary">Cancel</button></div></form></section>`);
var root_20 = $.from_html(`<section tabindex="-1" class="section permission-box" aria-label="Local process permission"><div class="section-title"><h2>Allow this local process?</h2><!></div><p><strong> </strong> runs with your computer user account’s access. A package runner may download code. Tool approval does not sandbox the server itself.</p><pre class="code"> </pre><label class="setting-line"><span>I trust this executable and its arguments.</span><input type="checkbox" aria-label="Trust MCP executable"/></label><div class="button-group"><button class="primary"> </button><button class="secondary">Do not run</button></div></section>`);
var root_22 = $.from_html(`<div class="discovery-note"><!><div>No tool servers configured. Import an existing MCP configuration or add a trusted executable. Your coding client’s model connection does not require an MCP server.</div></div>`);
var root_24 = $.from_html(`<button class="secondary">Connect</button>`);
var root_25 = $.from_html(`<button class="secondary">Disconnect</button>`);
var root_26 = $.from_html(`<p class="error-banner" role="alert"> </p>`);
var root_28 = $.from_html(`<label class="setting-line"><div><strong> </strong><p> </p></div><input type="checkbox"/></label>`);
var root_29 = $.from_html(`<p class="field-hint">No tools match. <button class="text-button">Clear filter</button></p>`);
var root_27 = $.from_html(`<details class="advanced-client tool-catalog"><summary> </summary><label class="field"><span>Find a tool</span><input type="search"/></label> <!><!><p class="field-hint">Up to 32 enabled tools within the shared schema budget. Descriptions are sent to the website when a task starts.</p></details>`);
var root_30 = $.from_html(`<details><summary> </summary><pre class="code"> </pre></details>`);
var root_23 = $.from_html(`<div class="tool-server"><div class="section-title"><div><strong> </strong><p class="field-hint"> </p></div><div class="button-group"><!></div></div> <!> <!> <details class="advanced-client"><summary>Advanced · executable and tool schemas</summary><p class="field-hint"> </p><pre class="code"> </pre><!><p class="field-hint">Descriptions are supplied by the server, not a security guarantee. Reconnecting or a changed catalog resets enabled choices and task grants.</p><button class="text-button danger-text">Remove server</button></details></div>`);
var root_21 = $.from_html(`<section class="section"><div class="section-title"><h2>Tool servers</h2><span class="tag"> </span></div> <!> <!></section> <details class="advanced-client"><summary>Advanced · synthetic file permission diagnostic</summary><!></details>`, 1);
var root = $.from_html(`<section class="screen"><div class="screen-inner tools-screen"><header class="screen-head"><div><div class="breadcrumb">Codemax / Website tasks</div><h1>Website tasks</h1><p>Choose a task and its tools. Approve access, then let the same conversation continue.</p></div><div class="button-group"><!></div></header> <!> <!> <!> <!> <!> <!></div></section>`);

export default function Tools($$anchor, $$props) {
	$.push($$props, true);

	const draft = $.derived(() => app.toolDraft);
	let forRun = $.state(false);
	let formError = $.state('');
	let library = $.state(false);
	let toolFilter = $.state('');
	let consent = $.state(null);
	let trust = $.state(false);
	let consentPanel = $.state(void 0);
	let imported = $.state($.proxy([]));
	let importChoice = $.state(0);
	const servers = $.derived(() => app.snapshot?.mcp_servers ?? []);
	const run = $.derived(() => app.snapshot?.mcp_run);
	const running = $.derived(() => !!app.activeTask);

	const model = $.derived(() => $.get(draft).chosen
		? app.exposedModels.find((m) => m.id === $.get(draft).chosen)
		: app.exposedModels.find((m) => m.provider.id === app.selectedProvider) || app.exposedModels[0]);

	const tools = $.derived(() => $.get(servers).flatMap((server) => server.tools.map((tool) => ({ ...tool, server }))));
	const enabled = $.derived(() => $.get(tools).filter((t) => t.enabled && t.server.state === 'READY'));
	const pending = $.derived(() => $.get(tools).find((t) => t.alias === $.get(run)?.tool));

	const blocker = $.derived(() => !app.ready
		? 'Reconnect the local gateway to start tasks.'
		: !$.get(model)
			? 'Open a website and select an available model.'
			: !$.get(enabled).length
				? 'Connect a tool server and enable at least one tool below.'
				: !$.get(draft).task.trim()
					? 'Describe what the model should do.'
					: !Number.isInteger($.get(draft).turnBudget) || $.get(draft).turnBudget < 10 || $.get(draft).turnBudget > 500 || !Number.isInteger($.get(draft).workMinutes) || $.get(draft).workMinutes < 5 || $.get(draft).workMinutes > 240 ? 'Choose 10–500 turns and 5–240 active minutes.' : '');

	let lastApproval = '';

	$.user_effect(() => {
		const key = $.get(run)?.state === 'PERMISSION_REQUIRED'
			? `${$.get(run).id}:${$.get(run).call_id}:${$.get(run).tool}:${$.get(run).arguments}`
			: '';

		if (lastApproval !== key) {
			lastApproval = key;
			$.set(forRun, false);
		}
	});

	$.user_effect(() => {
		if ($.get(consent)) void tick().then(() => {
			$.get(consentPanel)?.scrollIntoView({ block: 'nearest' });
			$.get(consentPanel)?.focus();
		});
	});

	async function add() {
		$.set(formError, '');

		try {
			const args = JSON.parse($.get(draft).argv);

			if (!Array.isArray(args) || args.some((a) => typeof a !== 'string')) throw Error('Arguments must be a JSON array of strings, for example ["--config", "file.json"].');

			const result = await app.perform('mcp.server.add', {
				label: $.get(draft).label.trim(),
				command: $.get(draft).command.trim(),
				args
			});

			if (result) {
				$.get(draft).adding = false;
				$.get(draft).label = '';
				$.get(draft).command = '';
				$.get(draft).argv = '[]';
				app.notification = 'Server saved. Review and allow the local process before connecting.';
			}
		} catch(error) {
			$.set(
				formError,
				error instanceof SyntaxError
					? 'Arguments are not valid JSON. Use a list of quoted strings, for example ["--help"].'
					: errorText(String(error)),
				true
			);
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

			if (!$.get(imported).length) throw Error('No supported local server definitions were found. Remote URLs and credentials are not imported.');

			$.set(importChoice, 0);
			useImported();
			$.get(draft).adding = true;
			$.set(formError, '');
		} catch(error) {
			app.error = String(error);
		}
	}

	function useImported() {
		const item = $.get(imported)[$.get(importChoice)];

		if (item) {
			$.get(draft).label = item.label;
			$.get(draft).command = item.command;
			$.get(draft).argv = JSON.stringify(item.args, null, 2);
		}
	}

	async function connect() {
		if (!$.get(consent) || !$.get(trust)) return;

		const result = await app.perform('mcp.server.connect', { server_id: $.get(consent).id, confirmed: true });

		if (result !== undefined) {
			$.set(consent, null);
			$.set(trust, false);
		}
	}

	async function start() {
		if (!$.get(model) || $.get(blocker)) return;

		$.set(forRun, false);

		await app.perform('mcp.run.start', {
			provider_id: $.get(model).provider.id,
			model: $.get(model).id,
			task: $.get(draft).task,
			auto_continue: $.get(draft).automatic,
			turn_budget: $.get(draft).turnBudget,
			work_minutes: $.get(draft).workMinutes
		});
	}

	async function approve() {
		if ($.get(run) && !app.busy('mcp.run.approve')) await app.perform('mcp.run.approve', {
			run_id: $.get(run).id,
			call_id: $.get(run).call_id,
			confirmed: true,
			allow_run: $.get(forRun)
		});
	}

	async function cancel() {
		if ($.get(run)) await app.perform('mcp.run.cancel', { run_id: $.get(run).id });
	}

	function remove(server) {
		void app.ask(`Remove ${server.label}?`, 'Disconnect this local server and remove its saved definition. The executable and its files will not be deleted.', 'Remove server', () => app.perform('mcp.server.remove', { server_id: server.id, confirmed: true }));
	}

	function chooseRecipe(value) {
		$.get(draft).label = value.label;
		$.get(draft).command = value.command;
		$.get(draft).argv = JSON.stringify(value.args, null, 2);
		$.get(draft).adding = true;
		$.set(library, false);
		$.set(formError, '');
	}

	const runLabels = {
		PAUSED: 'Ready to continue',
		IDLE: 'Idle',
		GENERATING: 'Model is responding',
		PERMISSION_REQUIRED: 'Waiting for your approval',
		EXECUTING_TOOL: 'Running the approved tool',
		RESULT_READY: 'Result ready to send',
		COMPLETED: 'Completed',
		FAILED: 'Task failed',
		CANCELLED: 'Stopped'
	};

	var section = root();
	var div = $.child(section);
	var header = $.child(div);
	var div_1 = $.sibling($.child(header));
	var node = $.child(div_1);

	{
		var consequent = ($$anchor) => {
			var fragment = root_1();
			var button = $.first_child(fragment);

			button.__click = () => {
				$.set(library, !$.get(library));
				$.get(draft).adding = false;
			};

			var details = $.sibling(button);
			var div_2 = $.sibling($.child(details));
			var button_1 = $.child(div_2);

			button_1.__click = importServers;

			var button_2 = $.sibling(button_1);

			button_2.__click = () => $.get(draft).adding = !$.get(draft).adding;

			var node_1 = $.child(button_2);

			Icon(node_1, { name: 'plus', size: 15 });
			$.next();
			$.reset(button_2);
			$.reset(div_2);
			$.reset(details);

			$.template_effect(() => {
				$.set_attribute(button, 'aria-expanded', $.get(library));
				button.disabled = !app.ready;
				button_1.disabled = $.get(running) || !app.ready;
				button_2.disabled = $.get(running) || !app.ready;
				$.set_attribute(button_2, 'aria-expanded', $.get(draft).adding);
			});

			$.append($$anchor, fragment);
		};

		$.if(node, ($$render) => {
			if (!$.get(running)) $$render(consequent);
		});
	}

	$.reset(div_1);
	$.reset(header);

	var node_2 = $.sibling(header, 2);

	{
		var consequent_9 = ($$anchor) => {
			var section_1 = root_2();
			var div_3 = $.child(section_1);
			var span = $.sibling($.child(div_3));
			let classes;
			var text = $.child(span);

			$.reset(span);
			$.reset(div_3);

			var node_3 = $.sibling(div_3, 2);

			{
				var consequent_1 = ($$anchor) => {
					var p_1 = root_3();
					var text_1 = $.child(p_1, true);

					$.reset(p_1);
					$.template_effect(($0) => $.set_text(text_1, $0), [() => errorText($.get(run).error)]);
					$.append($$anchor, p_1);
				};

				$.if(node_3, ($$render) => {
					if ($.get(run).error && !['CANCELLED', 'PAUSED'].includes($.get(run).state)) $$render(consequent_1);
				});
			}

			var node_4 = $.sibling(node_3, 2);

			{
				var consequent_2 = ($$anchor) => {
					var div_4 = root_4();
					var button_3 = $.sibling($.child(div_4));

					button_3.__click = () => app.perform('mcp.run.resume', { run_id: $.get(run).id });

					var text_2 = $.child(button_3, true);

					$.reset(button_3);
					$.next();
					$.reset(div_4);

					$.template_effect(
						($0, $1) => {
							button_3.disabled = $0;
							$.set_text(text_2, $1);
						},
						[
							() => !app.ready || !$.get(run).can_resume || app.busy('mcp.run.resume'),
							() => app.busy('mcp.run.resume') ? 'Continuing…' : 'Continue task'
						]
					);

					$.append($$anchor, div_4);
				};

				$.if(node_4, ($$render) => {
					if ($.get(run).state === 'PAUSED') $$render(consequent_2);
				});
			}

			var node_5 = $.sibling(node_4, 2);

			{
				var consequent_3 = ($$anchor) => {
					var div_5 = root_5();
					var span_1 = $.sibling($.child(div_5));
					var text_3 = $.child(span_1, true);

					$.reset(span_1);
					$.reset(div_5);

					$.template_effect(() => $.set_text(text_3, $.get(run).state === 'EXECUTING_TOOL'
						? $.get(pending)?.server.progress_message || 'Waiting for the approved tool to finish…'
						: 'Waiting for the website model…'));

					$.append($$anchor, div_5);
				};

				$.if(node_5, ($$render) => {
					if ($.get(run).state === 'GENERATING' || $.get(run).state === 'EXECUTING_TOOL') $$render(consequent_3);
				});
			}

			var node_6 = $.sibling(node_5, 2);

			{
				var consequent_4 = ($$anchor) => {
					var div_6 = root_6();
					var div_7 = $.child(div_6);
					var node_7 = $.sibling($.child(div_7));

					Icon(node_7, { name: 'shield', size: 17 });
					$.reset(div_7);

					var p_2 = $.sibling(div_7);
					var strong = $.child(p_2);
					var text_4 = $.child(strong, true);

					$.reset(strong);

					var text_5 = $.sibling(strong);

					$.reset(p_2);

					var pre = $.sibling(p_2);
					var text_6 = $.child(pre, true);

					$.reset(pre);

					var p_3 = $.sibling(pre);
					var text_7 = $.child(p_3);

					$.reset(p_3);

					var details_1 = $.sibling(p_3, 2);
					var label = $.sibling($.child(details_1));
					var input = $.sibling($.child(label));

					$.remove_input_defaults(input);
					$.reset(label);
					$.reset(details_1);

					var div_8 = $.sibling(details_1, 2);
					var button_4 = $.child(div_8);

					button_4.__click = approve;

					var text_8 = $.child(button_4, true);

					$.reset(button_4);

					var button_5 = $.sibling(button_4);

					button_5.__click = cancel;
					$.reset(div_8);
					$.reset(div_6);

					$.template_effect(
						($0, $1, $2, $3, $4) => {
							$.set_text(text_4, $.get(pending)?.name || $.get(run).tool);
							$.set_text(text_5, ` · ${($.get(pending)?.server.label || 'Server unavailable') ?? ''}`);
							$.set_text(text_6, $.get(run).arguments);
							$.set_text(text_7, `The result will be sent to ${$0 ?? ''}. Check paths, commands and destinations before approving.`);
							input.disabled = $1;
							button_4.disabled = $2;
							$.set_text(text_8, $3);
							button_5.disabled = $4;
						},
						[
							() => app.providers.find((p) => p.id === $.get(run).provider_id)?.label || 'the selected website',
							() => !app.ready || app.busy('mcp.run.approve'),
							() => !app.ready || !$.get(pending) || app.busy('mcp.run.approve'),
							() => app.busy('mcp.run.approve')
								? 'Approving…'
								: $.get(forRun) ? 'Allow tool for this task' : 'Allow once',
							() => !app.ready || app.busy('mcp.run.cancel')
						]
					);

					$.bind_checked(input, () => $.get(forRun), ($$value) => $.set(forRun, $$value));
					$.append($$anchor, div_6);
				};

				$.if(node_6, ($$render) => {
					if ($.get(run).state === 'PERMISSION_REQUIRED') $$render(consequent_4);
				});
			}

			var node_8 = $.sibling(node_6, 2);

			{
				var consequent_5 = ($$anchor) => {
					var fragment_1 = root_7();
					var button_6 = $.sibling($.first_child(fragment_1));

					button_6.__click = () => app.perform('mcp.run.continue', { run_id: $.get(run).id });
					$.template_effect(($0) => button_6.disabled = $0, [() => !app.ready || app.busy('mcp.run.continue')]);
					$.append($$anchor, fragment_1);
				};

				$.if(node_8, ($$render) => {
					if ($.get(run).state === 'RESULT_READY') $$render(consequent_5);
				});
			}

			var node_9 = $.sibling(node_8, 2);

			{
				var consequent_6 = ($$anchor) => {
					var pre_1 = root_8();
					var text_9 = $.child(pre_1, true);

					$.reset(pre_1);
					$.template_effect(() => $.set_text(text_9, $.get(run).answer));
					$.append($$anchor, pre_1);
				};

				$.if(node_9, ($$render) => {
					if ($.get(run).answer) $$render(consequent_6);
				});
			}

			var node_10 = $.sibling(node_9, 2);

			{
				var consequent_7 = ($$anchor) => {
					var details_2 = root_9();
					var pre_2 = $.sibling($.child(details_2));
					var text_10 = $.child(pre_2, true);

					$.reset(pre_2);
					$.reset(details_2);
					$.template_effect(() => $.set_text(text_10, $.get(run).last_result));
					$.append($$anchor, details_2);
				};

				$.if(node_10, ($$render) => {
					if ($.get(run).last_result) $$render(consequent_7);
				});
			}

			var node_11 = $.sibling(node_10, 2);

			{
				var consequent_8 = ($$anchor) => {
					var div_9 = root_10();
					var button_7 = $.child(div_9);

					button_7.__click = cancel;

					var button_8 = $.sibling(button_7);

					button_8.__click = () => app.openProvider($.get(run).provider_id);
					$.reset(div_9);

					$.template_effect(
						($0) => {
							button_7.disabled = $0;
							button_8.disabled = !app.ready;
						},
						[() => !app.ready || app.busy('mcp.run.cancel')]
					);

					$.append($$anchor, div_9);
				};

				$.if(node_11, ($$render) => {
					if ($.get(running)) $$render(consequent_8);
				});
			}

			$.reset(section_1);

			$.template_effect(() => {
				classes = $.set_class(span, 1, 'tag', null, classes, { attention: $.get(run).state === 'PERMISSION_REQUIRED' });
				$.set_text(text, `${runLabels[$.get(run).state] ?? ''} · ${$.get(run).turns ?? ''} ${$.get(run).turns === 1 ? 'turn' : 'turns'} · ${$.get(run).calls ?? ''} ${$.get(run).calls === 1 ? 'call' : 'calls'}`);
			});

			$.append($$anchor, section_1);
		};

		$.if(node_2, ($$render) => {
			if ($.get(run) && $.get(run).state !== 'IDLE') $$render(consequent_9);
		});
	}

	var node_12 = $.sibling(node_2, 2);

	{
		var consequent_12 = ($$anchor) => {
			var section_2 = root_11();
			var div_10 = $.child(section_2);
			var span_2 = $.sibling($.child(div_10));
			var text_11 = $.child(span_2);

			$.reset(span_2);
			$.reset(div_10);

			var label_1 = $.sibling(div_10, 2);
			var select = $.sibling($.child(label_1));

			select.__change = (e) => $.get(draft).chosen = e.currentTarget.value;

			var node_13 = $.child(select);

			{
				var consequent_10 = ($$anchor) => {
					var option = root_12();

					option.value = option.__value = '';
					$.append($$anchor, option);
				};

				$.if(node_13, ($$render) => {
					if (!$.get(model)) $$render(consequent_10);
				});
			}

			var node_14 = $.sibling(node_13);

			$.each(node_14, 17, () => app.exposedModels, (item) => item.id, ($$anchor, item) => {
				var option_1 = root_13();
				var text_12 = $.child(option_1);

				$.reset(option_1);

				var option_1_value = {};

				$.template_effect(() => {
					$.set_text(text_12, `${$.get(item).display_name ?? ''} · ${$.get(item).provider.label ?? ''}`);

					if (option_1_value !== (option_1_value = $.get(item).id)) {
						option_1.value = (option_1.__value = $.get(item).id) ?? '';
					}
				});

				$.append($$anchor, option_1);
			});

			$.reset(select);

			var select_value;

			$.init_select(select);
			$.reset(label_1);

			var label_2 = $.sibling(label_1, 2);
			var textarea = $.sibling($.child(label_2));

			$.remove_textarea_child(textarea);
			$.next();
			$.reset(label_2);

			var details_3 = $.sibling(label_2, 2);
			var label_3 = $.sibling($.child(details_3));
			var input_1 = $.sibling($.child(label_3));

			$.remove_input_defaults(input_1);
			$.reset(label_3);

			var div_11 = $.sibling(label_3, 2);
			var label_4 = $.child(div_11);
			var input_2 = $.sibling($.child(label_4));

			$.remove_input_defaults(input_2);
			$.reset(label_4);

			var label_5 = $.sibling(label_4);
			var input_3 = $.sibling($.child(label_5));

			$.remove_input_defaults(input_3);
			$.reset(label_5);
			$.reset(div_11);
			$.next(2);
			$.reset(details_3);

			var div_12 = $.sibling(details_3, 2);
			var button_9 = $.child(div_12);

			button_9.__click = start;

			var node_15 = $.child(button_9);

			Icon(node_15, { name: 'arrow', size: 15 });

			var text_13 = $.sibling(node_15, 1, true);

			$.reset(button_9);

			var node_16 = $.sibling(button_9);

			{
				var consequent_11 = ($$anchor) => {
					var button_10 = root_14();

					button_10.__click = () => app.openProvider($.get(model).provider.id);
					$.template_effect(() => button_10.disabled = !app.ready);
					$.append($$anchor, button_10);
				};

				$.if(node_16, ($$render) => {
					if ($.get(model)) $$render(consequent_11);
				});
			}

			$.reset(div_12);

			var p_4 = $.sibling(div_12, 2);
			var text_14 = $.child(p_4, true);

			$.reset(p_4);
			$.reset(section_2);

			$.template_effect(
				($0, $1) => {
					$.set_text(text_11, `${$.get(enabled).length ?? ''} enabled ${$.get(enabled).length === 1 ? 'tool' : 'tools'}`);
					select.disabled = !app.ready || !app.exposedModels.length;

					if (select_value !== (select_value = $.get(draft).chosen || $.get(model)?.id || '')) {
						(
							select.value = (select.__value = $.get(draft).chosen || $.get(model)?.id || '') ?? '',
							$.select_option(select, $.get(draft).chosen || $.get(model)?.id || '')
						);
					}

					button_9.disabled = $0;
					$.set_text(text_13, $1);
					$.set_text(text_14, $.get(blocker) || 'Approved results continue automatically unless disabled in Task options. No provider API key is required.');
				},
				[
					() => !!$.get(blocker) || app.busy('mcp.run.start'),
					() => app.busy('mcp.run.start') ? 'Starting…' : 'Start in website'
				]
			);

			$.bind_value(textarea, () => $.get(draft).task, ($$value) => $.get(draft).task = $$value);
			$.bind_checked(input_1, () => $.get(draft).automatic, ($$value) => $.get(draft).automatic = $$value);
			$.bind_value(input_2, () => $.get(draft).turnBudget, ($$value) => $.get(draft).turnBudget = $$value);
			$.bind_value(input_3, () => $.get(draft).workMinutes, ($$value) => $.get(draft).workMinutes = $$value);
			$.append($$anchor, section_2);
		};

		$.if(node_12, ($$render) => {
			if (!$.get(running) && !$.get(library) && !$.get(draft).adding && !$.get(consent)) $$render(consequent_12);
		});
	}

	var node_17 = $.sibling(node_12, 2);

	{
		var consequent_13 = ($$anchor) => {
			var section_3 = root_15();
			var div_13 = $.child(section_3);
			var button_11 = $.sibling($.child(div_13));

			button_11.__click = () => $.set(library, false);
			$.reset(div_13);

			var node_18 = $.sibling(div_13);

			{
				let $0 = $.derived(() => !app.ready);

				ToolLibrary(node_18, {
					onchoose: chooseRecipe,
					get disabled() {
						return $.get($0);
					}
				});
			}

			$.reset(section_3);
			$.append($$anchor, section_3);
		};

		$.if(node_17, ($$render) => {
			if ($.get(library) && !$.get(running)) $$render(consequent_13);
		});
	}

	var node_19 = $.sibling(node_17, 2);

	{
		var consequent_16 = ($$anchor) => {
			var section_4 = root_16();
			var form = $.sibling($.child(section_4));
			var node_20 = $.child(form);

			{
				var consequent_14 = ($$anchor) => {
					var label_6 = root_17();
					var select_1 = $.sibling($.child(label_6));

					select_1.__change = useImported;

					$.each(select_1, 21, () => $.get(imported), $.index, ($$anchor, definition, i) => {
						var option_2 = root_18();
						var text_15 = $.child(option_2, true);

						$.reset(option_2);
						option_2.value = option_2.__value = i;
						$.template_effect(() => $.set_text(text_15, $.get(definition).label));
						$.append($$anchor, option_2);
					});

					$.reset(select_1);
					$.next();
					$.reset(label_6);
					$.bind_select_value(select_1, () => $.get(importChoice), ($$value) => $.set(importChoice, $$value));
					$.append($$anchor, label_6);
				};

				$.if(node_20, ($$render) => {
					if ($.get(imported).length) $$render(consequent_14);
				});
			}

			var label_7 = $.sibling(node_20, 2);
			var input_4 = $.sibling($.child(label_7));

			$.remove_input_defaults(input_4);
			$.reset(label_7);

			var label_8 = $.sibling(label_7, 2);
			var input_5 = $.sibling($.child(label_8));

			$.remove_input_defaults(input_5);
			$.next();
			$.reset(label_8);

			var label_9 = $.sibling(label_8, 2);
			var textarea_1 = $.sibling($.child(label_9));

			$.remove_textarea_child(textarea_1);
			$.reset(label_9);

			var node_21 = $.sibling(label_9, 2);

			{
				var consequent_15 = ($$anchor) => {
					var p_5 = root_19();
					var text_16 = $.child(p_5, true);

					$.reset(p_5);
					$.template_effect(() => $.set_text(text_16, $.get(formError)));
					$.append($$anchor, p_5);
				};

				$.if(node_21, ($$render) => {
					if ($.get(formError)) $$render(consequent_15);
				});
			}

			var div_14 = $.sibling(node_21, 2);
			var button_12 = $.child(div_14);
			var text_17 = $.child(button_12, true);

			$.reset(button_12);

			var button_13 = $.sibling(button_12);

			button_13.__click = () => $.get(draft).adding = false;
			$.reset(div_14);
			$.reset(form);
			$.reset(section_4);

			$.template_effect(
				($0, $1) => {
					button_12.disabled = $0;
					$.set_text(text_17, $1);
				},
				[
					() => !app.ready || !$.get(draft).label.trim() || !$.get(draft).command.trim() || app.busy('mcp.server.add'),
					() => app.busy('mcp.server.add') ? 'Saving…' : 'Save server'
				]
			);

			$.event('submit', form, (e) => {
				e.preventDefault();
				void add();
			});

			$.bind_value(input_4, () => $.get(draft).label, ($$value) => $.get(draft).label = $$value);
			$.bind_value(input_5, () => $.get(draft).command, ($$value) => $.get(draft).command = $$value);
			$.bind_value(textarea_1, () => $.get(draft).argv, ($$value) => $.get(draft).argv = $$value);
			$.append($$anchor, section_4);
		};

		$.if(node_19, ($$render) => {
			if ($.get(draft).adding && !$.get(running)) $$render(consequent_16);
		});
	}

	var node_22 = $.sibling(node_19, 2);

	{
		var consequent_17 = ($$anchor) => {
			var section_5 = root_20();
			var div_15 = $.child(section_5);
			var node_23 = $.sibling($.child(div_15));

			Icon(node_23, { name: 'shield', size: 18 });
			$.reset(div_15);

			var p_6 = $.sibling(div_15);
			var strong_1 = $.child(p_6);
			var text_18 = $.child(strong_1, true);

			$.reset(strong_1);
			$.next();
			$.reset(p_6);

			var pre_3 = $.sibling(p_6);
			var text_19 = $.child(pre_3);

			$.reset(pre_3);

			var label_10 = $.sibling(pre_3);
			var input_6 = $.sibling($.child(label_10));

			$.remove_input_defaults(input_6);
			$.reset(label_10);

			var div_16 = $.sibling(label_10);
			var button_14 = $.child(div_16);

			button_14.__click = connect;

			var text_20 = $.child(button_14, true);

			$.reset(button_14);

			var button_15 = $.sibling(button_14);

			button_15.__click = () => {
				$.set(consent, null);
				$.set(trust, false);
			};

			$.reset(div_16);
			$.reset(section_5);
			$.bind_this(section_5, ($$value) => $.set(consentPanel, $$value), () => $.get(consentPanel));

			$.template_effect(
				($0, $1, $2) => {
					$.set_text(text_18, $.get(consent).label);

					$.set_text(text_19, `${$.get(consent).command ?? ''}
${$0 ?? ''}`);

					button_14.disabled = $1;
					$.set_text(text_20, $2);
				},
				[
					() => JSON.stringify($.get(consent).args, null, 2),
					() => !app.ready || !$.get(trust) || app.busy('mcp.server.connect'),
					() => app.busy('mcp.server.connect') ? 'Connecting…' : 'Allow process and connect'
				]
			);

			$.bind_checked(input_6, () => $.get(trust), ($$value) => $.set(trust, $$value));
			$.append($$anchor, section_5);
		};

		$.if(node_22, ($$render) => {
			if ($.get(consent)) $$render(consequent_17);
		});
	}

	var node_24 = $.sibling(node_22, 2);

	{
		var consequent_23 = ($$anchor) => {
			var fragment_2 = root_21();
			var section_6 = $.first_child(fragment_2);
			var div_17 = $.child(section_6);
			var span_3 = $.sibling($.child(div_17));
			var text_21 = $.child(span_3);

			$.reset(span_3);
			$.reset(div_17);

			var node_25 = $.sibling(div_17, 2);

			{
				var consequent_18 = ($$anchor) => {
					var div_18 = root_22();
					var node_26 = $.child(div_18);

					Icon(node_26, { name: 'terminal', size: 16 });
					$.next();
					$.reset(div_18);
					$.append($$anchor, div_18);
				};

				$.if(node_25, ($$render) => {
					if (!$.get(servers).length) $$render(consequent_18);
				});
			}

			var node_27 = $.sibling(node_25, 2);

			$.each(node_27, 17, () => $.get(servers), (server) => server.id, ($$anchor, server) => {
				var div_19 = root_23();
				var div_20 = $.child(div_19);
				var div_21 = $.child(div_20);
				var strong_2 = $.child(div_21);
				var text_22 = $.child(strong_2, true);

				$.reset(strong_2);

				var p_7 = $.sibling(strong_2);
				var text_23 = $.child(p_7);

				$.reset(p_7);
				$.reset(div_21);

				var div_22 = $.sibling(div_21);
				var node_28 = $.child(div_22);

				{
					var consequent_19 = ($$anchor) => {
						var button_16 = root_24();

						button_16.__click = () => {
							$.set(consent, $.get(server), true);
							$.set(trust, false);
						};

						$.template_effect(() => button_16.disabled = $.get(running) || !app.ready);
						$.append($$anchor, button_16);
					};

					var alternate = ($$anchor) => {
						var button_17 = root_25();

						button_17.__click = () => app.perform('mcp.server.disconnect', { server_id: $.get(server).id });

						$.template_effect(($0) => button_17.disabled = $0, [
							() => $.get(running) || !app.ready || app.busy('mcp.server.connect')
						]);

						$.append($$anchor, button_17);
					};

					$.if(node_28, ($$render) => {
						if (['DISCONNECTED', 'ERROR'].includes($.get(server).state)) $$render(consequent_19); else $$render(alternate, false);
					});
				}

				$.reset(div_22);
				$.reset(div_20);

				var node_29 = $.sibling(div_20, 2);

				{
					var consequent_20 = ($$anchor) => {
						var p_8 = root_26();
						var text_24 = $.child(p_8, true);

						$.reset(p_8);
						$.template_effect(($0) => $.set_text(text_24, $0), [() => errorText($.get(server).error)]);
						$.append($$anchor, p_8);
					};

					$.if(node_29, ($$render) => {
						if ($.get(server).error) $$render(consequent_20);
					});
				}

				var node_30 = $.sibling(node_29, 2);

				{
					var consequent_22 = ($$anchor) => {
						var details_4 = root_27();
						var summary = $.child(details_4);
						var text_25 = $.child(summary);

						$.reset(summary);

						var label_11 = $.sibling(summary);
						var input_7 = $.sibling($.child(label_11));

						$.remove_input_defaults(input_7);
						$.reset(label_11);

						var node_31 = $.sibling(label_11, 2);

						$.each(node_31, 17, () => $.get(server).tools.filter((t) => `${t.name} ${t.description}`.toLowerCase().includes($.get(toolFilter).toLowerCase())), (tool) => tool.alias, ($$anchor, tool) => {
							var label_12 = root_28();
							var div_23 = $.child(label_12);
							var strong_3 = $.child(div_23);
							var text_26 = $.child(strong_3, true);

							$.reset(strong_3);

							var p_9 = $.sibling(strong_3);
							var text_27 = $.child(p_9, true);

							$.reset(p_9);
							$.reset(div_23);

							var input_8 = $.sibling(div_23);

							$.remove_input_defaults(input_8);

							input_8.__change = (e) => {
								const value = e.currentTarget.checked;

								e.currentTarget.checked = $.get(tool).enabled;
								void app.perform('mcp.tool.update', { tool: $.get(tool).alias, enabled: value });
							};

							$.reset(label_12);

							$.template_effect(() => {
								$.set_text(text_26, $.get(tool).name);
								$.set_text(text_27, $.get(tool).description);
								$.set_attribute(input_8, 'aria-label', `Enable MCP tool ${$.get(tool).name}`);
								$.set_checked(input_8, $.get(tool).enabled);
								input_8.disabled = $.get(running) || !app.ready || $.get(server).state !== 'READY';
							});

							$.append($$anchor, label_12);
						});

						var node_32 = $.sibling(node_31);

						{
							var consequent_21 = ($$anchor) => {
								var p_10 = root_29();
								var button_18 = $.sibling($.child(p_10));

								button_18.__click = () => $.set(toolFilter, '');
								$.reset(p_10);
								$.append($$anchor, p_10);
							};

							$.if(node_32, ($$render) => {
								if (!$.get(server).tools.some((t) => `${t.name} ${t.description}`.toLowerCase().includes($.get(toolFilter).toLowerCase()))) $$render(consequent_21);
							});
						}

						$.next();
						$.reset(details_4);

						$.template_effect(
							($0) => {
								$.set_text(text_25, `Choose tools · ${$0 ?? ''} of ${$.get(server).tools.length ?? ''} enabled`);
								$.set_attribute(input_7, 'aria-label', `Filter ${$.get(server).label} tools`);
							},
							[() => $.get(server).tools.filter((t) => t.enabled).length]
						);

						$.bind_value(input_7, () => $.get(toolFilter), ($$value) => $.set(toolFilter, $$value));
						$.append($$anchor, details_4);
					};

					$.if(node_30, ($$render) => {
						if ($.get(server).tools.length) $$render(consequent_22);
					});
				}

				var details_5 = $.sibling(node_30, 2);
				var p_11 = $.sibling($.child(details_5));
				var text_28 = $.child(p_11);

				$.reset(p_11);

				var pre_4 = $.sibling(p_11);
				var text_29 = $.child(pre_4);

				$.reset(pre_4);

				var node_33 = $.sibling(pre_4);

				$.each(node_33, 17, () => $.get(server).tools, (tool) => tool.alias, ($$anchor, tool) => {
					var details_6 = root_30();
					var summary_1 = $.child(details_6);
					var text_30 = $.child(summary_1, true);

					$.reset(summary_1);

					var pre_5 = $.sibling(summary_1);
					var text_31 = $.child(pre_5, true);

					$.reset(pre_5);
					$.reset(details_6);

					$.template_effect(
						($0) => {
							$.set_text(text_30, $.get(tool).name);
							$.set_text(text_31, $0);
						},
						[() => JSON.stringify($.get(tool).schema, null, 2)]
					);

					$.append($$anchor, details_6);
				});

				var button_19 = $.sibling(node_33, 2);

				button_19.__click = () => remove($.get(server));
				$.reset(details_5);
				$.reset(div_19);

				$.template_effect(
					($0, $1, $2, $3) => {
						$.set_text(text_22, $.get(server).label);
						$.set_text(text_23, `${$0 ?? ''} · ${$1 ?? ''} ${$2 ?? ''} enabled`);
						$.set_text(text_28, `MCP ${($.get(server).protocol || 'not negotiated') ?? ''} · local stdio`);

						$.set_text(text_29, `${$.get(server).command ?? ''}
${$3 ?? ''}`);

						button_19.disabled = $.get(running) || !app.ready;
					},
					[
						() => $.get(server).state.toLowerCase().replaceAll('_', ' '),
						() => $.get(server).tools.filter((t) => t.enabled).length,
						() => $.get(server).tools.filter((t) => t.enabled).length === 1 ? 'tool' : 'tools',
						() => JSON.stringify($.get(server).args, null, 2)
					]
				);

				$.append($$anchor, div_19);
			});

			$.reset(section_6);

			var details_7 = $.sibling(section_6, 2);
			var node_34 = $.sibling($.child(details_7));

			FileProbe(node_34, {});
			$.reset(details_7);
			$.template_effect(() => $.set_text(text_21, `${$.get(servers).length ?? ''} configured`));
			$.append($$anchor, fragment_2);
		};

		$.if(node_24, ($$render) => {
			if (!$.get(running) && !$.get(library) && !$.get(draft).adding && !$.get(consent)) $$render(consequent_23);
		});
	}

	$.reset(div);
	$.reset(section);
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click', 'change']);