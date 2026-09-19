import '../../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../../runtime/svelte_internal_client.js';
import TabActivity from '../TabActivity.svelte.js';
import { app } from '../../state/app.svelte.js';
import { routes } from '../../types/bridge.js';
import { initials, providerText } from '../../format.js';
import Icon from '../Icon.svelte.js';

var root_1 = $.from_html(`<button><span class="site-letter"> </span><span class="site-details"><strong> </strong><small> </small></span> <!> <!></button>`);
var root_4 = $.from_html(`<small> </small>`);
var root_6 = $.from_html(`<span class="dot busy"></span>`);
var root_3 = $.from_html(`<button><!><span> </span><!></button>`);
var root_7 = $.from_html(`<kbd>Ctrl K</kbd>`);
var root_9 = $.from_html(`<div class="context-menu" role="menu"><button role="menuitem"><!>Open website</button> <button role="menuitem"><!> </button> <button role="menuitem"><!>Inspect connector</button> <button role="menuitem"><!>Close tab</button><hr/> <button role="menuitem"><!>Clear local profile</button> <button role="menuitem" class="danger-text"><!>Remove website</button></div>`);
var root = $.from_html(`<aside aria-label="Workspace sidebar"><div class="workspace-title"><span class="workspace-logo"><!></span><span><strong>Personal workspace</strong><small>Websites, connected locally</small></span></div> <div class="sidebar-section"><span class="label">Your websites</span><span class="spacer"></span><span class="count"> </span></div> <div class="site-list"><!> <button class="site-add" aria-label="Add website"><!><span>Add website</span></button></div> <nav class="workspace-nav" aria-label="Workspace tools"></nav> <div class="sidebar-bottom"><button title="Settings"><!><span>Settings</span></button><button title="Command palette"><!><span>Commands</span><!></button><div class="local-note"><!><span>Private profiles. Local gateway.</span></div></div></aside> <!>`, 1);

