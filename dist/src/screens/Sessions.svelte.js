import '../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import { stateText, dateTime, number } from '../lib/format.js';
import Icon from '../lib/components/Icon.svelte.js';

var root_2 = $.from_html(`<button class="secondary"><!>Stop</button>`);
var root_4 = $.from_html(`<button class="secondary"><!>Resume</button>`);
var root_6 = $.from_html(`<button class="text-button"><!>Open</button>`);
var root_7 = $.from_html(`<button class="icon-button" title="End this local session"><!></button>`);
var root_1 = $.from_html(`<tr><td style="min-width:190px"><input class="session-title-input" placeholder="Untitled conversation" maxlength="240"/><button class="text-button" style="padding:0;min-height:18px;display:block" title="Copy session ID"><span class="secondary-line mono"> </span></button><span class="secondary-line"> </span></td><td> <span class="secondary-line"> </span></td><td class="mono"> </td><td> <span class="secondary-line">Conservative byte bound</span></td><td><span><span></span> </span></td><td><div class="row-actions"><!><!></div></td></tr>`);
var root_8 = $.from_html(`<div class="empty-state"><!><h2> </h2><p>Connect a client to the local API. Its session will appear here when it sends the first request.</p><button class="secondary">Connect a client<!></button></div>`);
var root = $.from_html(`<section class="screen"><div class="screen-inner"><header class="screen-head"><div><div class="breadcrumb">Workspace / Continuity</div><h1>Sessions</h1><p>Client conversations mapped to their website chats. Resume without replaying the whole conversation.</p></div><span class="tag"><span></span> </span></header> <div class="filterbar"><label class="search-field"><!><input aria-label="Search sessions" placeholder="Search session, title, or model…"/></label><span class="spacer"></span><select aria-label="Filter session status"><option>All sessions</option><option>Running</option><option>Idle</option><option>Reconnect</option><option>Ended</option></select></div> <div class="table-scroll"><table><thead><tr><th>CONVERSATION</th><th>MODEL / WEBSITE</th><th>TURNS</th><th>CONTEXT ESTIMATE</th><th>STATUS</th><th></th></tr></thead><tbody></tbody></table></div> <!> <div class="table-foot"><span> </span><span>Session metadata and digests persist; prompt bodies do not.</span></div><div class="note"><!><span>Restoration uses the website conversation URL and message-digest receipts. A missing or changed conversation is rejected rather than silently starting over. The context figure is an upper-bound estimate, not an exact tokenizer count.</span></div></div></section>`);

