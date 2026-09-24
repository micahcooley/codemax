import '../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import { initials, number, providerText, modelReady, modelStatus } from '../lib/format.js';
import { catalogLookup, formatTokens, formatPlans } from '../lib/model-catalog.js';
import Icon from '../lib/components/Icon.svelte.js';

var root = $.from_html(`<option> </option>`);
var root_1 = $.from_html(`<span class="count">DEFAULT</span>`);
var root_2 = $.from_html(`<tr><td><div class="inline"><span class="model-letter"> </span><div><span class="primary-line"> <!></span><span class="secondary-line mono"> </span></div></div></td><td><button class="text-button" style="padding:0;font-size:12px"> </button></td><td><span> </span><span class="secondary-line"> </span></td><td> <span class="secondary-line"> </span></td><td>Text bridge<span class="secondary-line"> </span></td><td><span><span></span> </span></td><td><div class="row-actions"><button class="icon-button" title="Copy model ID"><!></button><button title="Use as the codemax/default model"><!></button></div></td></tr>`);
var root_3 = $.from_html(`<button class="secondary">Clear filters</button>`);
var root_4 = $.from_html(`<button class="secondary">Open browser<!></button>`);
var root_5 = $.from_html(`<div class="empty-state"><!><h2> </h2><p> </p><!></div>`);
var root_6 = $.from_html(`<section class="screen"><div class="screen-inner"><header class="screen-head"><div><div class="breadcrumb">Workspace / Registry</div><h1>Models</h1><p>The models your websites expose, with evidence—not assumed specifications.</p></div><button class="secondary"><!>Add website</button></header> <div class="filterbar"><label class="search-field"><!><input aria-label="Search models" placeholder="Find a model or provider…"/></label><span class="spacer"></span><select aria-label="Filter by provider"><option>All detected providers</option><!></select><select aria-label="Filter by availability"><option>Any status</option><option>Ready to use</option><option>Disabled</option><option>Rate limited</option><option>Sign in required</option></select></div> <div class="table-scroll"><table><thead><tr><th><button>MODEL <!></button></th><th><button>WEBSITE <!></button></th><th>REASONING</th><th>CONTEXT</th><th>TOOLS</th><th>STATUS</th><th></th></tr></thead><tbody></tbody></table></div> <!> <div class="table-foot"><span> </span><span>Unknown values are never filled with guesses.</span></div> <div class="note"><!><span>Names and capabilities come from website evidence. Unknown limits stay unknown; estimates are never exact token counts.</span></div></div></section>`);