export default function Sidebar($$anchor, $$props) {
	$.push($$props, true);

	const navigation = $.derived(() => routes.filter((r) => !['browser', 'settings'].includes(r.id)));

	function context(event, id) {
		event.preventDefault();

		app.contextMenu = {
			id,
			y: Math.max(92, Math.min(event.clientY, window.innerHeight - 265))
		};
	}

	var fragment = root();
	var aside = $.first_child(fragment);
	let classes;
	var div = $.child(aside);
	var span = $.child(div);
	var node = $.child(span);

	Icon(node, { name: 'folder', size: 15 });
	$.reset(span);
	$.next();
	$.reset(div);

	var div_1 = $.sibling(div, 2);
	var span_1 = $.sibling($.child(div_1), 2);
	var text = $.child(span_1, true);

	$.reset(span_1);
	$.reset(div_1);

	var div_2 = $.sibling(div_1, 2);
	var node_1 = $.child(div_2);

	$.each(node_1, 17, () => [...app.providers].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.id - b.id), (provider) => provider.id, ($$anchor, provider) => {
		var button = root_1();
		let classes_1;

		button.__click = () => app.openProvider($.get(provider).id);
		button.__contextmenu = (event) => context(event, $.get(provider).id);

		var span_2 = $.child(button);
		var text_1 = $.child(span_2, true);

		$.reset(span_2);

		var span_3 = $.sibling(span_2);
		var strong = $.child(span_3);
		var text_2 = $.child(strong, true);

		$.reset(strong);

		var small = $.sibling(strong);
		var text_3 = $.child(small, true);

		$.reset(small);
		$.reset(span_3);

		var node_2 = $.sibling(span_3, 2);

		{
			let $0 = $.derived(() => app.loading[$.get(provider).id] === true);

			TabActivity(node_2, {
				get provider() {
					return $.get(provider);
				},

				get loading() {
					return $.get($0);
				},

				get online() {
					return app.ready;
				}
			});
		}

		var node_3 = $.sibling(node_2, 2);

		{
			var consequent = ($$anchor) => {
				Icon($$anchor, { name: 'pin', size: 11 });
			};

			$.if(node_3, ($$render) => {
				if ($.get(provider).pinned && app.sidebarVisible) $$render(consequent);
			});
		}

		$.reset(button);

		$.template_effect(
			($0, $1, $2) => {
				classes_1 = $.set_class(button, 1, 'site-row', null, classes_1, {
					selected: app.selectedProvider === $.get(provider).id && app.route === 'browser'
				});

				$.set_attribute(button, 'title', $0);
				$.set_text(text_1, $1);
				$.set_text(text_2, $.get(provider).label);
				$.set_text(text_3, $2);
			},
			[
				() => `${$.get(provider).label} · ${providerText($.get(provider))}`,
				() => initials($.get(provider).label),
				() => $.get(provider).active
					? 'Generating a response'
					: providerText($.get(provider))
			]
		);

		$.append($$anchor, button);
	});

	var button_1 = $.sibling(node_1, 2);

	button_1.__click = () => app.showPopup('add');

	var node_4 = $.child(button_1);

	Icon(node_4, { name: 'plus', size: 17 });
	$.next();
	$.reset(button_1);
	$.reset(div_2);

	var nav = $.sibling(div_2, 2);

	$.each(nav, 21, () => $.get(navigation), (route) => route.id, ($$anchor, route) => {
		var button_2 = root_3();

		button_2.__click = () => app.navigate($.get(route).id);

		let classes_2;
		var node_5 = $.child(button_2);

		Icon(node_5, {
			get name() {
				return $.get(route).icon;
			},
			size: 16
		});

		var span_4 = $.sibling(node_5);
		var text_4 = $.child(span_4, true);

		$.reset(span_4);

		var node_6 = $.sibling(span_4);

		{
			var consequent_1 = ($$anchor) => {
				var small_1 = root_4();
				var text_5 = $.child(small_1, true);

				$.reset(small_1);
				$.template_effect(() => $.set_text(text_5, app.models.length));
				$.append($$anchor, small_1);
			};

			var alternate = ($$anchor) => {
				var fragment_2 = $.comment();
				var node_7 = $.first_child(fragment_2);

				{
					var consequent_2 = ($$anchor) => {
						var span_5 = root_6();

						$.append($$anchor, span_5);
					};

					$.if(
						node_7,
						($$render) => {
							if ($.get(route).id === 'sessions' && app.sessions.some((s) => s.status === 'ACTIVE')) $$render(consequent_2);
						},
						true
					);
				}

				$.append($$anchor, fragment_2);
			};

			$.if(node_6, ($$render) => {
				if ($.get(route).id === 'models') $$render(consequent_1); else $$render(alternate, false);
			});
		}

		$.reset(button_2);

		$.template_effect(() => {
			$.set_attribute(button_2, 'aria-current', app.route === $.get(route).id ? 'page' : undefined);
			$.set_attribute(button_2, 'title', $.get(route).title);
			classes_2 = $.set_class(button_2, 1, '', null, classes_2, { active: app.route === $.get(route).id });
			$.set_text(text_4, $.get(route).title);
		});

		$.append($$anchor, button_2);
	});

	$.reset(nav);

	var div_3 = $.sibling(nav, 2);
	var button_3 = $.child(div_3);

	button_3.__click = () => app.navigate('settings');

	let classes_3;
	var node_8 = $.child(button_3);

	Icon(node_8, { name: 'settings', size: 16 });
	$.next();
	$.reset(button_3);

	var button_4 = $.sibling(button_3);

	button_4.__click = () => app.showPopup('commands');

	var node_9 = $.child(button_4);

	Icon(node_9, { name: 'command', size: 15 });

	var node_10 = $.sibling(node_9, 2);

	{
		var consequent_3 = ($$anchor) => {
			var kbd = root_7();

			$.append($$anchor, kbd);
		};

		$.if(node_10, ($$render) => {
			if (app.sidebarVisible) $$render(consequent_3);
		});
	}

	$.reset(button_4);

	var div_4 = $.sibling(button_4);
	var node_11 = $.child(div_4);

	Icon(node_11, { name: 'shield', size: 12 });
	$.next();
	$.reset(div_4);
	$.reset(div_3);
	$.reset(aside);

	var node_12 = $.sibling(aside, 2);

	{
		var consequent_5 = ($$anchor) => {
			const provider = $.derived(() => app.providers.find((p) => p.id === app.contextMenu?.id));
			var fragment_3 = $.comment();
			var node_13 = $.first_child(fragment_3);

			{
				var consequent_4 = ($$anchor) => {
					var div_5 = root_9();
					let styles;
					var button_5 = $.child(div_5);

					button_5.__click = () => app.openProvider($.get(provider).id);

					var node_14 = $.child(button_5);

					Icon(node_14, { name: 'globe', size: 14 });
					$.next();
					$.reset(button_5);

					var button_6 = $.sibling(button_5, 2);

					button_6.__click = () => {
						void app.perform('provider.update', {
							provider_id: $.get(provider).id,
							pinned: !$.get(provider).pinned
						});

						app.contextMenu = null;
					};

					var node_15 = $.child(button_6);

					Icon(node_15, { name: 'pin', size: 14 });

					var text_6 = $.sibling(node_15, 1, true);

					$.reset(button_6);

					var button_7 = $.sibling(button_6, 2);

					button_7.__click = () => {
						app.selectedProvider = $.get(provider).id;
						app.navigate('detector');
					};

					var node_16 = $.child(button_7);

					Icon(node_16, { name: 'scan', size: 14 });
					$.next();
					$.reset(button_7);

					var button_8 = $.sibling(button_7, 2);

					button_8.__click = () => {
						app.contextMenu = null;
						void app.closeProvider($.get(provider).id);
					};

					var node_17 = $.child(button_8);

					Icon(node_17, { name: 'close', size: 14 });
					$.next();
					$.reset(button_8);

					var button_9 = $.sibling(button_8, 3);

					button_9.__click = () => app.showPopup('clear-profile', $.get(provider).id);

					var node_18 = $.child(button_9);

					Icon(node_18, { name: 'refresh', size: 14 });
					$.next();
					$.reset(button_9);

					var button_10 = $.sibling(button_9, 2);

					button_10.__click = () => app.showPopup('remove-provider', $.get(provider).id);

					var node_19 = $.child(button_10);

					Icon(node_19, { name: 'trash', size: 14 });
					$.next();
					$.reset(button_10);
					$.reset(div_5);

					$.template_effect(() => {
						$.set_attribute(div_5, 'aria-label', `${$.get(provider).label} actions`);
						styles = $.set_style(div_5, '', styles, { left: '8px', top: `${app.contextMenu.y}px` });
						$.set_text(text_6, $.get(provider).pinned ? 'Unpin website' : 'Keep website awake');
					});

					$.append($$anchor, div_5);
				};

				$.if(node_13, ($$render) => {
					if ($.get(provider)) $$render(consequent_4);
				});
			}

			$.append($$anchor, fragment_3);
		};

		$.if(node_12, ($$render) => {
			if (app.contextMenu) $$render(consequent_5);
		});
	}

	$.template_effect(() => {
		classes = $.set_class(aside, 1, 'workspace-sidebar', null, classes, { collapsed: !app.sidebarVisible });
		$.set_text(text, app.providers.length);
		button_1.disabled = !app.ready;
		classes_3 = $.set_class(button_3, 1, '', null, classes_3, { active: app.route === 'settings' });
	});

	$.append($$anchor, fragment);
	$.pop();
}

$.delegate(['click', 'contextmenu']);