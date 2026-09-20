import '../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import * as bridge from '../lib/api/bridge.js';
import { mappingNames } from '../lib/types/bridge.js';
import Icon from '../lib/components/Icon.svelte.js';

var root_1 = $.from_html(`<option> </option>`);
var root_4 = $.from_html(`<option> </option>`);
var root_3 = $.from_html(`<tr><td><span class="inline" style="gap:7px"><!> </span></td><td><select><option> </option><!></select></td><td><div class="row-actions"><button title="Save this mapping"><!></button><button title="Pick on website"><!></button></div></td></tr>`);
var root_7 = $.from_html(`<pre style="font-size:10px"> </pre>`);
var root_2 = $.from_html(`<div class="filterbar"><span class="tag"><!>Symbolic detector</span><span class="count"> </span><span class="spacer"></span><button class="text-button"><!>Import</button><button class="text-button"><!>Export</button><button class="secondary"><!>Rescan page</button></div> <div class="lab-columns" style="margin-top:26px"><div><div class="section-title"><h2>Control mappings</h2><small> </small></div><p class="field-hint" style="margin-bottom:13px">Pick a control on the website or select an observed element. The backend validates its role and rejects sensitive fields.</p><table class="mapping-table"><thead><tr><th>OPERATION</th><th>OBSERVED ELEMENT</th><th></th></tr></thead><tbody></tbody></table><section class="section"><h3 style="margin-bottom:12px">Website with a fixed model</h3><p class="field-hint" style="margin-bottom:12px">Use the website’s visible model label when it does not expose a selector. This is recorded as user supplied, not automatically discovered.</p><form class="inline"><input aria-label="Fixed model label" placeholder="Visible model name" maxlength="240" style="flex:1;min-width:0" required/><button class="secondary">Save label</button></form></section><section class="section" style="border:0"><div class="section-title"><h3>Repair learned mappings</h3><button class="text-button">Reset to automatic</button></div><p>Reset clears user-recorded selectors. Automatic discovery then runs against the current document; no prompt is sent.</p></section></div> <aside><div class="section-title"><h2>Current evidence</h2><span class="tag">Sanitized</span></div><div class="evidence-box"><!></div><div class="note"><!><span>Password fields are counted, never read. Network events retain bounded structure and timing, not cookies or authentication headers.</span></div><section class="section"><div class="section-title"><h3>TNN research boundary</h3><span class="count">GATED</span></div><p> </p><p style="margin-top:12px">This application does not substitute invented TNN predictions for a missing model. The research integration contract and action validator remain separate from production control.</p></section></aside></div>`, 1);
var root_9 = $.from_html(`<div class="empty-state"><!><h2>Choose a website to inspect</h2><p>Each profile has its own evidence, semantic mappings, and connector version. Start by opening an AI chat website.</p><button class="secondary">Open browser</button></div>`);
var root = $.from_html(`<section class="screen"><div class="screen-inner"><header class="screen-head"><div><div class="breadcrumb">Workspace / Discovery</div><h1>Detector lab</h1><p>Inspect the evidence, repair a mapping, or export a reusable connector.</p></div><select aria-label="Inspect website"><option>Choose a website</option><!></select></header> <!></div></section>`);

