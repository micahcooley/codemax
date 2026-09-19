import '../../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../../runtime/svelte_internal_client.js';
import { app } from '../../state/app.svelte.js';
import { mappingNames } from '../../types/bridge.js';
import { stateText, number, providerText } from '../../format.js';
import Icon from '../Icon.svelte.js';

var root_3 = $.from_html(`<option> </option>`);
var root_4 = $.from_html(`<button class="mapping-row"><span><!> </span><span class="mapping-node"> </span></button>`);
var root_5 = $.from_html(`<dl class="metadata-list"><dt>Session</dt><dd class="mono"> </dd><dt>Completed turns</dt><dd> </dd></dl><button class="secondary wide" style="margin-top:14px"><!>Stop generation</button>`, 1);
var root_6 = $.from_html(`<p>No request running. A connected client can start a conversation without leaving this website.</p>`);
var root_2 = $.from_html(`<div class="inspector-section"><span class="label">Website connector</span><div class="connection-title"><h2> </h2><span></span></div><span> </span><p style="margin-top:12px"> </p></div> <div class="inspector-section"><label class="field"><span>Default client model</span><select aria-label="Default client model"><option>Select a default…</option><!></select></label><dl class="metadata-list"><dt>Models discovered</dt><dd> </dd><dt>Context window</dt><dd> </dd><dt>Token accounting</dt><dd>Estimated</dd><dt>Tool calls</dt><dd>Text bridge</dd><dt>Connector version</dt><dd class="mono"> </dd></dl></div> <div class="inspector-section"><div class="section-title"><h3>Page controls</h3><small>Click to remap</small></div><!><button class="secondary wide" style="margin-top:13px;font-size:11px"><!>Rescan page</button></div> <div class="inspector-section"><h3>Conversation</h3><!><button class="text-button wide" style="margin-top:10px;font-size:11px;justify-content:space-between">View sessions<!></button></div> <div class="inspector-section" style="border:0"><p class="notice-small">A mapped control is an observation, not a guarantee of model capability. Unknown limits stay unknown.</p></div>`, 1);
var root_7 = $.from_html(`<div class="inspector-section"><h3>Page</h3><div class="control-list"><button><!>Go to provider home</button><button><!>Open in default browser</button><button><!>Find on page<kbd>Ctrl F</kbd></button><button><!>Copy page URL</button></div><div class="inline" style="justify-content:space-between;margin-top:16px"><span class="muted">Page zoom</span><div class="button-group"><button class="icon-button" aria-label="Zoom out">−</button><button class="text-button" title="Reset zoom"> </button><button class="icon-button" aria-label="Zoom in">+</button></div></div></div> <div class="inspector-section"><h3>Explicit website permissions</h3><p style="margin-bottom:12px">Each permission expires after one use or 60 seconds. Downloads never run automatically.</p><div class="control-list"><button class="secondary"><!>Allow one sign-in popup</button><button class="secondary"><!>Allow one download</button></div></div> <div class="inspector-section"><h3>Profile</h3><div class="control-list"><button><!> </button><button><!>Clear website storage</button><button><!>Close this tab</button></div></div> <div class="inspector-section"><h3>Developer tools</h3><p style="margin-bottom:10px">Page inspection is restricted to developer mode. Provider pages cannot open desktop commands.</p><button class="secondary wide"><!>Toggle page inspector</button><button class="text-button wide">Open detector lab<!></button></div>`, 1);
var root_8 = $.from_html(`<div class="inspector-section"><h3>A local connection, not another account</h3><p>Add a website, sign in normally, then connect a client to the local gateway. No provider API key is required.</p><hr/><p>The browser stays at the center. Connection details and page controls live here when you open a website.</p></div>`);
var root = $.from_html(`<aside class="inspector" aria-label="Connection inspector"><div class="inspector-head"><div class="inspector-tabs"><button>Connection</button><button>Browser</button></div><button class="icon-button" aria-label="Close inspector"><!></button></div> <!></aside>`);

