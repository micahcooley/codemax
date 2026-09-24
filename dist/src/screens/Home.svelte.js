import '../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import * as bridge from '../lib/api/bridge.js';
import { dateTime, number } from '../lib/format.js';
import Icon from '../lib/components/Icon.svelte.js';

var root = $.from_html(`<div class="log-row"><span class="faint"> </span><span> </span><code> </code><span class="log-detail"> </span></div>`);
var root_1 = $.from_html(`<button class="secondary">Show all levels</button>`);
var root_2 = $.from_html(`<button class="text-button">Logging settings<!></button>`);
var root_3 = $.from_html(`<div class="empty-state"><!><h2> </h2><p>Gateway and connector events will appear here. Debug-level browser metadata requires an explicit logging setting.</p><!></div>`);
var root_4 = $.from_html(`<section class="screen"><div class="screen-inner"><header class="screen-head"><div><div class="breadcrumb">Workspace / Diagnostics</div><h1>Activity</h1><p>A bounded, redacted view of what the local gateway is doing.</p></div><div class="button-group"><button class="secondary"><!>Export diagnostics</button></div></header> <div class="metric-strip"><div><span class="label">Ready providers</span><strong> <span class="muted" style="font-size:16px;letter-spacing:0"> </span></strong><small>Independent browser profiles</small></div><div><span class="label">Available models</span><strong> </strong><small>Observed or user supplied</small></div><div><span class="label">Completed requests</span><strong> </strong><small>During this backend process</small></div><div><span class="label">Failed requests</span><strong> </strong><small>No silent automatic retries</small></div></div> <div class="section-title"><h2>Gateway events</h2><span class="tag"><span></span>Push updates</span></div><div class="filterbar"><span class="muted" style="font-size:11px"> </span><span class="spacer"></span><select aria-label="Event severity"><option>All levels</option><option>Errors</option><option>Warnings</option><option>Information</option><option>Debug</option></select><button class="text-button"><!>Clear</button></div> <!> <!> <div class="note"><!><span>No prompts, response bodies, authentication headers, or cookies are written to the diagnostic event ring. Export only diagnostics you intend to share.</span></div></div></section>`);