export default function Detector($$anchor, $$props) {
	$.push($$props, true);

	let evidence = $.state(null);
	let manual = $.state('');
	let loading = $.state(false);
	let requestVersion = 0;
	const roles = Object.keys(mappingNames);
	let choices = $.state($.proxy({}));
	const controls = $.derived(() => $.get(evidence)?.controls ?? []);

	$.user_effect(() => {
		const id = app.provider?.id,
			version = app.provider?.mapping_version;

		void version;

		const ticket = ++requestVersion;

		if (!id) {
			$.set(evidence, null);

			return;
		}

		$.set(loading, true);

		void bridge.request('detector.evidence', { provider_id: id }).then((result) => {
			if (ticket === requestVersion) {
				$.set(evidence, result, true);
				$.set(choices, {}, true);
			}
		}).catch((error) => {
			if (ticket === requestVersion) app.error = String(error);
		}).finally(() => {
			if (ticket === requestVersion) $.set(loading, false);
		});
	});

	async function record(role) {
		if (!app.provider || !$.get(evidence) || !$.get(choices)[role]) return;

		await app.perform('connector.record', {
			provider_id: app.provider.id,
			document_id: $.get(evidence).document_id,
			mapping: role,
			node: Number($.get(choices)[role])
		});
	}

	async function exportConnector() {
		if (!app.provider) return;

		const data = await app.perform('connector.export', { provider_id: app.provider.id });

		if (data !== undefined) await app.export(`bridge-connector-${app.provider.id}.json`, data);
	}

	async function importConnector() {
		if (!app.provider) return;

		try {
			const data = await bridge.importDocument();

			if (data) await app.perform('connector.import', { provider_id: app.provider.id, connector: data });
		} catch(error) {
			app.error = String(error);
		}
	}

	var section = root();
	var div = $.child(section);
	var header = $.child(div);
	var select = $.sibling($.child(header));

	select.__change = (event) => app.selectedProvider = Number(event.currentTarget.value) || null;

	var option = $.child(select);

	option.value = option.__value = '';

	var node = $.sibling(option);

	$.each(node, 17, () => app.providers, $.index, ($$anchor, p) => {
		var option_1 = root_1();
		var text = $.child(option_1, true);

		$.reset(option_1);

		var option_1_value = {};

		$.template_effect(() => {
			$.set_text(text, $.get(p).label);

			if (option_1_value !== (option_1_value = $.get(p).id)) {
				option_1.value = (option_1.__value = $.get(p).id) ?? '';
			}
		});

		$.append($$anchor, option_1);
	});

	$.reset(select);

	var select_value;

	$.init_select(select);
	$.reset(header);

	var node_1 = $.sibling(header, 2);

	{
		var consequent_2 = ($$anchor) => {
			const p = $.derived(() => app.provider);
			var fragment = root_2();
			var div_1 = $.first_child(fragment);
			var span = $.child(div_1);
			var node_2 = $.child(span);

			Icon(node_2, { name: 'scan', size: 14 });
			$.next();
			$.reset(span);

			var span_1 = $.sibling(span);
			var text_1 = $.child(span_1);

			$.reset(span_1);

			var button = $.sibling(span_1, 2);

			button.__click = importConnector;

			var node_3 = $.child(button);

			Icon(node_3, { name: 'upload', size: 13 });
			$.next();
			$.reset(button);

			var button_1 = $.sibling(button);

			button_1.__click = exportConnector;

			var node_4 = $.child(button_1);

			Icon(node_4, { name: 'download', size: 13 });
			$.next();
			$.reset(button_1);

			var button_2 = $.sibling(button_1);

			button_2.__click = () => app.perform('provider.rescan', { provider_id: $.get(p).id });

			var node_5 = $.child(button_2);

			Icon(node_5, { name: 'refresh', size: 13 });
			$.next();
			$.reset(button_2);
			$.reset(div_1);

			var div_2 = $.sibling(div_1, 2);
			var div_3 = $.child(div_2);
			var div_4 = $.child(div_3);
			var small = $.sibling($.child(div_4));
			var text_2 = $.child(small);

			$.reset(small);
			$.reset(div_4);

			var table = $.sibling(div_4, 2);
			var tbody = $.sibling($.child(table));

			$.each(tbody, 20, () => roles, (role) => role, ($$anchor, role) => {
				var tr = root_3();
				var td = $.child(tr);
				var span_2 = $.child(td);
				var node_6 = $.child(span_2);

				{
					let $0 = $.derived(() => $.get(p).mappings[role] ? 'check' : 'plus');

					Icon(node_6, {
						get name() {
							return $.get($0);
						},
						size: 12
					});
				}

				var text_3 = $.sibling(node_6, 1, true);

				$.reset(span_2);
				$.reset(td);

				var td_1 = $.sibling(td);
				var select_1 = $.child(td_1);

				select_1.__change = (event) => $.set(choices, { ...$.get(choices), [role]: event.currentTarget.value }, true);

				var option_2 = $.child(select_1);
				var text_4 = $.child(option_2, true);

				$.reset(option_2);
				option_2.value = option_2.__value = '';

				var node_7 = $.sibling(option_2);

				$.each(node_7, 17, () => $.get(controls).filter((c) => (c.visible || role === 'attachment' && c.file_input) && !c.disabled), (control) => control.id, ($$anchor, control) => {
					var option_3 = root_4();
					var text_5 = $.child(option_3);

					$.reset(option_3);

					var option_3_value = {};

					$.template_effect(() => {
						$.set_text(text_5, `${$.get(control).id ?? ''} · ${($.get(control).label || $.get(control).role || $.get(control).tag) ?? ''}`);

						if (option_3_value !== (option_3_value = $.get(control).id)) {
							option_3.value = (option_3.__value = $.get(control).id) ?? '';
						}
					});

					$.append($$anchor, option_3);
				});

				$.reset(select_1);

				var select_1_value;

				$.init_select(select_1);
				$.reset(td_1);

				var td_2 = $.sibling(td_1);
				var div_5 = $.child(td_2);
				var button_3 = $.child(div_5);

				button_3.__click = () => record(role);

				var node_8 = $.child(button_3);

				Icon(node_8, { name: 'check', size: 13 });
				$.reset(button_3);

				var button_4 = $.sibling(button_3);

				button_4.__click = () => app.pick(role);

				var node_9 = $.child(button_4);

				Icon(node_9, { name: 'scan', size: 13 });
				$.reset(button_4);
				$.reset(div_5);
				$.reset(td_2);
				$.reset(tr);

				$.template_effect(() => {
					$.set_text(text_3, mappingNames[role]);
					$.set_attribute(select_1, 'aria-label', `${mappingNames[role]} element`);
					select_1.disabled = $.get(p).active;

					$.set_text(text_4, $.get(p).mappings[role]
						? `Mapped · node ${$.get(p).mappings[role]}`
						: 'Choose an element');

					if (select_1_value !== (select_1_value = $.get(choices)[role] ?? '')) {
						(
							select_1.value = (select_1.__value = $.get(choices)[role] ?? '') ?? '',
							$.select_option(select_1, $.get(choices)[role] ?? '')
						);
					}

					button_3.disabled = $.get(p).active || !$.get(choices)[role];
					$.set_attribute(button_3, 'aria-label', `Save ${mappingNames[role]} mapping`);
					button_4.disabled = $.get(p).active;
					$.set_attribute(button_4, 'aria-label', `Pick ${mappingNames[role]} on page`);
				});

				$.append($$anchor, tr);
			});

			$.reset(tbody);
			$.reset(table);

			var section_1 = $.sibling(table);
			var form = $.sibling($.child(section_1), 2);
			var input = $.child(form);

			$.remove_input_defaults(input);

			var button_5 = $.sibling(input);

			$.reset(form);
			$.reset(section_1);

			var section_2 = $.sibling(section_1);
			var div_6 = $.child(section_2);
			var button_6 = $.sibling($.child(div_6));

			button_6.__click = () => app.ask('Reset recorded controls?', `This removes manually recorded controls for ${$.get(p).label}. Automatic discovery will run again without sending a prompt.`, 'Reset controls', () => app.perform('connector.reset', { provider_id: $.get(p).id, confirmed: true }));
			$.reset(div_6);
			$.next();
			$.reset(section_2);
			$.reset(div_3);

			var aside = $.sibling(div_3, 2);
			var div_7 = $.sibling($.child(aside));
			var node_10 = $.child(div_7);

			{
				var consequent = ($$anchor) => {
					var text_6 = $.text('Reading the current document…');

					$.append($$anchor, text_6);
				};

				var alternate_1 = ($$anchor) => {
					var fragment_1 = $.comment();
					var node_11 = $.first_child(fragment_1);

					{
						var consequent_1 = ($$anchor) => {
							var pre = root_7();
							var text_7 = $.child(pre, true);

							$.reset(pre);
							$.template_effect(($0) => $.set_text(text_7, $0), [() => JSON.stringify($.get(evidence), null, 2)]);
							$.append($$anchor, pre);
						};

						var alternate = ($$anchor) => {
							var text_8 = $.text('No observation has arrived. Open the website, sign in, and rescan.');

							$.append($$anchor, text_8);
						};

						$.if(
							node_11,
							($$render) => {
								if ($.get(evidence)) $$render(consequent_1); else $$render(alternate, false);
							},
							true
						);
					}

					$.append($$anchor, fragment_1);
				};

				$.if(node_10, ($$render) => {
					if ($.get(loading)) $$render(consequent); else $$render(alternate_1, false);
				});
			}

			$.reset(div_7);

			var div_8 = $.sibling(div_7);
			var node_12 = $.child(div_8);

			Icon(node_12, { name: 'shield', size: 15 });
			$.next();
			$.reset(div_8);

			var section_3 = $.sibling(div_8);
			var p_1 = $.sibling($.child(section_3));
			var text_9 = $.child(p_1, true);

			$.reset(p_1);
			$.next();
			$.reset(section_3);
			$.reset(aside);
			$.reset(div_2);

			$.template_effect(
				($0) => {
					$.set_text(text_1, `MAPPING ${$.get(p).mapping_version ?? ''}`);
					button.disabled = $.get(p).active;
					button_2.disabled = $.get(p).active || $.get(loading);
					$.set_text(text_2, `${$.get(controls).length ?? ''} observed elements`);
					button_5.disabled = $0;
					button_6.disabled = $.get(p).active;
					$.set_text(text_9, app.snapshot?.detector.reason || 'A production-qualified TNN artifact has not been admitted. Symbolic discovery remains authoritative.');
				},
				[() => $.get(p).active || !$.get(manual).trim()]
			);

			$.event('submit', form, (event) => {
				event.preventDefault();
				void app.perform('connector.manual_model', { provider_id: $.get(p).id, label: $.get(manual).trim() });
			});

			$.bind_value(input, () => $.get(manual), ($$value) => $.set(manual, $$value));
			$.append($$anchor, fragment);
		};

		var alternate_2 = ($$anchor) => {
			var div_9 = root_9();
			var node_13 = $.child(div_9);

			Icon(node_13, { name: 'scan', size: 29 });

			var button_7 = $.sibling(node_13, 3);

			button_7.__click = () => app.navigate('browser');
			$.reset(div_9);
			$.append($$anchor, div_9);
		};

		$.if(node_1, ($$render) => {
			if (app.provider) $$render(consequent_2); else $$render(alternate_2, false);
		});
	}

	$.reset(div);
	$.reset(section);

	$.template_effect(() => {
		if (select_value !== (select_value = app.selectedProvider ?? '')) {
			(
				select.value = (select.__value = app.selectedProvider ?? '') ?? '',
				$.select_option(select, app.selectedProvider ?? '')
			);
		}
	});

	$.append($$anchor, section);
	$.pop();
}

$.delegate(['change', 'click']);