export default function Inspector($$anchor, $$props) {
	$.push($$props, true);

	const essentials = [
		'prompt',
		'send',
		'response',
		'model',
		'reasoning',
		'stop',
		'new_chat',
		'attachment'
	];

	const active = $.derived(() => app.sessions.find((s) => s.provider === app.provider?.id && s.status === 'ACTIVE'));
	var aside = root();
	var div = $.child(aside);
	var div_1 = $.child(div);
	var button = $.child(div_1);

	button.__click = () => app.inspectorTab = 'connection';

	let classes;
	var button_1 = $.sibling(button);

	button_1.__click = () => app.inspectorTab = 'browser';

	let classes_1;

	$.reset(div_1);

	var button_2 = $.sibling(div_1);

	button_2.__click = () => {
		app.inspectorVisible = false;
		app.saveLayout();
	};

	var node = $.child(button_2);

	Icon(node, { name: 'close', size: 14 });
	$.reset(button_2);
	$.reset(div);

	var node_1 = $.sibling(div, 2);

	{
		var consequent_2 = ($$anchor) => {
			const p = $.derived(() => app.provider);
			var fragment = $.comment();
			var node_2 = $.first_child(fragment);

			{
				var consequent_1 = ($$anchor) => {
					var fragment_1 = root_2();
					var div_2 = $.first_child(fragment_1);
					var div_3 = $.sibling($.child(div_2));
					var h2 = $.child(div_3);
					var text = $.child(h2, true);

					$.reset(h2);

					var span = $.sibling(h2);
					let classes_2;

					$.reset(div_3);

					var span_1 = $.sibling(div_3);
					let classes_3;
					var text_1 = $.child(span_1, true);

					$.reset(span_1);

					var p_1 = $.sibling(span_1);
					var text_2 = $.child(p_1, true);

					$.reset(p_1);
					$.reset(div_2);

					var div_4 = $.sibling(div_2, 2);
					var label = $.child(div_4);
					var select = $.sibling($.child(label));

					select.__change = (event) => app.settings({ default_model: event.currentTarget.value });

					var option = $.child(select);

					option.value = option.__value = '';

					var node_3 = $.sibling(option);

					$.each(node_3, 17, () => app.models, (model) => model.id, ($$anchor, model) => {
						var option_1 = root_3();
						var text_3 = $.child(option_1);

						$.reset(option_1);

						var option_1_value = {};

						$.template_effect(() => {
							$.set_text(text_3, `${$.get(model).provider.label ?? ''} / ${$.get(model).display_name ?? ''}`);

							if (option_1_value !== (option_1_value = $.get(model).id)) {
								option_1.value = (option_1.__value = $.get(model).id) ?? '';
							}
						});

						$.append($$anchor, option_1);
					});

					$.reset(select);

					var select_value;

					$.init_select(select);
					$.reset(label);

					var dl = $.sibling(label);
					var dd = $.sibling($.child(dl));
					var text_4 = $.child(dd, true);

					$.reset(dd);

					var dd_1 = $.sibling(dd, 2);
					var text_5 = $.child(dd_1, true);

					$.reset(dd_1);

					var dd_2 = $.sibling(dd_1, 6);
					var text_6 = $.child(dd_2, true);

					$.reset(dd_2);
					$.reset(dl);
					$.reset(div_4);

					var div_5 = $.sibling(div_4, 2);
					var node_4 = $.sibling($.child(div_5));

					$.each(node_4, 16, () => essentials, (role) => role, ($$anchor, role) => {
						var button_3 = root_4();

						button_3.__click = () => app.pick(role);

						var span_2 = $.child(button_3);
						var node_5 = $.child(span_2);

						{
							let $0 = $.derived(() => $.get(p).mappings[role] > 0 ? 'check' : 'plus');

							Icon(node_5, {
								get name() {
									return $.get($0);
								},
								size: 12
							});
						}

						var text_7 = $.sibling(node_5, 1, true);

						$.reset(span_2);

						var span_3 = $.sibling(span_2);
						var text_8 = $.child(span_3, true);

						$.reset(span_3);
						$.reset(button_3);

						$.template_effect(() => {
							button_3.disabled = $.get(p).active;
							$.set_attribute(button_3, 'title', `Pick ${mappingNames[role]} on the website`);
							$.set_text(text_7, mappingNames[role]);
							$.set_text(text_8, $.get(p).mappings[role] > 0 ? 'Mapped' : 'Not found');
						});

						$.append($$anchor, button_3);
					});

					var button_4 = $.sibling(node_4);

					button_4.__click = () => app.perform('provider.rescan', { provider_id: $.get(p).id });

					var node_6 = $.child(button_4);

					Icon(node_6, { name: 'scan', size: 14 });
					$.next();
					$.reset(button_4);
					$.reset(div_5);

					var div_6 = $.sibling(div_5, 2);
					var node_7 = $.sibling($.child(div_6));

					{
						var consequent = ($$anchor) => {
							var fragment_2 = root_5();
							var dl_1 = $.first_child(fragment_2);
							var dd_3 = $.sibling($.child(dl_1));
							var text_9 = $.child(dd_3, true);

							$.reset(dd_3);

							var dd_4 = $.sibling(dd_3, 2);
							var text_10 = $.child(dd_4, true);

							$.reset(dd_4);
							$.reset(dl_1);

							var button_5 = $.sibling(dl_1);

							button_5.__click = () => app.cancel($.get(active).id);

							var node_8 = $.child(button_5);

							Icon(node_8, { name: 'stop', size: 13 });
							$.next();
							$.reset(button_5);

							$.template_effect(
								($0) => {
									$.set_text(text_9, $0);
									$.set_text(text_10, $.get(active).turn_count);
								},
								[() => $.get(active).id.slice(-12)]
							);

							$.append($$anchor, fragment_2);
						};

						var alternate = ($$anchor) => {
							var p_2 = root_6();

							$.append($$anchor, p_2);
						};

						$.if(node_7, ($$render) => {
							if ($.get(active)) $$render(consequent); else $$render(alternate, false);
						});
					}

					var button_6 = $.sibling(node_7);

					button_6.__click = () => app.navigate('sessions');

					var node_9 = $.sibling($.child(button_6));

					Icon(node_9, { name: 'arrow', size: 12 });
					$.reset(button_6);
					$.reset(div_6);
					$.next(2);

					$.template_effect(
						($0, $1, $2) => {
							$.set_text(text, $.get(p).label);
							classes_2 = $.set_class(span, 1, 'dot', null, classes_2, { online: $.get(p).state === 'READY', busy: $.get(p).active });

							classes_3 = $.set_class(span_1, 1, 'tag', null, classes_3, {
								ready: $.get(p).state === 'READY',
								attention: $.get(p).state === 'RATE_LIMITED' || $.get(p).state === 'BROKEN_MAPPING'
							});

							$.set_text(text_1, $0);

							$.set_text(text_2, $.get(p).state === 'READY'
								? 'Available to clients on your local gateway.'
								: $.get(p).state === 'LOGIN_REQUIRED'
									? 'Sign in on the website. Account credentials stay in this browser profile.'
									: $.get(p).state === 'RATE_LIMITED'
										? 'The website reported a usage limit. No automatic retry is sent.'
										: 'Use the website normally, then rescan or pick a control to finish connecting.');

							if (select_value !== (select_value = app.preferences.default_model)) {
								(
									select.value = (select.__value = app.preferences.default_model) ?? '',
									$.select_option(select, app.preferences.default_model)
								);
							}

							$.set_text(text_4, $.get(p).models.length);
							$.set_text(text_5, $1);
							$.set_text(text_6, $2);
							button_4.disabled = $.get(p).active;
						},
						[
							() => $.get(p).active ? 'Generating' : providerText($.get(p)),
							() => $.get(p).context_hint
								? `${number($.get(p).context_hint)} · user set`
								: 'Unknown',
							() => String($.get(p).mapping_version).padStart(3, '0')
						]
					);

					$.append($$anchor, fragment_1);
				};

				var alternate_1 = ($$anchor) => {
					var fragment_3 = root_7();
					var div_7 = $.first_child(fragment_3);
					var div_8 = $.sibling($.child(div_7));
					var button_7 = $.child(div_8);

					button_7.__click = () => app.perform('provider.home', { provider_id: $.get(p).id });

					var node_10 = $.child(button_7);

					Icon(node_10, { name: 'home', size: 15 });
					$.next();
					$.reset(button_7);

					var button_8 = $.sibling(button_7);

					button_8.__click = () => app.control('external');

					var node_11 = $.child(button_8);

					Icon(node_11, { name: 'external', size: 15 });
					$.next();
					$.reset(button_8);

					var button_9 = $.sibling(button_8);

					button_9.__click = () => {
						app.findVisible = true;
					};

					var node_12 = $.child(button_9);

					Icon(node_12, { name: 'search', size: 15 });
					$.next(2);
					$.reset(button_9);

					var button_10 = $.sibling(button_9);

					button_10.__click = () => app.clipboard($.get(p).current_url || $.get(p).url);

					var node_13 = $.child(button_10);

					Icon(node_13, { name: 'copy', size: 15 });
					$.next();
					$.reset(button_10);
					$.reset(div_8);

					var div_9 = $.sibling(div_8);
					var div_10 = $.sibling($.child(div_9));
					var button_11 = $.child(div_10);

					button_11.__click = () => app.control('zoom_out');

					var button_12 = $.sibling(button_11);

					button_12.__click = () => app.control('zoom_reset');

					var text_11 = $.child(button_12);

					$.reset(button_12);

					var button_13 = $.sibling(button_12);

					button_13.__click = () => app.control('zoom_in');
					$.reset(div_10);
					$.reset(div_9);
					$.reset(div_7);

					var div_11 = $.sibling(div_7, 2);
					var div_12 = $.sibling($.child(div_11), 2);
					var button_14 = $.child(div_12);

					button_14.__click = () => app.control('popup_once');

					var node_14 = $.child(button_14);

					Icon(node_14, { name: 'external', size: 15 });
					$.next();
					$.reset(button_14);

					var button_15 = $.sibling(button_14);

					button_15.__click = () => app.control('download_once');

					var node_15 = $.child(button_15);

					Icon(node_15, { name: 'download', size: 15 });
					$.next();
					$.reset(button_15);
					$.reset(div_12);
					$.reset(div_11);

					var div_13 = $.sibling(div_11, 2);
					var div_14 = $.sibling($.child(div_13));
					var button_16 = $.child(div_14);

					button_16.__click = () => app.perform('provider.update', { provider_id: $.get(p).id, pinned: !$.get(p).pinned });

					var node_16 = $.child(button_16);

					Icon(node_16, { name: 'pin', size: 15 });

					var text_12 = $.sibling(node_16, 1, true);

					$.reset(button_16);

					var button_17 = $.sibling(button_16);

					button_17.__click = () => app.showPopup('clear-profile', $.get(p).id);

					var node_17 = $.child(button_17);

					Icon(node_17, { name: 'refresh', size: 15 });
					$.next();
					$.reset(button_17);

					var button_18 = $.sibling(button_17);

					button_18.__click = () => app.closeProvider($.get(p).id);

					var node_18 = $.child(button_18);

					Icon(node_18, { name: 'close', size: 15 });
					$.next();
					$.reset(button_18);
					$.reset(div_14);
					$.reset(div_13);

					var div_15 = $.sibling(div_13, 2);
					var button_19 = $.sibling($.child(div_15), 2);

					button_19.__click = () => app.control('inspect');

					var node_19 = $.child(button_19);

					Icon(node_19, { name: 'terminal', size: 14 });
					$.next();
					$.reset(button_19);

					var button_20 = $.sibling(button_19);

					button_20.__click = () => app.navigate('detector');

					var node_20 = $.sibling($.child(button_20));

					Icon(node_20, { name: 'arrow', size: 13 });
					$.reset(button_20);
					$.reset(div_15);

					$.template_effect(() => {
						button_7.disabled = $.get(p).active;
						$.set_text(text_11, `${app.zoom ?? ''}%`);

						$.set_text(text_12, $.get(p).pinned
							? 'Allow sleeping when idle'
							: 'Keep this website awake');

						button_19.disabled = !app.preferences.developer_mode;
					});

					$.append($$anchor, fragment_3);
				};

				$.if(node_2, ($$render) => {
					if (app.inspectorTab === 'connection') $$render(consequent_1); else $$render(alternate_1, false);
				});
			}

			$.append($$anchor, fragment);
		};

		var alternate_2 = ($$anchor) => {
			var div_16 = root_8();

			$.append($$anchor, div_16);
		};

		$.if(node_1, ($$render) => {
			if (app.provider) $$render(consequent_2); else $$render(alternate_2, false);
		});
	}

	$.reset(aside);

	$.template_effect(() => {
		classes = $.set_class(button, 1, '', null, classes, { active: app.inspectorTab === 'connection' });
		classes_1 = $.set_class(button_1, 1, '', null, classes_1, { active: app.inspectorTab === 'browser' });
	});

	$.append($$anchor, aside);
	$.pop();
}

$.delegate(['click', 'change']);