export default function Sessions($$anchor, $$props) {
	$.push($$props, true);

	let query = $.state('');
	let status = $.state('all');
	const visible = $.derived(() => [...app.sessions].filter((s) => ($.get(status) === 'all' || s.status === $.get(status)) && `${s.title} ${s.id} ${s.model}`.toLowerCase().includes($.get(query).toLowerCase())).sort((a, b) => b.last_used - a.last_used));

	async function rename(event, id) {
		const value = event.currentTarget.value.trim();
		const s = app.sessions.find((s) => s.id === id);

		if (s && value !== s.title) await app.perform('session.rename', { session_id: id, title: value });
	}

	var section = root();
	var div = $.child(section);
	var header = $.child(div);
	var span = $.sibling($.child(header));
	var span_1 = $.child(span);
	let classes;
	var text = $.sibling(span_1);

	$.reset(span);
	$.reset(header);

	var div_1 = $.sibling(header, 2);
	var label = $.child(div_1);
	var node = $.child(label);

	Icon(node, { name: 'search', size: 15 });

	var input = $.sibling(node);

	$.remove_input_defaults(input);
	$.reset(label);

	var select = $.sibling(label, 2);
	var option = $.child(select);

	option.value = option.__value = 'all';

	var option_1 = $.sibling(option);

	option_1.value = option_1.__value = 'ACTIVE';

	var option_2 = $.sibling(option_1);

	option_2.value = option_2.__value = 'IDLE';

	var option_3 = $.sibling(option_2);

	option_3.value = option_3.__value = 'PROVIDER_LOST';

	var option_4 = $.sibling(option_3);

	option_4.value = option_4.__value = 'EXPIRED';
	$.reset(select);
	$.reset(div_1);

	var div_2 = $.sibling(div_1, 2);
	var table = $.child(div_2);
	var tbody = $.sibling($.child(table));

	$.each(tbody, 21, () => $.get(visible), (s) => s.id, ($$anchor, s) => {
		const provider = $.derived(() => app.providers.find((p) => p.id === $.get(s).provider));
		var tr = root_1();
		var td = $.child(tr);
		var input_1 = $.child(td);

		$.remove_input_defaults(input_1);
		input_1.__change = (event) => rename(event, $.get(s).id);

		var button = $.sibling(input_1);

		button.__click = () => app.clipboard($.get(s).id);

		var span_2 = $.child(button);
		var text_1 = $.child(span_2, true);

		$.reset(span_2);
		$.reset(button);

		var span_3 = $.sibling(button);
		var text_2 = $.child(span_3, true);

		$.reset(span_3);
		$.reset(td);

		var td_1 = $.sibling(td);
		var text_3 = $.child(td_1, true);
		var span_4 = $.sibling(text_3);
		var text_4 = $.child(span_4, true);

		$.reset(span_4);
		$.reset(td_1);

		var td_2 = $.sibling(td_1);
		var text_5 = $.child(td_2, true);

		$.reset(td_2);

		var td_3 = $.sibling(td_2);
		var text_6 = $.child(td_3, true);

		$.next();
		$.reset(td_3);

		var td_4 = $.sibling(td_3);
		var span_5 = $.child(td_4);
		let classes_1;
		var span_6 = $.child(span_5);
		let classes_2;
		var text_7 = $.sibling(span_6, 1, true);

		$.reset(span_5);
		$.reset(td_4);

		var td_5 = $.sibling(td_4);
		var div_3 = $.child(td_5);
		var node_1 = $.child(div_3);

		{
			var consequent = ($$anchor) => {
				var button_1 = root_2();

				button_1.__click = () => app.cancel($.get(s).id);

				var node_2 = $.child(button_1);

				Icon(node_2, { name: 'stop', size: 12 });
				$.next();
				$.reset(button_1);
				$.append($$anchor, button_1);
			};

			var alternate_1 = ($$anchor) => {
				var fragment = $.comment();
				var node_3 = $.first_child(fragment);

				{
					var consequent_1 = ($$anchor) => {
						var button_2 = root_4();

						button_2.__click = () => app.resume($.get(s).id);

						var node_4 = $.child(button_2);

						Icon(node_4, { name: 'refresh', size: 12 });
						$.next();
						$.reset(button_2);
						$.template_effect(() => button_2.disabled = !$.get(s).url || !$.get(provider));
						$.append($$anchor, button_2);
					};

					var alternate = ($$anchor) => {
						var fragment_1 = $.comment();
						var node_5 = $.first_child(fragment_1);

						{
							var consequent_2 = ($$anchor) => {
								var button_3 = root_6();

								button_3.__click = () => app.openProvider($.get(s).provider);

								var node_6 = $.child(button_3);

								Icon(node_6, { name: 'globe', size: 13 });
								$.next();
								$.reset(button_3);
								$.template_effect(() => button_3.disabled = !$.get(provider));
								$.append($$anchor, button_3);
							};

							$.if(
								node_5,
								($$render) => {
									if ($.get(s).status !== 'EXPIRED') $$render(consequent_2);
								},
								true
							);
						}

						$.append($$anchor, fragment_1);
					};

					$.if(
						node_3,
						($$render) => {
							if ($.get(s).status === 'PROVIDER_LOST') $$render(consequent_1); else $$render(alternate, false);
						},
						true
					);
				}

				$.append($$anchor, fragment);
			};

			$.if(node_1, ($$render) => {
				if ($.get(s).status === 'ACTIVE') $$render(consequent); else $$render(alternate_1, false);
			});
		}

		var node_7 = $.sibling(node_1);

		{
			var consequent_3 = ($$anchor) => {
				var button_4 = root_7();

				button_4.__click = () => app.perform('session.end', { session_id: $.get(s).id });

				var node_8 = $.child(button_4);

				Icon(node_8, { name: 'close', size: 13 });
				$.reset(button_4);
				$.template_effect(() => $.set_attribute(button_4, 'aria-label', `End session ${$.get(s).id}`));
				$.append($$anchor, button_4);
			};

			$.if(node_7, ($$render) => {
				if ($.get(s).status !== 'EXPIRED') $$render(consequent_3);
			});
		}

		$.reset(div_3);
		$.reset(td_5);
		$.reset(tr);

		$.template_effect(
			($0, $1, $2, $3, $4) => {
				$.set_attribute(input_1, 'aria-label', `Title for session ${$.get(s).id}`);
				$.set_value(input_1, $.get(s).title);
				$.set_text(text_1, $.get(s).id);
				$.set_text(text_2, $0);
				$.set_text(text_3, $1);
				$.set_text(text_4, $.get(provider)?.label ?? 'Website removed');
				$.set_text(text_5, $.get(s).turn_count);
				$.set_text(text_6, $2);
				classes_1 = $.set_class(span_5, 1, 'tag', null, classes_1, $3);

				classes_2 = $.set_class(span_6, 1, 'dot', null, classes_2, {
					busy: $.get(s).status === 'ACTIVE',
					online: $.get(s).status === 'IDLE'
				});

				$.set_text(text_7, $4);
			},
			[
				() => dateTime($.get(s).last_used),
				() => $.get(s).model.split('/').at(-1),
				() => number($.get(s).context.estimated_used),
				() => ({
					ready: $.get(s).status === 'ACTIVE' || $.get(s).status === 'IDLE',
					attention: ['PROVIDER_LOST', 'RATE_LIMITED'].includes($.get(s).status)
				}),
				() => stateText($.get(s).status)
			]
		);

		$.append($$anchor, tr);
	});

	$.reset(tbody);
	$.reset(table);
	$.reset(div_2);

	var node_9 = $.sibling(div_2, 2);

	{
		var consequent_4 = ($$anchor) => {
			var div_4 = root_8();
			var node_10 = $.child(div_4);

			Icon(node_10, { name: 'history', size: 29 });

			var h2 = $.sibling(node_10);
			var text_8 = $.child(h2, true);

			$.reset(h2);

			var button_5 = $.sibling(h2, 2);

			button_5.__click = () => app.navigate('harness');

			var node_11 = $.sibling($.child(button_5));

			Icon(node_11, { name: 'arrow', size: 14 });
			$.reset(button_5);
			$.reset(div_4);
			$.template_effect(() => $.set_text(text_8, app.sessions.length ? 'No matching conversations' : 'No conversations yet'));
			$.append($$anchor, div_4);
		};

		$.if(node_9, ($$render) => {
			if (!$.get(visible).length) $$render(consequent_4);
		});
	}

	var div_5 = $.sibling(node_9, 2);
	var span_7 = $.child(div_5);
	var text_9 = $.child(span_7);

	$.reset(span_7);
	$.next();
	$.reset(div_5);

	var div_6 = $.sibling(div_5);
	var node_12 = $.child(div_6);

	Icon(node_12, { name: 'shield', size: 16 });
	$.next();
	$.reset(div_6);
	$.reset(div);
	$.reset(section);

	$.template_effect(
		($0, $1) => {
			classes = $.set_class(span_1, 1, 'dot', null, classes, $0);
			$.set_text(text, `${$1 ?? ''} running`);
			$.set_text(text_9, `${$.get(visible).length ?? ''} conversations`);
		},
		[
			() => ({ busy: app.sessions.some((s) => s.status === 'ACTIVE') }),
			() => app.sessions.filter((s) => s.status === 'ACTIVE').length
		]
	);

	$.bind_value(input, () => $.get(query), ($$value) => $.set(query, $$value));
	$.bind_select_value(select, () => $.get(status), ($$value) => $.set(status, $$value));
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['change', 'click']);