export default function Models($$anchor, $$props) {
	$.push($$props, true);

	const filters = $.derived(() => app.modelFilters);

	const visible = $.derived(() => app.models.filter((m) => ($.get(filters).provider === 'all' || m.provider.id === Number($.get(filters).provider)) && ($.get(filters).status === 'all' || ($.get(filters).status === 'READY'
		? modelReady(m, m.provider)
		: $.get(filters).status === 'DISABLED'
			? !m.enabled || !m.provider.exposed
			: m.provider.state === $.get(filters).status)) && `${m.display_name} ${m.id} ${m.provider.label}`.toLowerCase().includes($.get(filters).query.toLowerCase())).sort((a, b) => ($.get(filters).sort === 'provider'
		? a.provider.label.localeCompare(b.provider.label) || a.display_name.localeCompare(b.display_name)
		: a.display_name.localeCompare(b.display_name)) * ($.get(filters).descending ? -1 : 1)));

	function order(sort) {
		app.modelFilters = {
			...$.get(filters),
			sort,
			descending: $.get(filters).sort === sort ? !$.get(filters).descending : false
		};
	}

	function clear() {
		app.modelFilters = {
			query: '',
			provider: 'all',
			status: 'all',
			sort: 'provider',
			descending: false
		};
	}

	var section = root_6();
	var div = $.child(section);
	var header = $.child(div);
	var button = $.sibling($.child(header));
	var node = $.child(button);

	Icon(node, { name: 'plus', size: 15 });
	$.next();
	$.reset(button);
	$.reset(header);

	var div_1 = $.sibling(header, 2);
	var label = $.child(div_1);
	var node_1 = $.child(label);

	Icon(node_1, { name: 'search', size: 15 });

	var input = $.sibling(node_1);

	$.remove_input_defaults(input);
	$.reset(label);

	var select = $.sibling(label, 2);
	var option = $.child(select);

	option.value = option.__value = 'all';

	var node_2 = $.sibling(option);

	$.each(node_2, 17, () => app.detectedProviders, $.index, ($$anchor, p) => {
		var option_1 = root();
		var text = $.only_child(option_1, true);
		var option_1_value = {};

		$.template_effect(() => {
			$.set_text(text, $.get(p).label);

			if (option_1_value !== (option_1_value = $.get(p).id)) {
				option_1.value = (option_1.__value = option_1_value) ?? '';
			}
		});

		$.append($$anchor, option_1);
	});

	$.reset(select);
	$.init_select(select);

	var select_1 = $.sibling(select);
	var option_2 = $.child(select_1);

	option_2.value = option_2.__value = 'all';

	var option_3 = $.sibling(option_2);

	option_3.value = option_3.__value = 'READY';

	var option_4 = $.sibling(option_3);

	option_4.value = option_4.__value = 'DISABLED';

	var option_5 = $.sibling(option_4);

	option_5.value = option_5.__value = 'RATE_LIMITED';

	var option_6 = $.sibling(option_5);

	option_6.value = option_6.__value = 'LOGIN_REQUIRED';
	$.reset(select_1);
	$.init_select(select_1);
	$.reset(div_1);

	var div_2 = $.sibling(div_1, 2);
	var table = $.child(div_2);
	var thead = $.child(table);
	var tr = $.child(thead);
	var th = $.child(tr);
	var button_1 = $.child(th);
	var node_3 = $.sibling($.child(button_1));

	Icon(node_3, { name: 'chevron', size: 11 });
	$.reset(button_1);
	$.reset(th);

	var th_1 = $.sibling(th);
	var button_2 = $.child(th_1);
	var node_4 = $.sibling($.child(button_2));

	Icon(node_4, { name: 'chevron', size: 11 });
	$.reset(button_2);
	$.reset(th_1);
	$.next(5);
	$.reset(tr);
	$.reset(thead);

	var tbody = $.sibling(thead);

	$.each(tbody, 21, () => $.get(visible), (model) => model.id, ($$anchor, model) => {
		const docs = $.derived(() => catalogLookup($.get(model).id, $.get(model).display_name));
		var tr_1 = root_2();
		var td = $.child(tr_1);
		var div_3 = $.child(td);
		var span = $.child(div_3);
		var text_1 = $.only_child(span, true);
		var div_4 = $.sibling(span);
		var span_1 = $.child(div_4);
		var text_2 = $.child(span_1, true);
		var node_5 = $.sibling(text_2);

		{
			var consequent = ($$anchor) => {
				var span_2 = root_1();

				$.append($$anchor, span_2);
			};

			$.if(node_5, ($$render) => {
				if (app.preferences.default_model === $.get(model).id) $$render(consequent);
			});
		}

		$.reset(span_1);

		var span_3 = $.sibling(span_1);
		var text_3 = $.only_child(span_3, true);

		$.reset(div_4);
		$.reset(div_3);
		$.reset(td);

		var td_1 = $.sibling(td);
		var button_3 = $.child(td_1);
		var text_4 = $.only_child(button_3, true);

		$.reset(td_1);

		var td_2 = $.sibling(td_1);
		var span_4 = $.child(td_2);
		var text_5 = $.only_child(span_4, true);
		var span_5 = $.sibling(span_4);
		var text_6 = $.only_child(span_5, true);

		$.reset(td_2);

		var td_3 = $.sibling(td_2);
		var text_7 = $.child(td_3, true);
		var span_6 = $.sibling(text_7);
		var text_8 = $.only_child(span_6, true);

		$.reset(td_3);

		var td_4 = $.sibling(td_3);
		var span_7 = $.sibling($.child(td_4));
		var text_9 = $.only_child(span_7, true);

		$.reset(td_4);

		var td_5 = $.sibling(td_4);
		var span_8 = $.child(td_5);
		let classes;
		var span_9 = $.child(span_8);
		let classes_1;
		var text_10 = $.sibling(span_9, 1, true);

		$.reset(span_8);
		$.reset(td_5);

		var td_6 = $.sibling(td_5);
		var div_5 = $.child(td_6);
		var button_4 = $.child(div_5);
		var node_6 = $.child(button_4);

		Icon(node_6, { name: 'copy', size: 14 });
		$.reset(button_4);

		var button_5 = $.sibling(button_4);
		var node_7 = $.child(button_5);

		Icon(node_7, { name: 'check', size: 14 });
		$.reset(button_5);
		$.reset(div_5);
		$.reset(td_6);
		$.reset(tr_1);

		$.template_effect(
			($0, $1, $2, $3, $4, $5, $6) => {
				$.set_text(text_1, $0);
				$.set_text(text_2, $.get(model).display_name);
				$.set_text(text_3, $.get(model).id);
				$.set_text(text_4, $.get(model).provider.label);

				$.set_text(text_5, $.get(model).reasoning?.control_observed
					? 'Control found'
					: $.get(docs)?.reasoning === true
						? 'Supported'
						: $.get(docs)?.reasoning === false ? 'Not advertised' : 'Unknown');

				$.set_text(text_6, $.get(model).reasoning?.control_observed
					? 'Observed on website'
					: $.get(docs)?.reasoning !== null && $.get(docs)?.reasoning !== undefined
						? `Vendor docs · ${$.get(docs).reasoningNote}`
						: 'Not asserted');

				$.set_text(text_7, $1);
				$.set_text(text_8, $2);
				$.set_text(text_9, $.get(model).vision === true ? 'Vision observed' : 'Vision unknown');

				classes = $.set_class(span_8, 1, 'tag', null, classes, {
					ready: $3,
					attention: $.get(model).provider.state === 'RATE_LIMITED'
				});

				classes_1 = $.set_class(span_9, 1, 'dot', null, classes_1, {
					online: $4,
					warn: $.get(model).provider.state === 'RATE_LIMITED'
				});

				$.set_text(text_10, $5);
				$.set_attribute(button_4, 'aria-label', `Copy ${$.get(model).display_name} model ID`);
				$.set_attribute(button_5, 'aria-label', `Set ${$.get(model).display_name} as default`);
				button_5.disabled = $6;
			},
			[
				() => initials($.get(model).display_name).slice(0, 2),
				() => $.get(model).provider.context_hint
					? number($.get(model).provider.context_hint)
					: $.get(model).context.nominal
						? number($.get(model).context.nominal)
						: $.get(model).context.advertised_label || ($.get(docs)?.contextTokens ? formatTokens($.get(docs).contextTokens) : 'Unknown'),

				() => $.get(model).provider.context_hint
					? 'User supplied'
					: $.get(model).context.nominal
						? 'Provider reported'
						: $.get(model).context.advertised_label
							? 'Website label · exact count unknown'
							: $.get(docs)?.contextTokens
								? `Vendor docs · ${$.get(docs).contextSource?.retrieved} · website budget unmeasured${$.get(docs).plans
									? ` · ${formatPlans($.get(docs).plans)}${$.get(docs).planNote ? ` (${$.get(docs).planNote})` : ''}`
									: ''}`
								: 'No limit exposed',
				() => modelReady($.get(model), $.get(model).provider),
				() => modelReady($.get(model), $.get(model).provider),
				() => modelStatus($.get(model), $.get(model).provider),
				() => !app.ready || !modelReady($.get(model), $.get(model).provider) || app.preferences.default_model === $.get(model).id || app.busy('settings.update')
			]
		);

		$.delegated('click', button_3, () => app.openProvider($.get(model).provider.id));
		$.delegated('click', button_4, () => app.clipboard($.get(model).id));
		$.delegated('click', button_5, () => app.settings({ default_model: $.get(model).id }));
		$.append($$anchor, tr_1);
	});

	$.reset(tbody);
	$.reset(table);
	$.reset(div_2);

	var node_8 = $.sibling(div_2, 2);

	{
		var consequent_2 = ($$anchor) => {
			var div_6 = root_5();
			var node_9 = $.child(div_6);

			Icon(node_9, { name: 'layers', size: 28 });

			var h2 = $.sibling(node_9);
			var text_11 = $.only_child(h2, true);
			var p_1 = $.sibling(h2);
			var text_12 = $.only_child(p_1, true);
			var node_10 = $.sibling(p_1);

			{
				var consequent_1 = ($$anchor) => {
					var button_6 = root_3();

					$.delegated('click', button_6, clear);
					$.append($$anchor, button_6);
				};

				var alternate = ($$anchor) => {
					var button_7 = root_4();
					var node_11 = $.sibling($.child(button_7));

					Icon(node_11, { name: 'arrow', size: 14 });
					$.reset(button_7);
					$.delegated('click', button_7, () => app.newTab());
					$.append($$anchor, button_7);
				};

				$.if(node_10, ($$render) => {
					if (app.models.length) $$render(consequent_1); else $$render(alternate, -1);
				});
			}

			$.reset(div_6);

			$.template_effect(() => {
				$.set_text(text_11, app.models.length
					? 'No models match those filters'
					: 'Your models will appear here');

				$.set_text(text_12, app.models.length
					? 'Try another website or search term.'
					: 'Open a provider, sign in, and open its model menu. Discovery will update this registry as controls become visible.');
			});

			$.append($$anchor, div_6);
		};

		$.if(node_8, ($$render) => {
			if (!$.get(visible).length) $$render(consequent_2);
		});
	}

	var div_7 = $.sibling(node_8, 2);
	var span_10 = $.child(div_7);
	var text_13 = $.only_child(span_10);

	$.next();
	$.reset(div_7);

	var div_8 = $.sibling(div_7, 2);
	var node_12 = $.child(div_8);

	Icon(node_12, { name: 'shield', size: 16 });
	$.next();
	$.reset(div_8);
	$.reset(div);
	$.reset(section);

	$.template_effect(() => {
		button.disabled = !app.ready;

		$.set_attribute(th, 'aria-sort', $.get(filters).sort === 'model'
			? $.get(filters).descending ? 'descending' : 'ascending'
			: 'none');

		$.set_attribute(th_1, 'aria-sort', $.get(filters).sort === 'provider'
			? $.get(filters).descending ? 'descending' : 'ascending'
			: 'none');

		$.set_text(text_13, `${$.get(visible).length ?? ''} of ${app.models.length ?? ''} models · Updates from the Zag registry`);
	});

	$.delegated('click', button, () => app.showPopup('add'));
	$.bind_value(input, () => app.modelFilters.query, ($$value) => app.modelFilters.query = $$value);
	$.bind_select_value(select, () => app.modelFilters.provider, ($$value) => app.modelFilters.provider = $$value);
	$.bind_select_value(select_1, () => app.modelFilters.status, ($$value) => app.modelFilters.status = $$value);
	$.delegated('click', button_1, () => order('model'));
	$.delegated('click', button_2, () => order('provider'));
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click']);