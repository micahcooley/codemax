import '../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import Icon from '../lib/components/Icon.svelte.js';
import { number, providerText, initials } from '../lib/format.js';

var root_2 = $.from_html(`<button><span class="site-letter"> </span><span class="site-details"><strong> </strong><small> </small></span></button>`);
var root_3 = $.from_html(`<label class="setting-line"><div><strong> </strong><p><code> </code> </p></div><input type="checkbox"/></label>`);
var root_4 = $.from_html(`<tr><td> </td><td> </td></tr><tr><td> </td><td> </td></tr>`, 1);
var root_5 = $.from_html(`<option> </option>`);
var root_1 = $.from_html(`<div class="provider-settings"><nav class="provider-selector" aria-label="Detected providers"><!> <p class="discovery-note"><!> Discovery runs while you browse. It never opens menus, changes your model, or spends quota just to test a website.</p></nav> <div><section class="section"><div class="section-title"><div><h2> </h2><p class="mono" style="font-size:11px;margin-top:7px"> </p></div><button class="secondary"><!>Open tab</button></div> <label class="setting-line"><div><strong>Available to my harness</strong><p>Publish enabled models to the local model registry. Turning this off also cancels an active request.</p></div><input type="checkbox" aria-label="Expose provider to harness"/></label> <label class="setting-line"><div><strong>Keep discovering this website</strong><p>Watch control changes and selected capability fields. Passwords and authentication data stay in the browser.</p></div><input type="checkbox" aria-label="Scan provider automatically"/></label> <div class="discovery-note"><!> <br/><span class="faint">Website evidence, not a guarantee of the model’s underlying identity.</span></div></section> <section class="section"><div class="section-title"><h2>Exposed models</h2><span class="tag"> </span></div> <!></section> <section class="section"><div class="section-title"><h2>What the website exposes</h2><span class="tag">Evidence, not guesses</span></div><table class="permission-table"><tbody><tr><td>Current model</td><td> </td></tr><tr><td>Reasoning levels</td><td> </td></tr><!></tbody></table><p class="field-hint" style="margin-top:14px">A model’s nominal context window does not establish the website’s usable conversation budget. Hidden options become discoverable when you open their controls normally.</p></section> <details class="advanced-client"><summary>Advanced · overrides, mapping, and lifecycle</summary> <label class="field"><span>Display name</span><input maxlength="240"/></label> <label class="field"><span>Context budget override · explicitly user supplied</span><input type="number" min="0" max="10000000"/><span class="field-hint">0 leaves the limit unknown. This does not change provider limits or prove exact token counts.</span></label> <label class="field"><span>Preferred reasoning value</span><select><option>Leave website default</option><!></select></label> <div class="button-group"><button class="primary">Save overrides</button><button class="secondary">Inspect mappings</button><button class="secondary">Rescan</button></div> <label class="setting-line"><div><strong>Keep this website awake</strong><p>Avoid idle suspension. Active requests are always kept awake.</p></div><input type="checkbox"/></label> <button class="text-button danger-text" style="margin-top:18px">Treat as an ordinary website</button></details></div></div>`);
var root_6 = $.from_html(`<div class="empty-state"><!><h2>Browse first. Providers follow.</h2><p>No websites have passed discovery yet. Open an AI chat website and sign in normally. A search box, login form, model mention, or ordinary page does not make a provider.</p><button class="primary">Open a browser tab<!></button></div>`);
var root_9 = $.from_html(`<button class="text-button">Resume discovery</button>`);
var root_8 = $.from_html(`<div class="setting-line"><div><strong> </strong><p> </p></div><button class="text-button">Open</button><!></div>`);
var root_7 = $.from_html(`<details class="advanced-client"><summary> </summary><!></details>`);
var root = $.from_html(`<section class="screen"><div class="screen-inner"><header class="screen-head"><div><div class="breadcrumb">Codemax / Discovered websites</div><h1>Providers</h1><p>Only websites with positive chat and model evidence appear here. Choose what your harness can use.</p></div><button class="secondary"><!>Browse a website</button></header> <!> <!></div></section>`);

