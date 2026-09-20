import '../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import Icon from '../lib/components/Icon.svelte.js';
import { number, providerText, initials, modelStatus, modelReady } from '../lib/format.js';

var root_2 = $.from_html(`<button><span class="site-letter"> </span><span class="site-details"><strong> </strong><small> <!></small></span></button>`);
var root_4 = $.from_html(`<p class="inline-status">Not shared with clients. Enable this provider to make its selected models available.</p>`);
var root_6 = $.from_html(`<p class="inline-status">Discovery paused. Resume it and reopen the website to refresh availability.</p>`);
var root_8 = $.from_html(`<p class="inline-status">This profile is saved. Reopen the website to check its current models and login.</p>`);
var root_9 = $.from_html(`<label class="setting-line"><div><strong> </strong><p> </p></div><input type="checkbox"/></label>`);
var root_10 = $.from_html(`<p>No model names are visible yet. Open the website’s model menu normally to let discovery observe them.</p>`);
var root_11 = $.from_html(`<tr><td> </td><td> </td></tr><tr><td> </td><td> </td></tr>`, 1);
var root_12 = $.from_html(`<option> </option>`);
var root_13 = $.from_html(`<option> </option>`);
var root_14 = $.from_html(`<p class="field-hint">Stop the active request before saving overrides. Your edits are kept while you visit other pages.</p>`);
var root_16 = $.from_html(`<p class="inline-status">Unsaved changes · kept while this application is open.</p>`);
var root_1 = $.from_html(`<div class="provider-settings"><nav class="provider-selector" aria-label="Detected providers"><!> <p class="discovery-note"><!> Discovery follows your browsing. It does not send test prompts or spend quota.</p></nav> <div><section class="section"><div class="section-title"><div><h2> </h2><p class="mono provider-origin"> </p></div><button class="secondary"><!> </button></div> <label class="setting-line"><div><strong>Available to my client</strong><p>Allow this website’s enabled models in the local registry.</p></div><input type="checkbox" aria-label="Expose provider to harness"/></label> <label class="setting-line"><div><strong>Keep discovering this website</strong><p>Update detected controls and model choices while you browse.</p></div><input type="checkbox" aria-label="Scan provider automatically"/></label> <!></section> <section class="section"><div class="section-title"><h2>Models</h2><span class="tag"> </span></div> <!> <!></section> <details class="advanced-client"><summary>Detected capabilities · model, reasoning, and context</summary> <table class="permission-table"><tbody><tr><td>Current model</td><td> </td></tr><tr><td>Reasoning levels</td><td> </td></tr><!></tbody></table> <p class="field-hint">A model’s advertised context is not a measured website conversation budget. Unknown values remain unknown.</p><p class="discovery-note"> </p></details> <details class="advanced-client"><summary> </summary> <form><label class="field"><span>Display name</span><input aria-label="Provider display name" maxlength="240" required/></label> <label class="field"><span>Context budget override · user supplied</span><input aria-label="Provider context override" type="number" min="0" max="10000000" step="1" required/><span class="field-hint">0 leaves the limit unknown. This cannot increase the website’s actual limit.</span></label> <label class="field"><span>Preferred reasoning value</span><select aria-label="Provider reasoning override"><option>Leave website default</option><!><!></select></label> <div class="button-group"><button class="primary"> </button><button type="button" class="secondary">Reset changes</button></div> <!></form> <div class="button-group" style="margin-top:16px"><button class="secondary">Inspect mappings</button><button class="secondary">Rescan</button></div> <label class="setting-line"><div><strong>Keep this website awake</strong><p>Exclude it from idle suspension. Active requests stay awake automatically.</p></div><input type="checkbox" aria-label="Keep provider awake"/></label> <button class="text-button danger-text" style="margin-top:18px">Treat as an ordinary website</button></details></div></div>`);
var root_17 = $.from_html(`<div class="empty-state"><!><h2>Browse first. Providers follow.</h2><p>No websites have passed discovery yet. Open an AI chat website and sign in normally. Ordinary search pages are not added as providers.</p><button class="primary">Open a browser tab<!></button></div>`);
var root_20 = $.from_html(`<button class="text-button">Resume discovery</button>`);
var root_19 = $.from_html(`<div class="setting-line"><div><strong> </strong><p> </p></div><button class="text-button">Open</button><!></div>`);
var root_18 = $.from_html(`<details class="advanced-client"><summary> </summary><!></details>`);
var root = $.from_html(`<section class="screen"><div class="screen-inner"><header class="screen-head"><div><div class="breadcrumb">Codemax / Websites</div><h1>Providers</h1><p>Websites recognized as AI chats. Choose which models your client can use.</p></div><button class="secondary"><!>Browse a website</button></header> <!> <!></div></section>`);