export default function Home($$anchor, $$props) {
	$.push($$props, true);

	let level = $.state('all');
	const events = $.derived(() => app.events.filter((e) => $.get(level) === 'all' || e.level === $.get(level)));

	async function exportLogs() {
		const data = await app.perform('logs.export');

		if (data !== undefined) await app.export('bridge-diagnostics.json', { exported_at: new Date().toISOString(), events: data });
	}

	var section = root_4();
	var div = $.child(section);
	var header = $.child(div);
	var div_1 = $.sibling($.child(header));
	var button = $.child(div_1);
	var node = $.child(button);

	Icon(node, { name: 'download', size: 14 });
	$.next();
	$.reset(button);
	$.reset(div_1);
	$.reset(header);

	var div_2 = $.sibling(header, 2);
	var div_3 = $.child(div_2);
	var strong = $.sibling($.child(div_3));
	var text = $.child(strong, true);
	var span = $.sibling(text);
	var text_1 = $.only_child(span);

	$.reset(strong);
	$.next();
	$.reset(div_3);

	var div_4 = $.sibling(div_3);
	var strong_1 = $.sibling($.child(div_4));
	var text_2 = $.only_child(strong_1, true);

	$.next();
	$.reset(div_4);

	var div_5 = $.sibling(div_4);
	var strong_2 = $.sibling($.child(div_5));
	var text_3 = $.only_child(strong_2, true);

	$.next();
	$.reset(div_5);

	var div_6 = $.sibling(div_5);
	var strong_3 = $.sibling($.child(div_6));
	var text_4 = $.only_child(strong_3, true);

	$.next();
	$.reset(div_6);
	$.reset(div_2);

	var div_7 = $.sibling(div_2, 2);
	var span_1 = $.sibling($.child(div_7));
	var span_2 = $.child(span_1);
	let classes;

	$.next();
	$.reset(span_1);
	$.reset(div_7);

	var div_8 = $.sibling(div_7);
	var span_3 = $.child(div_8);
	var text_5 = $.only_child(span_3);
	var select = $.sibling(span_3, 2);
	var option = $.child(select);

	option.value = option.__value = 'all';

	var option_1 = $.sibling(option);

	option_1.value = option_1.__value = 'ERROR';

	var option_2 = $.sibling(option_1);

	option_2.value = option_2.__value = 'WARN';

	var option_3 = $.sibling(option_2);

	option_3.value = option_3.__value = 'INFO';

	var option_4 = $.sibling(option_3);

	option_4.value = option_4.__value = 'DEBUG';
	$.reset(select);
	$.init_select(select);

	var button_1 = $.sibling(select);
	var node_1 = $.child(button_1);

	Icon(node_1, { name: 'trash', size: 13 });
	$.next();
	$.reset(button_1);
	$.reset(div_8);

	var node_2 = $.sibling(div_8, 2);

	$.each(node_2, 17, () => $.get(events), (event) => event.id, ($$anchor, event) => {
		var div_9 = root();
		var span_4 = $.child(div_9);
		var text_6 = $.only_child(span_4, true);
		var span_5 = $.sibling(span_4);
		var text_7 = $.only_child(span_5, true);
		var code = $.sibling(span_5);
		var text_8 = $.only_child(code, true);
		var span_6 = $.sibling(code);
		var text_9 = $.only_child(span_6, true);

		$.reset(div_9);

		$.template_effect(
			($0, $1) => {
				$.set_attribute(span_4, 'title', $0);
				$.set_text(text_6, $1);
				$.set_class(span_5, 1, `log-level ${$.get(event).level}`);
				$.set_text(text_7, $.get(event).level);
				$.set_text(text_8, $.get(event).kind);
				$.set_text(text_9, $.get(event).detail);
			},
			[
				() => dateTime($.get(event).time),
				() => $.get(event).time
					? new Date($.get(event).time * 1000).toLocaleTimeString([], { hour12: false })
					: '—'
			]
		);

		$.append($$anchor, div_9);
	});

	var node_3 = $.sibling(node_2, 2);

	{
		var consequent_1 = ($$anchor) => {
			var div_10 = root_3();
			var node_4 = $.child(div_10);

			Icon(node_4, { name: 'activity', size: 26 });

			var h2 = $.sibling(node_4);
			var text_10 = $.only_child(h2, true);
			var node_5 = $.sibling(h2, 2);

			{
				var consequent = ($$anchor) => {
					var button_2 = root_1();

					$.delegated('click', button_2, () => $.set(level, 'all'));
					$.append($$anchor, button_2);
				};

				var alternate = ($$anchor) => {
					var button_3 = root_2();
					var node_6 = $.sibling($.child(button_3));

					Icon(node_6, { name: 'arrow', size: 13 });
					$.reset(button_3);
					$.delegated('click', button_3, () => app.settingsPage('privacy'));
					$.append($$anchor, button_3);
				};

				$.if(node_5, ($$render) => {
					if (app.events.length) $$render(consequent); else $$render(alternate, -1);
				});
			}

			$.reset(div_10);
			$.template_effect(() => $.set_text(text_10, app.events.length ? 'No events at this level' : 'No retained events'));
			$.append($$anchor, div_10);
		};

		$.if(node_3, ($$render) => {
			if (!$.get(events).length) $$render(consequent_1);
		});
	}

	var div_11 = $.sibling(node_3, 2);
	var node_7 = $.child(div_11);

	Icon(node_7, { name: 'shield', size: 15 });
	$.next();
	$.reset(div_11);
	$.reset(div);
	$.reset(section);

	$.template_effect(
		($0, $1, $2) => {
			button.disabled = !app.ready;
			$.set_text(text, $0);
			$.set_text(text_1, `/ ${app.detectedProviders.length ?? ''}`);
			$.set_text(text_2, app.exposedModels.length);
			$.set_text(text_3, $1);
			$.set_text(text_4, $2);
			classes = $.set_class(span_2, 1, 'dot', null, classes, { online: app.ready });
			$.set_text(text_5, `${$.get(events).length ?? ''} retained events`);
			button_1.disabled = !app.events.length;
		},
		[
			() => app.detectedProviders.filter((p) => p.state === 'READY' && p.exposed).length,
			() => number(app.snapshot?.metrics.completed_requests),
			() => number(app.snapshot?.metrics.failed_requests)
		]
	);

	$.delegated('click', button, exportLogs);
	$.bind_select_value(select, () => $.get(level), ($$value) => $.set(level, $$value));
	$.delegated('click', button_1, () => app.ask('Clear retained diagnostics?', 'This clears the local diagnostic event list. Export any events you need first.', 'Clear diagnostics', () => app.perform('logs.clear')));
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click']);