export default function Providers($$anchor, $$props) {
	$.push($$props, true);

	let selected = $.state(null);
	let hint = $.state(0);
	let reasoning = $.state('');
	let label = $.state('');
	let loaded = 0;
	const sites = $.derived(() => app.detectedProviders);
	const current = $.derived(() => $.get(sites).find((p) => p.id === $.get(selected)) || $.get(sites).find((p) => p.id === app.selectedProvider) || $.get(sites)[0]);
	const ordinary = $.derived(() => app.providers.filter((p) => !p.detected || p.dismissed));

	$.user_effect(() => {
		if ($.get(current) && loaded !== $.get(current).id) {
			loaded = $.get(current).id;
			$.set(label, $.get(current).label, true);
			$.set(hint, $.get(current).context_hint, true);
			$.set(reasoning, $.get(current).reasoning_value, true);
		}
	});

	async function policy(patch) {
		if ($.get(current)) await app.perform('provider.update', { provider_id: $.get(current).id, ...patch });
	}

	async function save() {
		await policy({
			label: $.get(label),
			context_hint: Number($.get(hint)),
			reasoning_value: $.get(reasoning)
		});
	}

	var section = root();
	var div = $.child(section);
	var header = $.child(div);
	var button = $.sibling($.child(header));

	button.__click = () => app.newTab();

	var node = $.child(button);

	Icon(node, { name: 'plus', size: 15 });
	$.next();
	$.reset(button);
	$.reset(header);

	var node_1 = $.sibling(header, 2);

	{
		var consequent = ($$anchor) => {
			var div_1 = root_1();
			var nav = $.child(div_1);
			var node_2 = $.child(nav);

			$.each(node_2, 17, () => $.get(sites), (site) => site.id, ($$anchor, site) => {
				var button_1 = root_2();
				let classes;

				button_1.__click = () => $.set(selected, $.get(site).id, true);

				var span = $.child(button_1);
				var text = $.child(span, true);

				$.reset(span);

				var span_1 = $.sibling(span);
				var strong = $.child(span_1);
				var text_1 = $.child(strong, true);

				$.reset(strong);

				var small = $.sibling(strong);
				var text_2 = $.child(small);

				$.reset(small);
				$.reset(span_1);
				$.reset(button_1);

				$.template_effect(
					($0, $1, $2) => {
						classes = $.set_class(button_1, 1, 'provider-choice', null, classes, { active: $.get(current).id === $.get(site).id });
						$.set_text(text, $0);
						$.set_text(text_1, $.get(site).label);
						$.set_text(text_2, `${$1 ?? ''} enabled · ${$2 ?? ''}`);
					},
					[
						() => initials($.get(site).label),
						() => $.get(site).models.filter((m) => m.enabled).length,
						() => providerText($.get(site))
					]
				);

				$.append($$anchor, button_1);
			});

			var p_1 = $.sibling(node_2, 2);
			var node_3 = $.child(p_1);

			Icon(node_3, { name: 'scan', size: 13 });
			$.next();
			$.reset(p_1);
			$.reset(nav);

			var div_2 = $.sibling(nav, 2);
			var section_1 = $.child(div_2);
			var div_3 = $.child(section_1);
			var div_4 = $.child(div_3);
			var h2 = $.child(div_4);
			var text_3 = $.child(h2, true);

			$.reset(h2);

			var p_2 = $.sibling(h2);
			var text_4 = $.child(p_2, true);

			$.reset(p_2);
			$.reset(div_4);

			var button_2 = $.sibling(div_4);

			button_2.__click = () => app.openProvider($.get(current).id);

			var node_4 = $.child(button_2);

			Icon(node_4, { name: 'globe', size: 14 });
			$.next();
			$.reset(button_2);
			$.reset(div_3);

			var label_1 = $.sibling(div_3, 2);
			var input = $.sibling($.child(label_1));

			$.remove_input_defaults(input);
			input.__change = (e) => policy({ exposed: e.currentTarget.checked });
			$.reset(label_1);

			var label_2 = $.sibling(label_1, 2);
			var input_1 = $.sibling($.child(label_2));

			$.remove_input_defaults(input_1);
			input_1.__change = (e) => policy({ scan_enabled: e.currentTarget.checked });
			$.reset(label_2);

			var div_5 = $.sibling(label_2, 2);
			var node_5 = $.child(div_5);

			Icon(node_5, { name: 'check', size: 14 });

			var text_5 = $.sibling(node_5);

			$.next(2);
			$.reset(div_5);
			$.reset(section_1);

			var section_2 = $.sibling(section_1, 2);
			var div_6 = $.child(section_2);
			var span_2 = $.sibling($.child(div_6));
			var text_6 = $.child(span_2);

			$.reset(span_2);
			$.reset(div_6);

			var node_6 = $.sibling(div_6, 2);

			$.each(node_6, 17, () => $.get(current).models, (model) => model.id, ($$anchor, model) => {
				var label_3 = root_3();
				var div_7 = $.child(label_3);
				var strong_1 = $.child(div_7);
				var text_7 = $.child(strong_1, true);

				$.reset(strong_1);

				var p_3 = $.sibling(strong_1);
				var code = $.child(p_3);
				var text_8 = $.child(code, true);

				$.reset(code);

				var text_9 = $.sibling(code);

				$.reset(p_3);
				$.reset(div_7);

				var input_2 = $.sibling(div_7);

				$.remove_input_defaults(input_2);

				input_2.__change = (e) => app.perform('model.update', {
					provider_id: $.get(current).id,
					model: $.get(model).id,
					enabled: e.currentTarget.checked
				});

				$.reset(label_3);

				$.template_effect(() => {
					$.set_text(text_7, $.get(model).display_name);
					$.set_text(text_8, $.get(model).id);

					$.set_text(text_9, ` · ${$.get(model).available
						? 'Observed in this browser session'
						: 'Recheck when this website opens'}`);

					$.set_attribute(input_2, 'aria-label', `Expose ${$.get(model).display_name}`);
					$.set_checked(input_2, $.get(model).enabled);
				});

				$.append($$anchor, label_3);
			});

			$.reset(section_2);

			var section_3 = $.sibling(section_2, 2);
			var table = $.sibling($.child(section_3));
			var tbody = $.child(table);
			var tr = $.child(tbody);
			var td = $.sibling($.child(tr));
			var text_10 = $.child(td, true);

			$.reset(td);
			$.reset(tr);

			var tr_1 = $.sibling(tr);
			var td_1 = $.sibling($.child(tr_1));
			var text_11 = $.child(td_1, true);

			$.reset(td_1);
			$.reset(tr_1);

			var node_7 = $.sibling(tr_1);

			$.each(node_7, 17, () => $.get(current).models, (model) => model.id, ($$anchor, model) => {
				var fragment = root_4();
				var tr_2 = $.first_child(fragment);
				var td_2 = $.child(tr_2);
				var text_12 = $.child(td_2);

				$.reset(td_2);

				var td_3 = $.sibling(td_2);
				var text_13 = $.child(td_3, true);

				$.reset(td_3);
				$.reset(tr_2);

				var tr_3 = $.sibling(tr_2);
				var td_4 = $.child(tr_3);
				var text_14 = $.child(td_4);

				$.reset(td_4);

				var td_5 = $.sibling(td_4);
				var text_15 = $.child(td_5, true);

				$.reset(td_5);
				$.reset(tr_3);

				$.template_effect(
					($0) => {
						$.set_text(text_12, `${$.get(model).display_name ?? ''} · context`);
						$.set_text(text_13, $0);
						$.set_text(text_14, `${$.get(model).display_name ?? ''} · tokenizer`);

						$.set_text(text_15, $.get(model).tokenizer.name
							? `${$.get(model).tokenizer.name} · identity only`
							: 'Unknown; usage remains estimated');
					},
					[
						() => $.get(model).context.nominal
							? `${number($.get(model).context.nominal)} · website reported`
							: 'Unknown'
					]
				);

				$.append($$anchor, fragment);
			});

			$.reset(tbody);
			$.reset(table);
			$.next();
			$.reset(section_3);

			var details = $.sibling(section_3, 2);
			var label_4 = $.sibling($.child(details), 2);
			var input_3 = $.sibling($.child(label_4));

			$.remove_input_defaults(input_3);
			$.reset(label_4);

			var label_5 = $.sibling(label_4, 2);
			var input_4 = $.sibling($.child(label_5));

			$.remove_input_defaults(input_4);
			$.next();
			$.reset(label_5);

			var label_6 = $.sibling(label_5, 2);
			var select = $.sibling($.child(label_6));
			var option = $.child(select);

			option.value = option.__value = '';

			var node_8 = $.sibling(option);

			$.each(node_8, 17, () => $.get(current).reasoning_modes || [], $.index, ($$anchor, mode) => {
				var option_1 = root_5();
				var text_16 = $.child(option_1, true);

				$.reset(option_1);

				var option_1_value = {};

				$.template_effect(() => {
					$.set_text(text_16, $.get(mode).label);

					if (option_1_value !== (option_1_value = $.get(mode).value)) {
						option_1.value = (option_1.__value = $.get(mode).value) ?? '';
					}
				});

				$.append($$anchor, option_1);
			});

			$.reset(select);
			$.reset(label_6);

			var div_8 = $.sibling(label_6, 2);
			var button_3 = $.child(div_8);

			button_3.__click = save;

			var button_4 = $.sibling(button_3);

			button_4.__click = () => {
				app.selectedProvider = $.get(current).id;
				app.navigate('detector');
			};

			var button_5 = $.sibling(button_4);

			button_5.__click = () => app.perform('provider.rescan', { provider_id: $.get(current).id });
			$.reset(div_8);

			var label_7 = $.sibling(div_8, 2);
			var input_5 = $.sibling($.child(label_7));

			$.remove_input_defaults(input_5);
			input_5.__change = (e) => policy({ pinned: e.currentTarget.checked });
			$.reset(label_7);

			var button_6 = $.sibling(label_7, 2);

			button_6.__click = () => policy({ dismissed: true, exposed: false });
			$.reset(details);
			$.reset(div_2);
			$.reset(div_1);

			$.template_effect(
				($0, $1) => {
					$.set_text(text_3, $.get(current).label);
					$.set_text(text_4, $.get(current).origin);
					$.set_checked(input, $.get(current).exposed);
					$.set_checked(input_1, $.get(current).scan_enabled);
					$.set_text(text_5, ` ${$.get(current).discovery_reason ?? ''}`);
					$.set_text(text_6, `${$0 ?? ''} of ${$.get(current).models.length ?? ''}`);
					$.set_text(text_10, $.get(current).current_model || 'Not exposed yet');
					$.set_text(text_11, $1);
					button_3.disabled = !!$.get(current).active;
					$.set_checked(input_5, $.get(current).pinned);
				},
				[
					() => $.get(current).models.filter((m) => m.enabled).length,
					() => $.get(current).reasoning_modes?.length
						? $.get(current).reasoning_modes.map((m) => m.label).join(' · ')
						: $.get(current).mappings.reasoning ? 'Control observed; options unknown' : 'Unknown'
				]
			);

			$.bind_value(input_3, () => $.get(label), ($$value) => $.set(label, $$value));
			$.bind_value(input_4, () => $.get(hint), ($$value) => $.set(hint, $$value));
			$.bind_select_value(select, () => $.get(reasoning), ($$value) => $.set(reasoning, $$value));
			$.append($$anchor, div_1);
		};

		var alternate = ($$anchor) => {
			var div_9 = root_6();
			var node_9 = $.child(div_9);

			Icon(node_9, { name: 'globe', size: 28 });

			var button_7 = $.sibling(node_9, 3);

			button_7.__click = () => app.newTab();

			var node_10 = $.sibling($.child(button_7));

			Icon(node_10, { name: 'arrow', size: 14 });
			$.reset(button_7);
			$.reset(div_9);
			$.append($$anchor, div_9);
		};

		$.if(node_1, ($$render) => {
			if ($.get(current)) $$render(consequent); else $$render(alternate, false);
		});
	}

	var node_11 = $.sibling(node_1, 2);

	{
		var consequent_2 = ($$anchor) => {
			var details_1 = root_7();
			var summary = $.child(details_1);
			var text_17 = $.child(summary);

			$.reset(summary);

			var node_12 = $.sibling(summary);

			$.each(node_12, 17, () => $.get(ordinary), (site) => site.id, ($$anchor, site) => {
				var div_10 = root_8();
				var div_11 = $.child(div_10);
				var strong_2 = $.child(div_11);
				var text_18 = $.child(strong_2, true);

				$.reset(strong_2);

				var p_4 = $.sibling(strong_2);
				var text_19 = $.child(p_4);

				$.reset(p_4);
				$.reset(div_11);

				var button_8 = $.sibling(div_11);

				button_8.__click = () => app.openProvider($.get(site).id);

				var node_13 = $.sibling(button_8);

				{
					var consequent_1 = ($$anchor) => {
						var button_9 = root_9();

						button_9.__click = () => app.perform('provider.update', {
							provider_id: $.get(site).id,
							dismissed: false,
							scan_enabled: true
						});

						$.append($$anchor, button_9);
					};

					$.if(node_13, ($$render) => {
						if ($.get(site).dismissed) $$render(consequent_1);
					});
				}

				$.reset(div_10);

				$.template_effect(() => {
					$.set_text(text_18, $.get(site).label);

					$.set_text(text_19, `${($.get(site).dismissed
						? 'Excluded from discovery'
						: $.get(site).discovery_reason || 'No positive provider evidence') ?? ''} · ${$.get(site).origin ?? ''}`);
				});

				$.append($$anchor, div_10);
			});

			$.reset(details_1);
			$.template_effect(() => $.set_text(text_17, `Other browser profiles · ${$.get(ordinary).length ?? ''} not exposed`));
			$.append($$anchor, details_1);
		};

		$.if(node_11, ($$render) => {
			if ($.get(ordinary).length) $$render(consequent_2);
		});
	}

	$.reset(div);
	$.reset(section);
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click', 'change']);