export default function Providers($$anchor, $$props) {
	$.push($$props, true);

	const sites = $.derived(() => app.detectedProviders);
	const current = $.derived(() => $.get(sites).find((p) => p.id === app.providerSelection) || $.get(sites).find((p) => p.id === app.selectedProvider) || $.get(sites)[0]);
	const ordinary = $.derived(() => app.providers.filter((p) => !p.detected || p.dismissed));

	const draft = $.derived(() => $.get(current)
		? app.providerDrafts[$.get(current).id] || {
			label: $.get(current).label,
			hint: $.get(current).context_hint,
			reasoning: $.get(current).reasoning_value
		}
		: { label: '', hint: 0, reasoning: '' });

	const dirty = $.derived(() => !!$.get(current) && ($.get(draft).label !== $.get(current).label || $.get(draft).hint !== $.get(current).context_hint || $.get(draft).reasoning !== $.get(current).reasoning_value));

	function edit(patch) {
		if ($.get(current)) app.providerDrafts = {
			...app.providerDrafts,
			[$.get(current).id]: { ...$.get(draft), ...patch }
		};
	}

	function reset() {
		if (!$.get(current)) return;

		const next = { ...app.providerDrafts };

		delete next[$.get(current).id];
		app.providerDrafts = next;
	}

	async function policy(patch) {
		if (!$.get(current)) return;

		const id = $.get(current).id;
		const apply = () => app.perform('provider.update', { provider_id: id, ...patch });

		if ((patch.exposed === false || patch.scan_enabled === false || patch.dismissed === true) && ($.get(current).active || app.activeTask?.provider_id === id)) {
			await app.ask('Change this provider and stop active work?', 'This change cancels the current client request or website tool task. Website login data is kept.', 'Apply and stop work', apply);

			return;
		}

		await apply();
	}

	async function save() {
		if (!$.get(current) || !$.get(draft).label.trim()) return;

		const id = $.get(current).id;

		if (await app.perform('provider.update', {
			provider_id: id,
			label: $.get(draft).label.trim(),
			context_hint: Number($.get(draft).hint),
			reasoning_value: $.get(draft).reasoning
		}) !== undefined) {
			const next = { ...app.providerDrafts };

			delete next[id];
			app.providerDrafts = next;
			app.notification = 'Provider overrides saved.';
		}
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
		var consequent_8 = ($$anchor) => {
			var div_1 = root_1();
			var nav = $.child(div_1);
			var node_2 = $.child(nav);

			$.each(node_2, 17, () => $.get(sites), (site) => site.id, ($$anchor, site) => {
				var button_1 = root_2();
				let classes;

				button_1.__click = () => app.providerSelection = $.get(site).id;

				var span = $.child(button_1);
				var text = $.child(span, true);

				$.reset(span);

				var span_1 = $.sibling(span);
				var strong = $.child(span_1);
				var text_1 = $.child(strong, true);

				$.reset(strong);

				var small = $.sibling(strong);
				var text_2 = $.child(small);
				var node_3 = $.sibling(text_2);

				{
					var consequent = ($$anchor) => {
						var text_3 = $.text();

						$.template_effect(($0) => $.set_text(text_3, `· ${$0 ?? ''}`), [
							() => $.get(site).exposed ? providerText($.get(site)) : 'Disabled'
						]);

						$.append($$anchor, text_3);
					};

					$.if(node_3, ($$render) => {
						if (!$.get(site).exposed || $.get(site).state !== 'READY') $$render(consequent);
					});
				}

				$.reset(small);
				$.reset(span_1);
				$.reset(button_1);

				$.template_effect(
					($0, $1) => {
						classes = $.set_class(button_1, 1, 'provider-choice', null, classes, { active: $.get(current).id === $.get(site).id });
						$.set_attribute(button_1, 'aria-current', $.get(current).id === $.get(site).id ? 'true' : undefined);
						$.set_text(text, $0);
						$.set_attribute(strong, 'title', $.get(site).label);
						$.set_text(text_1, $.get(site).label);
						$.set_text(text_2, `${$1 ?? ''} ready`);
					},
					[
						() => initials($.get(site).label),
						() => $.get(site).models.filter((m) => modelReady(m, $.get(site))).length
					]
				);

				$.append($$anchor, button_1);
			});

			var p_1 = $.sibling(node_2, 2);
			var node_4 = $.child(p_1);

			Icon(node_4, { name: 'scan', size: 13 });
			$.next();
			$.reset(p_1);
			$.reset(nav);

			var div_2 = $.sibling(nav, 2);
			var section_1 = $.child(div_2);
			var div_3 = $.child(section_1);
			var div_4 = $.child(div_3);
			var h2 = $.child(div_4);
			var text_4 = $.child(h2, true);

			$.reset(h2);

			var p_2 = $.sibling(h2);
			var text_5 = $.child(p_2, true);

			$.reset(p_2);
			$.reset(div_4);

			var button_2 = $.sibling(div_4);

			button_2.__click = () => app.openProvider($.get(current).id);

			var node_5 = $.child(button_2);

			Icon(node_5, { name: 'globe', size: 14 });

			var text_6 = $.sibling(node_5, 1, true);

			$.reset(button_2);
			$.reset(div_3);

			var label = $.sibling(div_3, 2);
			var input = $.sibling($.child(label));

			$.remove_input_defaults(input);

			input.__change = (e) => {
				const value = e.currentTarget.checked;

				e.currentTarget.checked = $.get(current).exposed;
				void policy({ exposed: value });
			};

			$.reset(label);

			var label_1 = $.sibling(label, 2);
			var input_1 = $.sibling($.child(label_1));

			$.remove_input_defaults(input_1);

			input_1.__change = (e) => {
				const value = e.currentTarget.checked;

				e.currentTarget.checked = $.get(current).scan_enabled;
				void policy({ scan_enabled: value });
			};

			$.reset(label_1);

			var node_6 = $.sibling(label_1, 2);

			{
				var consequent_1 = ($$anchor) => {
					var p_3 = root_4();

					$.append($$anchor, p_3);
				};

				var alternate_1 = ($$anchor) => {
					var fragment_1 = $.comment();
					var node_7 = $.first_child(fragment_1);

					{
						var consequent_2 = ($$anchor) => {
							var p_4 = root_6();

							$.append($$anchor, p_4);
						};

						var alternate = ($$anchor) => {
							var fragment_2 = $.comment();
							var node_8 = $.first_child(fragment_2);

							{
								var consequent_3 = ($$anchor) => {
									var p_5 = root_8();

									$.append($$anchor, p_5);
								};

								$.if(
									node_8,
									($$render) => {
										if (!$.get(current).open_tab) $$render(consequent_3);
									},
									true
								);
							}

							$.append($$anchor, fragment_2);
						};

						$.if(
							node_7,
							($$render) => {
								if (!$.get(current).scan_enabled) $$render(consequent_2); else $$render(alternate, false);
							},
							true
						);
					}

					$.append($$anchor, fragment_1);
				};

				$.if(node_6, ($$render) => {
					if (!$.get(current).exposed) $$render(consequent_1); else $$render(alternate_1, false);
				});
			}

			$.reset(section_1);

			var section_2 = $.sibling(section_1, 2);
			var div_5 = $.child(section_2);
			var span_2 = $.sibling($.child(div_5));
			var text_7 = $.child(span_2);

			$.reset(span_2);
			$.reset(div_5);

			var node_9 = $.sibling(div_5, 2);

			$.each(node_9, 17, () => $.get(current).models, (model) => model.id, ($$anchor, model) => {
				var label_2 = root_9();
				var div_6 = $.child(label_2);
				var strong_1 = $.child(div_6);
				var text_8 = $.child(strong_1, true);

				$.reset(strong_1);

				var p_6 = $.sibling(strong_1);
				var text_9 = $.child(p_6);

				$.reset(p_6);
				$.reset(div_6);

				var input_2 = $.sibling(div_6);

				$.remove_input_defaults(input_2);

				input_2.__change = (e) => {
					const value = e.currentTarget.checked;

					e.currentTarget.checked = $.get(model).enabled;

					void app.perform('model.update', {
						provider_id: $.get(current).id,
						model: $.get(model).id,
						enabled: value
					});
				};

				$.reset(label_2);

				$.template_effect(
					($0, $1) => {
						$.set_text(text_8, $.get(model).display_name);
						$.set_text(text_9, `${$0 ?? ''}${$.get(model).available ? '' : ' · reopen the website to check'}`);
						$.set_attribute(input_2, 'aria-label', `Expose ${$.get(model).display_name}`);
						$.set_checked(input_2, $.get(model).enabled);
						input_2.disabled = $1;
					},
					[
						() => modelStatus($.get(model), $.get(current)),
						() => !app.ready || app.busy('model.update')
					]
				);

				$.append($$anchor, label_2);
			});

			var node_10 = $.sibling(node_9, 2);

			{
				var consequent_4 = ($$anchor) => {
					var p_7 = root_10();

					$.append($$anchor, p_7);
				};

				$.if(node_10, ($$render) => {
					if (!$.get(current).models.length) $$render(consequent_4);
				});
			}

			$.reset(section_2);

			var details = $.sibling(section_2, 2);
			var table = $.sibling($.child(details), 2);
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

			var node_11 = $.sibling(tr_1);

			$.each(node_11, 17, () => $.get(current).models, (model) => model.id, ($$anchor, model) => {
				var fragment_3 = root_11();
				var tr_2 = $.first_child(fragment_3);
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
						() => $.get(current).context_hint
							? `${number($.get(current).context_hint)} · user supplied`
							: $.get(model).context.nominal
								? `${number($.get(model).context.nominal)} · website reported`
								: 'Unknown'
					]
				);

				$.append($$anchor, fragment_3);
			});

			$.reset(tbody);
			$.reset(table);

			var p_8 = $.sibling(table, 3);
			var text_16 = $.child(p_8, true);

			$.reset(p_8);
			$.reset(details);

			var details_1 = $.sibling(details, 2);
			var summary = $.child(details_1);
			var text_17 = $.child(summary);

			$.reset(summary);

			var form = $.sibling(summary, 2);
			var label_3 = $.child(form);
			var input_3 = $.sibling($.child(label_3));

			$.remove_input_defaults(input_3);
			input_3.__input = (e) => edit({ label: e.currentTarget.value });
			$.reset(label_3);

			var label_4 = $.sibling(label_3, 2);
			var input_4 = $.sibling($.child(label_4));

			$.remove_input_defaults(input_4);
			input_4.__input = (e) => edit({ hint: Number(e.currentTarget.value) });
			$.next();
			$.reset(label_4);

			var label_5 = $.sibling(label_4, 2);
			var select = $.sibling($.child(label_5));

			select.__change = (e) => edit({ reasoning: e.currentTarget.value });

			var option = $.child(select);

			option.value = option.__value = '';

			var node_12 = $.sibling(option);

			{
				var consequent_5 = ($$anchor) => {
					var option_1 = root_12();
					var text_18 = $.child(option_1);

					$.reset(option_1);

					var option_1_value = {};

					$.template_effect(() => {
						$.set_text(text_18, `${$.get(draft).reasoning ?? ''} · not currently observed`);

						if (option_1_value !== (option_1_value = $.get(draft).reasoning)) {
							option_1.value = (option_1.__value = $.get(draft).reasoning) ?? '';
						}
					});

					$.append($$anchor, option_1);
				};

				$.if(node_12, ($$render) => {
					if ($.get(draft).reasoning && !($.get(current).reasoning_modes || []).some((m) => m.value === $.get(draft).reasoning)) $$render(consequent_5);
				});
			}

			var node_13 = $.sibling(node_12);

			$.each(node_13, 17, () => $.get(current).reasoning_modes || [], $.index, ($$anchor, mode) => {
				var option_2 = root_13();
				var text_19 = $.child(option_2, true);

				$.reset(option_2);

				var option_2_value = {};

				$.template_effect(() => {
					$.set_text(text_19, $.get(mode).label);

					if (option_2_value !== (option_2_value = $.get(mode).value)) {
						option_2.value = (option_2.__value = $.get(mode).value) ?? '';
					}
				});

				$.append($$anchor, option_2);
			});

			$.reset(select);

			var select_value;

			$.init_select(select);
			$.reset(label_5);

			var div_7 = $.sibling(label_5, 2);
			var button_3 = $.child(div_7);
			var text_20 = $.child(button_3, true);

			$.reset(button_3);

			var button_4 = $.sibling(button_3);

			button_4.__click = reset;
			$.reset(div_7);

			var node_14 = $.sibling(div_7, 2);

			{
				var consequent_6 = ($$anchor) => {
					var p_9 = root_14();

					$.append($$anchor, p_9);
				};

				var alternate_2 = ($$anchor) => {
					var fragment_4 = $.comment();
					var node_15 = $.first_child(fragment_4);

					{
						var consequent_7 = ($$anchor) => {
							var p_10 = root_16();

							$.append($$anchor, p_10);
						};

						$.if(
							node_15,
							($$render) => {
								if ($.get(dirty)) $$render(consequent_7);
							},
							true
						);
					}

					$.append($$anchor, fragment_4);
				};

				$.if(node_14, ($$render) => {
					if ($.get(current).active) $$render(consequent_6); else $$render(alternate_2, false);
				});
			}

			$.reset(form);

			var div_8 = $.sibling(form, 2);
			var button_5 = $.child(div_8);

			button_5.__click = () => {
				app.selectedProvider = $.get(current).id;
				app.navigate('detector');
			};

			var button_6 = $.sibling(button_5);

			button_6.__click = () => app.perform('provider.rescan', { provider_id: $.get(current).id });
			$.reset(div_8);

			var label_6 = $.sibling(div_8, 2);
			var input_5 = $.sibling($.child(label_6));

			$.remove_input_defaults(input_5);
			input_5.__change = (e) => policy({ pinned: e.currentTarget.checked });
			$.reset(label_6);

			var button_7 = $.sibling(label_6, 2);

			button_7.__click = () => policy({ dismissed: true, exposed: false });
			$.reset(details_1);
			$.reset(div_2);
			$.reset(div_1);

			$.template_effect(
				($0, $1, $2, $3, $4, $5) => {
					$.set_text(text_4, $.get(current).label);
					$.set_text(text_5, $.get(current).origin);
					button_2.disabled = !app.ready;
					$.set_text(text_6, $.get(current).open_tab ? 'Open tab' : 'Reopen website');
					$.set_checked(input, $.get(current).exposed);
					input.disabled = $0;
					$.set_checked(input_1, $.get(current).scan_enabled);
					input_1.disabled = $1;
					$.set_text(text_7, `${$2 ?? ''} ready / ${$.get(current).models.length ?? ''} found`);
					$.set_text(text_10, $.get(current).current_model || 'Not exposed yet');
					$.set_text(text_11, $3);
					$.set_text(text_16, $.get(current).discovery_reason);
					$.set_text(text_17, `Advanced · overrides, mapping, and lifecycle${$.get(dirty) ? ' · unsaved changes' : ''}`);
					$.set_value(input_3, $.get(draft).label);
					$.set_value(input_4, $.get(draft).hint);

					if (select_value !== (select_value = $.get(draft).reasoning)) {
						(
							select.value = (select.__value = $.get(draft).reasoning) ?? '',
							$.select_option(select, $.get(draft).reasoning)
						);
					}

					button_3.disabled = $4;
					$.set_text(text_20, $5);
					button_4.disabled = !$.get(dirty);
					button_6.disabled = !app.ready || $.get(current).active || !$.get(current).open_tab;
					$.set_checked(input_5, $.get(current).pinned);
					input_5.disabled = !app.ready;
					button_7.disabled = !app.ready;
				},
				[
					() => !app.ready || app.busy('provider.update'),
					() => !app.ready || app.busy('provider.update'),
					() => $.get(current).models.filter((m) => modelReady(m, $.get(current))).length,
					() => $.get(current).reasoning_modes?.length
						? $.get(current).reasoning_modes.map((m) => m.label).join(' · ')
						: $.get(current).mappings.reasoning ? 'Control observed; options unknown' : 'Unknown',
					() => !app.ready || !!$.get(current).active || !$.get(dirty) || !$.get(draft).label.trim() || app.busy('provider.update'),
					() => app.busy('provider.update') ? 'Saving…' : 'Save overrides'
				]
			);

			$.event('submit', form, (e) => {
				e.preventDefault();
				void save();
			});

			$.append($$anchor, div_1);
		};

		var alternate_3 = ($$anchor) => {
			var div_9 = root_17();
			var node_16 = $.child(div_9);

			Icon(node_16, { name: 'globe', size: 28 });

			var button_8 = $.sibling(node_16, 3);

			button_8.__click = () => app.newTab();

			var node_17 = $.sibling($.child(button_8));

			Icon(node_17, { name: 'arrow', size: 14 });
			$.reset(button_8);
			$.reset(div_9);
			$.append($$anchor, div_9);
		};

		$.if(node_1, ($$render) => {
			if ($.get(current)) $$render(consequent_8); else $$render(alternate_3, false);
		});
	}

	var node_18 = $.sibling(node_1, 2);

	{
		var consequent_10 = ($$anchor) => {
			var details_2 = root_18();
			var summary_1 = $.child(details_2);
			var text_21 = $.child(summary_1);

			$.reset(summary_1);

			var node_19 = $.sibling(summary_1);

			$.each(node_19, 17, () => $.get(ordinary), (site) => site.id, ($$anchor, site) => {
				var div_10 = root_19();
				var div_11 = $.child(div_10);
				var strong_2 = $.child(div_11);
				var text_22 = $.child(strong_2, true);

				$.reset(strong_2);

				var p_11 = $.sibling(strong_2);
				var text_23 = $.child(p_11);

				$.reset(p_11);
				$.reset(div_11);

				var button_9 = $.sibling(div_11);

				button_9.__click = () => app.openProvider($.get(site).id);

				var node_20 = $.sibling(button_9);

				{
					var consequent_9 = ($$anchor) => {
						var button_10 = root_20();

						button_10.__click = () => app.perform('provider.update', {
							provider_id: $.get(site).id,
							dismissed: false,
							scan_enabled: true
						});

						$.template_effect(() => button_10.disabled = !app.ready);
						$.append($$anchor, button_10);
					};

					$.if(node_20, ($$render) => {
						if ($.get(site).dismissed) $$render(consequent_9);
					});
				}

				$.reset(div_10);

				$.template_effect(() => {
					$.set_text(text_22, $.get(site).label);

					$.set_text(text_23, `${($.get(site).dismissed
						? 'Excluded from discovery'
						: $.get(site).discovery_reason || 'No positive provider evidence') ?? ''} · ${$.get(site).origin ?? ''}`);

					button_9.disabled = !app.ready;
				});

				$.append($$anchor, div_10);
			});

			$.reset(details_2);
			$.template_effect(() => $.set_text(text_21, `Other browser profiles · ${$.get(ordinary).length ?? ''} not exposed`));
			$.append($$anchor, details_2);
		};

		$.if(node_18, ($$render) => {
			if ($.get(ordinary).length) $$render(consequent_10);
		});
	}

	$.reset(div);
	$.reset(section);
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click', 'change', 'input']);