import '../../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../../runtime/svelte_internal_client.js';
import { app } from '../../state/app.svelte.js';
import { mappingNames } from '../../types/bridge.js';
import { stateText, number, providerText } from '../../format.js';
import Icon from '../Icon.svelte.js';

var root_3 = $.from_html(`<div class="inspector-section"><h3>Available here</h3><dl class="metadata-list"><dt>Current model</dt><dd> </dd><dt>Models discovered</dt><dd> </dd><dt>Reasoning</dt><dd> </dd><dt>Context budget</dt><dd> </dd><dt>Token accounting</dt><dd>Estimated</dd></dl><div class="control-list" style="margin-top:14px"><button><!>Use in a coding client</button><button><!>Provider settings</button><button><!>Tasks with MCP tools</button></div></div>`);
var root_4 = $.from_html(`<div class="inspector-section"><h3>Discovery stays out of the way</h3><p>This profile is not exposed as a model provider. Browse and sign in normally; opening a model menu lets Codemax observe its choices.</p><p style="margin-top:12px">No test prompts are sent, and no models are invented for ordinary websites.</p></div>`);
var root_5 = $.from_html(`<button class="mapping-row"><span><!> </span><span class="mapping-node"> </span></button>`);
var root_6 = $.from_html(`<dl class="metadata-list"><dt>Session</dt><dd class="mono"> </dd><dt>Completed turns</dt><dd> </dd></dl><button class="secondary wide" style="margin-top:14px"><!>Stop generation</button>`, 1);
var root_7 = $.from_html(`<p>No request running. A connected client can start a conversation without leaving this website.</p>`);
var root_2 = $.from_html(`<div class="inspector-section"><span class="label"> </span><div class="connection-title"><h2> </h2><span></span></div><span> </span><p style="margin-top:12px"> </p></div> <!> <details class="inspector-section"><summary>Advanced · detected page controls</summary><p style="margin:12px 0">Record a control only when automatic discovery needs help.</p><!><button class="secondary wide" style="margin-top:13px;font-size:11px"><!>Rescan page</button></details> <div class="inspector-section"><h3>Conversation</h3><!><button class="text-button wide" style="margin-top:10px;font-size:11px;justify-content:space-between">View sessions<!></button></div> <div class="inspector-section" style="border:0"><p class="notice-small">A mapped control is an observation, not a guarantee of model capability. Unknown limits stay unknown.</p></div>`, 1);
var root_8 = $.from_html(`<div class="inspector-section"><h3>Page</h3><div class="control-list"><button><!>Go to provider home</button><button><!>Open in default browser</button><button><!>Find on page<kbd>Ctrl F</kbd></button><button><!>Copy page URL</button></div><div class="inline" style="justify-content:space-between;margin-top:16px"><span class="muted">Page zoom</span><div class="button-group"><button class="icon-button" aria-label="Zoom out">−</button><button class="text-button" title="Reset zoom"> </button><button class="icon-button" aria-label="Zoom in">+</button></div></div></div> <div class="inspector-section"><h3>Explicit website permissions</h3><p style="margin-bottom:12px">Each permission expires after one use or 60 seconds. Downloads never run automatically.</p><div class="control-list"><button class="secondary"><!>Allow one sign-in popup</button><button class="secondary"><!>Allow one download</button></div></div> <div class="inspector-section"><h3>Profile</h3><div class="control-list"><button><!> </button><button><!>Clear website storage</button><button><!>Close this tab</button></div></div> <div class="inspector-section"><h3>Developer tools</h3><p style="margin-bottom:10px">Page inspection is restricted to developer mode. Provider pages cannot open desktop commands.</p><button class="secondary wide"><!>Toggle page inspector</button><button class="text-button wide">Open detector lab<!></button></div>`, 1);
var root_9 = $.from_html(`<div class="inspector-section"><h3>A local connection, not another account</h3><p>Add a website, sign in normally, then connect a client to the local gateway. No provider API key is required.</p><hr/><p>The browser stays at the center. Connection details and page controls live here when you open a website.</p></div>`);
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
		var consequent_3 = ($$anchor) => {
			const p = $.derived(() => app.provider);
			var fragment = $.comment();
			var node_2 = $.first_child(fragment);

			{
				var consequent_2 = ($$anchor) => {
					var fragment_1 = root_2();
					var div_2 = $.first_child(fragment_1);
					var span = $.child(div_2);
					var text = $.child(span, true);

					$.reset(span);

					var div_3 = $.sibling(span);
					var h2 = $.child(div_3);
					var text_1 = $.child(h2, true);

					$.reset(h2);

					var span_1 = $.sibling(h2);
					let classes_2;

					$.reset(div_3);

					var span_2 = $.sibling(div_3);
					let classes_3;
					var text_2 = $.child(span_2, true);

					$.reset(span_2);

					var p_1 = $.sibling(span_2);
					var text_3 = $.child(p_1, true);

					$.reset(p_1);
					$.reset(div_2);

					var node_3 = $.sibling(div_2, 2);

					{
						var consequent = ($$anchor) => {
							var div_4 = root_3();
							var dl = $.sibling($.child(div_4));
							var dd = $.sibling($.child(dl));
							var text_4 = $.child(dd, true);

							$.reset(dd);

							var dd_1 = $.sibling(dd, 2);
							var text_5 = $.child(dd_1, true);

							$.reset(dd_1);

							var dd_2 = $.sibling(dd_1, 2);
							var text_6 = $.child(dd_2, true);

							$.reset(dd_2);

							var dd_3 = $.sibling(dd_2, 2);
							var text_7 = $.child(dd_3, true);

							$.reset(dd_3);
							$.next(2);
							$.reset(dl);

							var div_5 = $.sibling(dl);
							var button_3 = $.child(div_5);

							button_3.__click = () => app.navigate('harness');

							var node_4 = $.child(button_3);

							Icon(node_4, { name: 'terminal', size: 14 });
							$.next();
							$.reset(button_3);

							var button_4 = $.sibling(button_3);

							button_4.__click = () => app.navigate('providers');

							var node_5 = $.child(button_4);

							Icon(node_5, { name: 'settings', size: 14 });
							$.next();
							$.reset(button_4);

							var button_5 = $.sibling(button_4);

							button_5.__click = () => app.navigate('tools');

							var node_6 = $.child(button_5);

							Icon(node_6, { name: 'shield', size: 14 });
							$.next();
							$.reset(button_5);
							$.reset(div_5);
							$.reset(div_4);

							$.template_effect(
								($0, $1) => {
									$.set_text(text_4, $.get(p).current_model || 'Unknown');
									$.set_text(text_5, $.get(p).models.length);
									$.set_text(text_6, $0);
									$.set_text(text_7, $1);
								},
								[
									() => $.get(p).reasoning_modes?.map((m) => m.label).join(' / ') || 'Unknown',
									() => $.get(p).context_hint
										? `${number($.get(p).context_hint)} · user set`
										: 'Model-specific · see Providers'
								]
							);

							$.append($$anchor, div_4);
						};

						var alternate = ($$anchor) => {
							var div_6 = root_4();

							$.append($$anchor, div_6);
						};

						$.if(node_3, ($$render) => {
							if ($.get(p).detected && !$.get(p).dismissed) $$render(consequent); else $$render(alternate, false);
						});
					}

					var details = $.sibling(node_3, 2);
					var node_7 = $.sibling($.child(details), 2);

					$.each(node_7, 16, () => essentials, (role) => role, ($$anchor, role) => {
						var button_6 = root_5();

						button_6.__click = () => app.pick(role);

						var span_3 = $.child(button_6);
						var node_8 = $.child(span_3);

						{
							let $0 = $.derived(() => $.get(p).mappings[role] > 0 ? 'check' : 'plus');

							Icon(node_8, {
								get name() {
									return $.get($0);
								},
								size: 12
							});
						}

						var text_8 = $.sibling(node_8, 1, true);

						$.reset(span_3);

						var span_4 = $.sibling(span_3);
						var text_9 = $.child(span_4, true);

						$.reset(span_4);
						$.reset(button_6);

						$.template_effect(() => {
							button_6.disabled = $.get(p).active;
							$.set_attribute(button_6, 'title', `Pick ${mappingNames[role]} on the website`);
							$.set_text(text_8, mappingNames[role]);
							$.set_text(text_9, $.get(p).mappings[role] > 0 ? 'Observed' : 'Unknown');
						});

						$.append($$anchor, button_6);
					});

					var button_7 = $.sibling(node_7);

					button_7.__click = () => app.perform('provider.rescan', { provider_id: $.get(p).id });

					var node_9 = $.child(button_7);

					Icon(node_9, { name: 'scan', size: 14 });
					$.next();
					$.reset(button_7);
					$.reset(details);

					var div_7 = $.sibling(details, 2);
					var node_10 = $.sibling($.child(div_7));

					{
						var consequent_1 = ($$anchor) => {
							var fragment_2 = root_6();
							var dl_1 = $.first_child(fragment_2);
							var dd_4 = $.sibling($.child(dl_1));
							var text_10 = $.child(dd_4, true);

							$.reset(dd_4);

							var dd_5 = $.sibling(dd_4, 2);
							var text_11 = $.child(dd_5, true);

							$.reset(dd_5);
							$.reset(dl_1);

							var button_8 = $.sibling(dl_1);

							button_8.__click = () => app.cancel($.get(active).id);

							var node_11 = $.child(button_8);

							Icon(node_11, { name: 'stop', size: 13 });
							$.next();
							$.reset(button_8);

							$.template_effect(
								($0) => {
									$.set_text(text_10, $0);
									$.set_text(text_11, $.get(active).turn_count);
								},
								[() => $.get(active).id.slice(-12)]
							);

							$.append($$anchor, fragment_2);
						};

						var alternate_1 = ($$anchor) => {
							var p_2 = root_7();

							$.append($$anchor, p_2);
						};

						$.if(node_10, ($$render) => {
							if ($.get(active)) $$render(consequent_1); else $$render(alternate_1, false);
						});
					}

					var button_9 = $.sibling(node_10);

					button_9.__click = () => app.navigate('sessions');

					var node_12 = $.sibling($.child(button_9));

					Icon(node_12, { name: 'arrow', size: 12 });
					$.reset(button_9);
					$.reset(div_7);
					$.next(2);

					$.template_effect(
						($0) => {
							$.set_text(text, $.get(p).detected ? 'Detected provider' : 'Browser tab');
							$.set_text(text_1, $.get(p).label);
							classes_2 = $.set_class(span_1, 1, 'dot', null, classes_2, { online: $.get(p).state === 'READY', busy: $.get(p).active });

							classes_3 = $.set_class(span_2, 1, 'tag', null, classes_3, {
								ready: $.get(p).state === 'READY',
								attention: $.get(p).state === 'RATE_LIMITED' || $.get(p).state === 'BROKEN_MAPPING'
							});

							$.set_text(text_2, $0);

							$.set_text(text_3, $.get(p).state === 'READY' && $.get(p).exposed
								? 'Enabled models are available to your selected client.'
								: $.get(p).state === 'READY'
									? 'Detected; exposure to clients is turned off.'
									: $.get(p).state === 'LOGIN_REQUIRED'
										? 'Sign in on the website. Account credentials stay in this browser profile.'
										: $.get(p).state === 'RATE_LIMITED'
											? 'The website reported a usage limit. No automatic retry is sent.'
											: $.get(p).discovery_reason || 'Browse normally. A website becomes a provider only after positive chat and model evidence.');

							button_7.disabled = $.get(p).active;
						},
						[
							() => $.get(p).active ? 'Generating' : providerText($.get(p))
						]
					);

					$.append($$anchor, fragment_1);
				};

				var alternate_2 = ($$anchor) => {
					var fragment_3 = root_8();
					var div_8 = $.first_child(fragment_3);
					var div_9 = $.sibling($.child(div_8));
					var button_10 = $.child(div_9);

					button_10.__click = () => app.perform('provider.home', { provider_id: $.get(p).id });

					var node_13 = $.child(button_10);

					Icon(node_13, { name: 'home', size: 15 });
					$.next();
					$.reset(button_10);

					var button_11 = $.sibling(button_10);

					button_11.__click = () => app.control('external');

					var node_14 = $.child(button_11);

					Icon(node_14, { name: 'external', size: 15 });
					$.next();
					$.reset(button_11);

					var button_12 = $.sibling(button_11);

					button_12.__click = () => {
						app.showFind();
					};

					var node_15 = $.child(button_12);

					Icon(node_15, { name: 'search', size: 15 });
					$.next(2);
					$.reset(button_12);

					var button_13 = $.sibling(button_12);

					button_13.__click = () => app.clipboard(app.pageUrl);

					var node_16 = $.child(button_13);

					Icon(node_16, { name: 'copy', size: 15 });
					$.next();
					$.reset(button_13);
					$.reset(div_9);

					var div_10 = $.sibling(div_9);
					var div_11 = $.sibling($.child(div_10));
					var button_14 = $.child(div_11);

					button_14.__click = () => app.control('zoom_out');

					var button_15 = $.sibling(button_14);

					button_15.__click = () => app.control('zoom_reset');

					var text_12 = $.child(button_15);

					$.reset(button_15);

					var button_16 = $.sibling(button_15);

					button_16.__click = () => app.control('zoom_in');
					$.reset(div_11);
					$.reset(div_10);
					$.reset(div_8);

					var div_12 = $.sibling(div_8, 2);
					var div_13 = $.sibling($.child(div_12), 2);
					var button_17 = $.child(div_13);

					button_17.__click = () => app.control('popup_once');

					var node_17 = $.child(button_17);

					Icon(node_17, { name: 'external', size: 15 });
					$.next();
					$.reset(button_17);

					var button_18 = $.sibling(button_17);

					button_18.__click = () => app.control('download_once');

					var node_18 = $.child(button_18);

					Icon(node_18, { name: 'download', size: 15 });
					$.next();
					$.reset(button_18);
					$.reset(div_13);
					$.reset(div_12);

					var div_14 = $.sibling(div_12, 2);
					var div_15 = $.sibling($.child(div_14));
					var button_19 = $.child(div_15);

					button_19.__click = () => app.perform('provider.update', { provider_id: $.get(p).id, pinned: !$.get(p).pinned });

					var node_19 = $.child(button_19);

					Icon(node_19, { name: 'pin', size: 15 });

					var text_13 = $.sibling(node_19, 1, true);

					$.reset(button_19);

					var button_20 = $.sibling(button_19);

					button_20.__click = () => app.showPopup('clear-profile', $.get(p).id);

					var node_20 = $.child(button_20);

					Icon(node_20, { name: 'refresh', size: 15 });
					$.next();
					$.reset(button_20);

					var button_21 = $.sibling(button_20);

					button_21.__click = () => app.closeProvider($.get(p).id);

					var node_21 = $.child(button_21);

					Icon(node_21, { name: 'close', size: 15 });
					$.next();
					$.reset(button_21);
					$.reset(div_15);
					$.reset(div_14);

					var div_16 = $.sibling(div_14, 2);
					var button_22 = $.sibling($.child(div_16), 2);

					button_22.__click = () => app.control('inspect');

					var node_22 = $.child(button_22);

					Icon(node_22, { name: 'terminal', size: 14 });
					$.next();
					$.reset(button_22);

					var button_23 = $.sibling(button_22);

					button_23.__click = () => app.navigate('detector');

					var node_23 = $.sibling($.child(button_23));

					Icon(node_23, { name: 'arrow', size: 13 });
					$.reset(button_23);
					$.reset(div_16);

					$.template_effect(() => {
						button_10.disabled = $.get(p).active;
						$.set_text(text_12, `${app.zoom ?? ''}%`);

						$.set_text(text_13, $.get(p).pinned
							? 'Allow sleeping when idle'
							: 'Keep this website awake');

						button_22.disabled = !app.preferences.developer_mode;
					});

					$.append($$anchor, fragment_3);
				};

				$.if(node_2, ($$render) => {
					if (app.inspectorTab === 'connection') $$render(consequent_2); else $$render(alternate_2, false);
				});
			}

			$.append($$anchor, fragment);
		};

		var alternate_3 = ($$anchor) => {
			var div_17 = root_9();

			$.append($$anchor, div_17);
		};

		$.if(node_1, ($$render) => {
			if (app.provider) $$render(consequent_3); else $$render(alternate_3, false);
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

$.delegate(['click']);