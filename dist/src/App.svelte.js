import '../runtime/svelte_internal_disclose-version.js';
import * as $ from '../runtime/svelte_internal_client.js';
import { onMount, tick } from '../runtime/svelte_svelte.js';
import * as bridge from './lib/api/bridge.js';
import { app } from './lib/state/app.svelte.js';
import { routes } from './lib/types/bridge.js';
import { initials, errorText } from './lib/format.js';
import TabActivity from './lib/components/TabActivity.svelte.js';
import Icon from './lib/components/Icon.svelte.js';
import Dialog from './lib/components/Dialog.svelte.js';
import ChromeMenu from './lib/components/chrome/ChromeMenu.svelte.js';
import Providers from './screens/Providers.svelte.js';
import Tools from './screens/Tools.svelte.js';
import Home from './screens/Home.svelte.js';
import ProviderBrowser from './screens/ProviderBrowser.svelte.js';
import Models from './screens/Models.svelte.js';
import Harness from './screens/Harness.svelte.js';
import Sessions from './screens/Sessions.svelte.js';
import Detector from './screens/Detector.svelte.js';
import Settings from './screens/Settings.svelte.js';

var root_1 = $.from_html(`<div draggable="true" role="presentation"><button class="tab-open" role="tab"><span class="tab-initial"> </span><span class="truncate"> </span><!></button><button class="tab-close"><!></button></div>`);
var root_2 = $.from_html(`<div class="browser-tab active"><button class="tab-open" role="tab" aria-selected="true"><span class="tab-initial"><!></span><span>New tab</span></button></div>`);
var root_4 = $.from_html(`<div class="browser-tab active utility-tab"><button class="tab-open" role="tab" aria-selected="true"><span class="tab-initial"><!></span><span class="truncate"> </span></button><button class="tab-close" aria-label="Return to browser"><!></button></div>`);
var root_5 = $.from_html(`<button class="icon-button" style="width:23px;height:23px;min-width:23px;min-height:23px" type="button" aria-label="Copy website URL"><!></button>`);
var root_6 = $.from_html(`<form class="findbar"><!><input aria-label="Find on page" placeholder="Find on this page" maxlength="256"/><small>Enter to find next</small><button type="button" class="icon-button" aria-label="Previous match"><!></button><button class="icon-button" aria-label="Next match"><!></button><button type="button" class="icon-button" aria-label="Close find"><!></button></form>`);
var root_7 = $.from_html(`<div><!><span> </span><button class="text-button">Runtime settings</button></div>`);
var root_8 = $.from_html(`<div class="layout-notice error" role="alert"><!><span> </span><button class="icon-button" aria-label="Dismiss error"><!></button></div>`);
var root_9 = $.from_html(`<div class="layout-notice" role="status"><!><span> </span><button class="icon-button" aria-label="Dismiss notification"><!></button></div>`);
var root_29 = $.from_html(`<form><p class="dialog-description">Open the public chat page, then sign in on the website. Its browser profile is kept separate from your other providers.</p><label class="field">Website address<input required maxlength="2048" placeholder="https://chat.example.com" autocomplete="url" spellcheck="false"/></label><label class="field">Name in your workspace <span class="faint">Optional</span><input maxlength="120" placeholder="Use the website’s name" autocomplete="off"/></label><div class="dialog-notice"><!><span>Use an HTTPS chat URL, not a sign-in callback or a link containing credentials. Website quotas still apply.</span></div><div class="dialog-actions"><button type="button" class="secondary">Cancel</button><button class="primary">Open website<!></button></div></form>`);
var root_34 = $.from_html(`<kbd>↵</kbd>`);
var root_33 = $.from_html(`<button><!><span><strong> </strong><small> </small></span><!></button>`);
var root_35 = $.from_html(`<p class="muted" style="padding:20px 5px">No matching commands.</p>`);
var root_32 = $.from_html(`<label class="command-search"><!><input aria-label="Search commands" placeholder="Search pages, websites, and actions…" autocomplete="off"/></label><div class="command-results"><!><!></div><div class="command-footer">↑ ↓ to navigate <span style="margin-left:15px">Enter to open</span><span style="float:right">Esc to close</span></div>`, 1);
var root_39 = $.from_html(`<div class="shortcut-row"><span> </span><kbd> </kbd></div>`);
var root_38 = $.from_html(`<!><p class="field-hint" style="margin-top:18px">Address and command shortcuts also work while a provider page has focus. Other shortcuts may be handled by the website.</p>`, 1);
var root_42 = $.from_html(`<p class="dialog-description"> </p><div class="dialog-actions"><button class="secondary">Cancel</button><button class="primary danger"> </button></div>`, 1);
var root = $.from_html(`<div><header class="titlebar"><button class="title-brand" aria-label="Codemax menu" aria-haspopup="menu" title="Codemax menu"><span class="brand-glyph"><!></span><span class="brand-name">CODEMAX</span><!></button> <div class="title-tabs" aria-label="Website tabs" role="tablist"><!> <!> <button class="icon-button new-tab" aria-label="New tab" title="New tab · Ctrl T"><!></button></div> <div class="drag-zone" role="presentation"></div> <div class="window-controls"><button aria-label="Minimize window"><!></button><button><!></button><button aria-label="Close application"><!></button></div></header> <div class="toolbar"><div class="navigation-buttons"><button class="icon-button" aria-label="Back"><!></button><button class="icon-button" aria-label="Forward"><!></button><button class="icon-button" aria-label="Reload website"><!></button></div> <form class="address-form"><!><input aria-label="Address bar" spellcheck="false" autocomplete="off" placeholder="Enter a website address" maxlength="2048"/><kbd>Ctrl L</kbd><!></form> <nav class="chrome-shortcuts" aria-label="Codemax tools"><button aria-label="Providers" title="Detected providers and exposed models"><!><span>Providers</span></button> <button aria-label="Tools &amp; MCP" title="Tools and permissions"><!><span>Tools</span></button> <button aria-label="Connect a client"><span></span><span>Connect</span></button></nav> <span class="divider"></span> <div class="toolbar-tail"><button class="icon-button" title="Connection inspector" aria-label="Toggle connection inspector"><!></button><button class="icon-button" title="Browser controls" aria-label="Browser controls"><!></button></div></div> <!> <div class="workspace"><main class="workspace-content"><!> <!> <!> <!></main></div> <footer class="statusbar"><span></span><button class="mono"> </button><span class="divider"></span><span> </span><span class="divider"></span><button> </button><span class="spacer"></span><span> </span><span class="divider"></span><!><span>Local only</span></footer></div> <!>`, 1);

export default function App($$anchor, $$props) {
	$.push($$props, true);

	let address = $.state('');
	let addressEditing = $.state(false);
	let addressInput;
	let addUrl = $.state('');
	let addLabel = $.state('');
	let query = $.state('');
	let commandIndex = $.state(0);
	let findQuery = $.state('');
	let dragTab = null;
	let darkSystem = $.state(true);
	let maximized = $.state(false);
	const online = $.derived(() => app.ready && app.snapshot?.api.running);

	const commands = $.derived(() => [
		...routes.map((r) => ({
			id: r.id,
			title: r.title,
			description: r.description,
			icon: r.icon,
			action: () => app.navigate(r.id)
		})),

		{
			id: 'new',
			title: 'New website tab',
			description: 'Open another website in an isolated profile',
			icon: 'plus',
			action: () => {
				app.popup = null;
				app.newTab();
			}
		},

		{
			id: 'add',
			title: 'Add a website',
			description: 'Enter any supported AI chat URL',
			icon: 'globe',
			action: () => void app.showPopup('add')
		},

		{
			id: 'inspector',
			title: 'Toggle connection inspector',
			description: 'Show or hide page controls and model details',
			icon: 'scan',
			action: () => {
				app.popup = null;
				app.inspectorVisible = !app.inspectorVisible;
				app.saveLayout();
			}
		},

		{
			id: 'shortcuts',
			title: 'Keyboard shortcuts',
			description: 'Navigate without leaving the keyboard',
			icon: 'command',
			action: () => void app.showPopup('shortcuts')
		},

		...app.providers.map((p) => ({
			id: `provider-${p.id}`,
			title: p.label,
			description: p.origin,
			icon: 'globe',
			action: () => {
				app.popup = null;
				void app.openProvider(p.id);
			}
		}))
	].filter((c) => `${c.title} ${c.description}`.toLowerCase().includes($.get(query).toLowerCase())));

	const target = $.derived(() => app.providers.find((p) => p.id === app.popupProvider));

	$.user_effect(() => {
		if (!$.get(addressEditing)) {
			const p = app.provider;

			$.set(
				address,
				app.route !== 'browser'
					? `codemax://${app.route}`
					: p
						? app.origin && app.origin !== p.origin ? app.origin : p.current_url || p.url
						: '',
				true
			);
		}
	});

	$.user_effect(() => {
		if (app.focusAddress > 0 && addressInput) {
			addressInput.focus();
			addressInput.select();
		}
	});

	$.user_effect(() => {
		if (app.route !== 'browser') void bridge.hideProviders().catch((error) => app.error = String(error));
	});

	$.user_effect(() => {
		void app.selectedProvider;
		void app.route;
		void app.tabs.length;
		void app.tabOrder;
		void tick().then(() => document.querySelector('.title-tabs [role="tab"][aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
	});

	$.user_effect(() => {
		document.documentElement.dataset.theme = app.preferences.theme === 'system'
			? $.get(darkSystem) ? 'dark' : 'light'
			: app.preferences.theme;
	});

	$.user_effect(() => {
		if (app.popup !== 'commands') {
			$.set(query, '');
			$.set(commandIndex, 0);
		} else {
			void $.get(query);
			$.set(commandIndex, 0);
		}
	});

	onMount(() => {
		app.restoreLayout();

		const media = matchMedia('(prefers-color-scheme:dark)');

		$.set(darkSystem, media.matches, true);

		const changed = (e) => {
			$.set(darkSystem, e.matches, true);
		};

		media.addEventListener('change', changed);

		let disposed = false;
		let unsubscribe = () => {};

		void bridge.observe({
			snapshot: (state) => {
				app.snapshot = state;

				if (app.selectedProvider !== null && !state.providers.some((p) => p.id === app.selectedProvider)) app.selectedProvider = null;
			},

			host: (state) => {
				app.host = state;

				if (state.state !== 'READY') {
					app.snapshot = null;
					app.loading = {};
					void bridge.hideProviders().catch(() => {});
				}
			},
			error: (message) => app.error = message,
			notice: (message) => app.notification = message,
			shortcut: (key) => {
				if (key === 'address') app.focusAddress++; else void app.showPopup('commands');
			},

			browser: (id, origin, loading) => {
				app.liveOrigins = { ...app.liveOrigins, [id]: origin };
				app.loading = { ...app.loading, [id]: loading };
			}
		}).then((stop) => {
			if (disposed) stop(); else unsubscribe = stop;
		}).catch((error) => app.error = String(error));

		return () => {
			disposed = true;
			unsubscribe();
			media.removeEventListener('change', changed);
			app.secret = '';
		};
	});

	async function windowAction(action) {
		try {
			const state = await bridge.windowControl(action);

			$.set(maximized, state.maximized, true);
		} catch(error) {
			app.error = String(error);
		}
	}

	function keyboard(event) {
		if (event.defaultPrevented) return;

		const mod = event.ctrlKey || event.metaKey,
			key = event.key.toLowerCase();

		if (app.popup === 'commands' && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
			event.preventDefault();

			if (event.key === 'Enter') $.get(commands)[$.get(commandIndex)]?.action(); else $.set(commandIndex, ($.get(commandIndex) + (event.key === 'ArrowDown' ? 1 : -1) + Math.max($.get(commands).length, 1)) % Math.max($.get(commands).length, 1));

			return;
		}

		if (mod && key === 'k') {
			event.preventDefault();
			void app.showPopup(app.popup === 'commands' ? null : 'commands');
		} else if (mod && key === 'l') {
			event.preventDefault();
			app.focusAddress++;
		} else if (mod && key === 't') {
			event.preventDefault();
			app.newTab();
		} else if (mod && key === 'tab') {
			event.preventDefault();
			cycleTabs(event.shiftKey ? -1 : 1);
		} else if (mod && key === 'w') {
			event.preventDefault();
			closeCurrentTab();
		} else if (mod && key === 'f' && app.route === 'browser' && app.provider) {
			event.preventDefault();
			app.findVisible = !app.findVisible;
		} else if (mod && (/^[1-9]$/).test(key)) {
			event.preventDefault();

			const tab = key === '9' ? app.tabs.at(-1) : app.tabs[Number(key) - 1];

			if (tab) void app.openProvider(tab.id);
		} else if (mod && ['+', '=', '-', '0'].includes(key) && app.route === 'browser') {
			event.preventDefault();
			void app.control(key === '0' ? 'zoom_reset' : key === '-' ? 'zoom_out' : 'zoom_in');
		} else if (event.altKey && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
			event.preventDefault();
			void app.control(event.key === 'ArrowLeft' ? 'back' : 'forward');
		} else if (event.key === 'Escape') {
			app.contextMenu = null;
			app.findVisible = false;
			app.notification = '';
			app.popup = null;
		}
	}

	function closeCurrentTab() {
		if (app.popup) {
			app.popup = null;

			return;
		}

		if (app.route !== 'browser') {
			app.navigate('browser');

			return;
		}

		if (app.provider) {
			void app.closeProvider(app.provider.id);

			return;
		}

		if (app.tabs.length) void app.openProvider(app.tabs[0].id);
	}

	function cycleTabs(direction) {
		const tabs = [...document.querySelectorAll('.title-tabs [role="tab"]')];

		if (!tabs.length) return;

		const current = tabs.findIndex((el) => el.getAttribute('aria-selected') === 'true');
		const target = tabs[(Math.max(0, current) + direction + tabs.length) % tabs.length];

		target.click();

		void tick().then(() => {
			target.focus();
			target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		});
	}

	function tabKey(event, id) {
		if (id !== undefined && (event.key === 'ContextMenu' || event.shiftKey && event.key === 'F10')) {
			event.preventDefault();

			const rect = event.currentTarget.getBoundingClientRect();

			void app.showTabMenu(id, rect.left, rect.bottom + 5);

			return;
		}

		if (event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

		event.preventDefault();

		const tabs = [...document.querySelectorAll('.title-tabs [role="tab"]')];
		const current = tabs.indexOf(event.currentTarget);

		const index = event.key === 'Home'
			? 0
			: event.key === 'End'
				? tabs.length - 1
				: (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;

		const target = tabs[index];

		target.click();

		void tick().then(() => {
			target.focus();
			target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		});
	}

	function tabContext(event, id) {
		event.preventDefault();
		void app.showTabMenu(id, event.clientX, event.clientY);
	}

	function submitAddress(event) {
		event.preventDefault();

		const value = $.get(address).trim();

		$.set(addressEditing, false);
		addressInput.blur();

		if (value.startsWith('codemax://')) {
			const route = value.slice(('codemax://').length).replace(/\/$/, '');

			if (routes.some((r) => r.id === route)) app.navigate(route); else app.error = 'INTERNAL_PAGE_NOT_FOUND';

			return;
		}

		// Enter on the current internal address returns to that page; external
		// navigation always uses the existing validated website path.
		app.navigate('browser');

		void app.go(value);
	}

	function reorder(event, id) {
		event.preventDefault();

		if (dragTab === null || dragTab === id) return;

		const ids = app.tabs.map((p) => p.id).filter((i) => i !== dragTab);

		ids.splice(ids.indexOf(id), 0, dragTab);
		app.tabOrder = ids;
		dragTab = null;
		app.saveLayout();
	}

	async function add(event) {
		event.preventDefault();

		if (await app.addWebsite($.get(addUrl), $.get(addLabel))) {
			$.set(addUrl, '');
			$.set(addLabel, '');
		}
	}

	async function confirm() {
		if (app.popup === 'rotate-key') {
			if (await app.perform('key.regenerate', { confirmed: true }) !== undefined) {
				app.secret = '';
				app.popup = null;
				app.notification = 'New local API key created. Existing clients were disconnected.';
			}
		} else if ($.get(target)) {
			const id = $.get(target).id;

			if (app.popup === 'close-provider') await app.closeProvider(id, true); else {
				const remove = app.popup === 'remove-provider';

				if (await app.perform(remove ? 'provider.remove' : 'provider.clear_profile', { provider_id: id, confirmed: true }) !== undefined) {
					app.popup = null;

					if (app.selectedProvider === id) app.selectedProvider = null;

					app.notification = remove
						? 'Website removed from this workspace.'
						: 'Local website storage cleared. Sign in again when you reopen it.';
				}
			}
		}
	}

	async function find(backwards = false) {
		if (!app.provider) return;

		try {
			await bridge.find(app.provider.id, $.get(findQuery), backwards);
		} catch(error) {
			app.error = String(error);
		}
	}

	var fragment = root();

	$.event('keydown', $.window, keyboard);

	var div = $.first_child(fragment);
	let classes;
	var header = $.child(div);
	var button = $.child(header);

	button.__click = () => app.showPopup(app.popup === 'menu' ? null : 'menu');

	var span = $.child(button);
	var node = $.child(span);

	Icon(node, { name: 'layers', size: 18 });
	$.reset(span);

	var node_1 = $.sibling(span, 2);

	Icon(node_1, { name: 'chevron', size: 12 });
	$.reset(button);

	var div_1 = $.sibling(button, 2);
	var node_2 = $.child(div_1);

	$.each(node_2, 17, () => app.tabs, (tab) => tab.id, ($$anchor, tab) => {
		var div_2 = root_1();
		let classes_1;
		var button_1 = $.child(div_2);

		button_1.__keydown = (event) => tabKey(event, $.get(tab).id);
		button_1.__contextmenu = (event) => tabContext(event, $.get(tab).id);
		button_1.__click = () => app.openProvider($.get(tab).id);

		var span_1 = $.child(button_1);
		var text = $.child(span_1, true);

		$.reset(span_1);

		var span_2 = $.sibling(span_1);
		var text_1 = $.child(span_2, true);

		$.reset(span_2);

		var node_3 = $.sibling(span_2);

		{
			let $0 = $.derived(() => app.loading[$.get(tab).id] === true);

			TabActivity(node_3, {
				get provider() {
					return $.get(tab);
				},

				get loading() {
					return $.get($0);
				},

				get online() {
					return app.ready;
				}
			});
		}

		$.reset(button_1);

		var button_2 = $.sibling(button_1);

		button_2.__click = () => app.closeProvider($.get(tab).id);

		var node_4 = $.child(button_2);

		Icon(node_4, { name: 'close', size: 11 });
		$.reset(button_2);
		$.reset(div_2);

		$.template_effect(
			($0) => {
				classes_1 = $.set_class(div_2, 1, 'browser-tab', null, classes_1, {
					active: app.selectedProvider === $.get(tab).id && app.route === 'browser'
				});

				$.set_attribute(div_2, 'data-provider-id', $.get(tab).id);
				$.set_attribute(button_1, 'aria-label', $.get(tab).label);
				$.set_attribute(button_1, 'aria-selected', app.selectedProvider === $.get(tab).id && app.route === 'browser');
				$.set_attribute(button_1, 'tabindex', app.selectedProvider === $.get(tab).id && app.route === 'browser' ? 0 : -1);
				$.set_attribute(button_1, 'title', `${$.get(tab).label} · ${$.get(tab).origin}`);
				$.set_text(text, $0);
				$.set_text(text_1, $.get(tab).label);
				$.set_attribute(button_2, 'aria-label', `Close ${$.get(tab).label} tab`);
			},
			[() => initials($.get(tab).label).slice(0, 1)]
		);

		$.event('dragstart', div_2, (event) => {
			dragTab = $.get(tab).id;
			event.dataTransfer?.setData('text/plain', String($.get(tab).id));
		});

		$.event('dragover', div_2, (event) => event.preventDefault());
		$.event('drop', div_2, (event) => reorder(event, $.get(tab).id));
		$.event('dragend', div_2, () => dragTab = null);
		$.append($$anchor, div_2);
	});

	var node_5 = $.sibling(node_2, 2);

	{
		var consequent = ($$anchor) => {
			var div_3 = root_2();
			var button_3 = $.child(div_3);

			button_3.__keydown = (event) => tabKey(event);
			button_3.__click = () => app.newTab();

			var span_3 = $.child(button_3);
			var node_6 = $.child(span_3);

			Icon(node_6, { name: 'globe', size: 13 });
			$.reset(span_3);
			$.next();
			$.reset(button_3);
			$.reset(div_3);
			$.append($$anchor, div_3);
		};

		var alternate = ($$anchor) => {
			var fragment_1 = $.comment();
			var node_7 = $.first_child(fragment_1);

			{
				var consequent_1 = ($$anchor) => {
					var div_4 = root_4();
					var button_4 = $.child(div_4);

					button_4.__keydown = (event) => tabKey(event);
					button_4.__click = () => app.navigate(app.route);

					var span_4 = $.child(button_4);
					var node_8 = $.child(span_4);

					{
						let $0 = $.derived(() => routes.find((r) => r.id === app.route)?.icon || 'grid');

						Icon(node_8, {
							get name() {
								return $.get($0);
							},
							size: 13
						});
					}

					$.reset(span_4);

					var span_5 = $.sibling(span_4);
					var text_2 = $.child(span_5, true);

					$.reset(span_5);
					$.reset(button_4);

					var button_5 = $.sibling(button_4);

					button_5.__click = () => app.navigate('browser');

					var node_9 = $.child(button_5);

					Icon(node_9, { name: 'close', size: 11 });
					$.reset(button_5);
					$.reset(div_4);

					$.template_effect(
						($0, $1) => {
							$.set_attribute(button_4, 'title', $0);
							$.set_text(text_2, $1);
						},
						[
							() => `Codemax · ${routes.find((r) => r.id === app.route)?.title}`,
							() => routes.find((r) => r.id === app.route)?.title
						]
					);

					$.append($$anchor, div_4);
				};

				$.if(
					node_7,
					($$render) => {
						if (app.route !== 'browser') $$render(consequent_1);
					},
					true
				);
			}

			$.append($$anchor, fragment_1);
		};

		$.if(node_5, ($$render) => {
			if (app.selectedProvider === null && app.route === 'browser') $$render(consequent); else $$render(alternate, false);
		});
	}

	var button_6 = $.sibling(node_5, 2);

	button_6.__click = () => app.newTab();

	var node_10 = $.child(button_6);

	Icon(node_10, { name: 'plus', size: 15 });
	$.reset(button_6);
	$.reset(div_1);

	var div_5 = $.sibling(div_1, 2);

	div_5.__pointerdown = (event) => {
		if (event.button === 0) void windowAction('drag');
	};

	div_5.__dblclick = () => windowAction('maximize');

	var div_6 = $.sibling(div_5, 2);
	var button_7 = $.child(div_6);

	button_7.__click = () => windowAction('minimize');

	var node_11 = $.child(button_7);

	Icon(node_11, { name: 'minimize', size: 14 });
	$.reset(button_7);

	var button_8 = $.sibling(button_7);

	button_8.__click = () => windowAction('maximize');

	var node_12 = $.child(button_8);

	Icon(node_12, { name: 'maximize', size: 12 });
	$.reset(button_8);

	var button_9 = $.sibling(button_8);

	button_9.__click = () => windowAction('close');

	var node_13 = $.child(button_9);

	Icon(node_13, { name: 'close', size: 15 });
	$.reset(button_9);
	$.reset(div_6);
	$.reset(header);

	var div_7 = $.sibling(header, 2);
	var div_8 = $.child(div_7);
	var button_10 = $.child(div_8);

	button_10.__click = () => app.control('back');

	var node_14 = $.child(button_10);

	Icon(node_14, { name: 'back', size: 16 });
	$.reset(button_10);

	var button_11 = $.sibling(button_10);

	button_11.__click = () => app.control('forward');

	var node_15 = $.child(button_11);

	Icon(node_15, { name: 'arrow', size: 16 });
	$.reset(button_11);

	var button_12 = $.sibling(button_11);

	button_12.__click = () => app.control('reload');

	var node_16 = $.child(button_12);

	Icon(node_16, { name: 'refresh', size: 15 });
	$.reset(button_12);
	$.reset(div_8);

	var form = $.sibling(div_8, 2);
	var node_17 = $.child(form);

	{
		let $0 = $.derived(() => app.route !== 'browser'
			? 'layers'
			: app.provider
				? $.get(address).startsWith('https://') ? 'lock' : 'globe'
				: 'search');

		Icon(node_17, {
			get name() {
				return $.get($0);
			},
			size: 13
		});
	}

	var input = $.sibling(node_17);

	$.remove_input_defaults(input);
	$.bind_this(input, ($$value) => addressInput = $$value, () => addressInput);

	var node_18 = $.sibling(input, 2);

	{
		var consequent_2 = ($$anchor) => {
			var button_13 = root_5();

			button_13.__click = () => app.clipboard($.get(address));

			var node_19 = $.child(button_13);

			Icon(node_19, { name: 'copy', size: 12 });
			$.reset(button_13);
			$.append($$anchor, button_13);
		};

		$.if(node_18, ($$render) => {
			if (app.provider && app.route === 'browser') $$render(consequent_2);
		});
	}

	$.reset(form);

	var nav = $.sibling(form, 2);
	var button_14 = $.child(nav);

	button_14.__click = () => app.navigate('providers');

	let classes_2;
	var node_20 = $.child(button_14);

	Icon(node_20, { name: 'layers', size: 15 });
	$.next();
	$.reset(button_14);

	var button_15 = $.sibling(button_14, 2);

	button_15.__click = () => app.navigate('tools');

	let classes_3;
	var node_21 = $.child(button_15);

	Icon(node_21, { name: 'terminal', size: 15 });
	$.next();
	$.reset(button_15);

	var button_16 = $.sibling(button_15, 2);
	let classes_4;

	button_16.__click = () => app.navigate('harness');

	var span_6 = $.child(button_16);
	let classes_5;

	$.next();
	$.reset(button_16);
	$.reset(nav);

	var div_9 = $.sibling(nav, 4);
	var button_17 = $.child(div_9);

	button_17.__click = () => {
		const visible = app.route === 'browser' && app.inspectorVisible;

		app.navigate('browser');
		app.inspectorVisible = !visible;
		app.saveLayout();
	};

	var node_22 = $.child(button_17);

	Icon(node_22, { name: 'panel', size: 17 });
	$.reset(button_17);

	var button_18 = $.sibling(button_17);

	button_18.__click = () => {
		app.inspectorVisible = true;
		app.inspectorTab = 'browser';
		app.navigate('browser');
		app.saveLayout();
	};

	var node_23 = $.child(button_18);

	Icon(node_23, { name: 'more', size: 18 });
	$.reset(button_18);
	$.reset(div_9);
	$.reset(div_7);

	var node_24 = $.sibling(div_7, 2);

	{
		var consequent_3 = ($$anchor) => {
			var form_1 = root_6();
			var node_25 = $.child(form_1);

			Icon(node_25, { name: 'search', size: 15 });

			var input_1 = $.sibling(node_25);

			$.remove_input_defaults(input_1);

			var button_19 = $.sibling(input_1, 2);

			button_19.__click = () => find(true);

			var node_26 = $.child(button_19);

			Icon(node_26, { name: 'back', size: 13 });
			$.reset(button_19);

			var button_20 = $.sibling(button_19);
			var node_27 = $.child(button_20);

			Icon(node_27, { name: 'arrow', size: 13 });
			$.reset(button_20);

			var button_21 = $.sibling(button_20);

			button_21.__click = () => app.findVisible = false;

			var node_28 = $.child(button_21);

			Icon(node_28, { name: 'close', size: 13 });
			$.reset(button_21);
			$.reset(form_1);

			$.event('submit', form_1, (event) => {
				event.preventDefault();
				void find();
			});

			$.bind_value(input_1, () => $.get(findQuery), ($$value) => $.set(findQuery, $$value));
			$.append($$anchor, form_1);
		};

		$.if(node_24, ($$render) => {
			if (app.findVisible && app.provider && app.route === 'browser') $$render(consequent_3);
		});
	}

	var div_10 = $.sibling(node_24, 2);
	var main = $.child(div_10);
	var node_29 = $.child(main);

	{
		var consequent_4 = ($$anchor) => {
			var div_11 = root_7();
			let classes_6;
			var node_30 = $.child(div_11);

			{
				let $0 = $.derived(() => app.host.state === 'STARTING' ? 'bolt' : 'alert');

				Icon(node_30, {
					get name() {
						return $.get($0);
					},
					size: 15
				});
			}

			var span_7 = $.sibling(node_30);
			var text_3 = $.child(span_7, true);

			$.reset(span_7);

			var button_22 = $.sibling(span_7);

			button_22.__click = () => app.navigate('settings');
			$.reset(div_11);

			$.template_effect(
				($0, $1) => {
					classes_6 = $.set_class(div_11, 1, 'layout-notice', null, classes_6, $0);
					$.set_text(text_3, $1);
				},
				[
					() => ({ error: ['FAILED', 'LOST'].includes(app.host.state) }),
					() => app.host.state === 'STARTING'
						? 'Starting the native Zag gateway…'
						: errorText(app.host.code || 'NATIVE_HOST_REQUIRED')
				]
			);

			$.append($$anchor, div_11);
		};

		$.if(node_29, ($$render) => {
			if (app.host.state !== 'READY') $$render(consequent_4);
		});
	}

	var node_31 = $.sibling(node_29, 2);

	{
		var consequent_5 = ($$anchor) => {
			var div_12 = root_8();
			var node_32 = $.child(div_12);

			Icon(node_32, { name: 'alert', size: 15 });

			var span_8 = $.sibling(node_32);
			var text_4 = $.child(span_8, true);

			$.reset(span_8);

			var button_23 = $.sibling(span_8);

			button_23.__click = () => app.error = '';

			var node_33 = $.child(button_23);

			Icon(node_33, { name: 'close', size: 13 });
			$.reset(button_23);
			$.reset(div_12);
			$.template_effect(($0) => $.set_text(text_4, $0), [() => errorText(app.error)]);
			$.append($$anchor, div_12);
		};

		$.if(node_31, ($$render) => {
			if (app.error) $$render(consequent_5);
		});
	}

	var node_34 = $.sibling(node_31, 2);

	{
		var consequent_6 = ($$anchor) => {
			var div_13 = root_9();
			var node_35 = $.child(div_13);

			Icon(node_35, { name: 'check', size: 15 });

			var span_9 = $.sibling(node_35);
			var text_5 = $.child(span_9, true);

			$.reset(span_9);

			var button_24 = $.sibling(span_9);

			button_24.__click = () => app.notification = '';

			var node_36 = $.child(button_24);

			Icon(node_36, { name: 'close', size: 13 });
			$.reset(button_24);
			$.reset(div_13);
			$.template_effect(() => $.set_text(text_5, app.notification));
			$.append($$anchor, div_13);
		};

		$.if(node_34, ($$render) => {
			if (app.notification) $$render(consequent_6);
		});
	}

	var node_37 = $.sibling(node_34, 2);

	{
		var consequent_7 = ($$anchor) => {
			ProviderBrowser($$anchor, {});
		};

		var alternate_8 = ($$anchor) => {
			var fragment_3 = $.comment();
			var node_38 = $.first_child(fragment_3);

			{
				var consequent_8 = ($$anchor) => {
					Providers($$anchor, {});
				};

				var alternate_7 = ($$anchor) => {
					var fragment_5 = $.comment();
					var node_39 = $.first_child(fragment_5);

					{
						var consequent_9 = ($$anchor) => {
							Tools($$anchor, {});
						};

						var alternate_6 = ($$anchor) => {
							var fragment_7 = $.comment();
							var node_40 = $.first_child(fragment_7);

							{
								var consequent_10 = ($$anchor) => {
									Models($$anchor, {});
								};

								var alternate_5 = ($$anchor) => {
									var fragment_9 = $.comment();
									var node_41 = $.first_child(fragment_9);

									{
										var consequent_11 = ($$anchor) => {
											Sessions($$anchor, {});
										};

										var alternate_4 = ($$anchor) => {
											var fragment_11 = $.comment();
											var node_42 = $.first_child(fragment_11);

											{
												var consequent_12 = ($$anchor) => {
													Harness($$anchor, {});
												};

												var alternate_3 = ($$anchor) => {
													var fragment_13 = $.comment();
													var node_43 = $.first_child(fragment_13);

													{
														var consequent_13 = ($$anchor) => {
															Detector($$anchor, {});
														};

														var alternate_2 = ($$anchor) => {
															var fragment_15 = $.comment();
															var node_44 = $.first_child(fragment_15);

															{
																var consequent_14 = ($$anchor) => {
																	Settings($$anchor, {});
																};

																var alternate_1 = ($$anchor) => {
																	Home($$anchor, {});
																};

																$.if(
																	node_44,
																	($$render) => {
																		if (app.route === 'settings') $$render(consequent_14); else $$render(alternate_1, false);
																	},
																	true
																);
															}

															$.append($$anchor, fragment_15);
														};

														$.if(
															node_43,
															($$render) => {
																if (app.route === 'detector') $$render(consequent_13); else $$render(alternate_2, false);
															},
															true
														);
													}

													$.append($$anchor, fragment_13);
												};

												$.if(
													node_42,
													($$render) => {
														if (app.route === 'harness') $$render(consequent_12); else $$render(alternate_3, false);
													},
													true
												);
											}

											$.append($$anchor, fragment_11);
										};

										$.if(
											node_41,
											($$render) => {
												if (app.route === 'sessions') $$render(consequent_11); else $$render(alternate_4, false);
											},
											true
										);
									}

									$.append($$anchor, fragment_9);
								};

								$.if(
									node_40,
									($$render) => {
										if (app.route === 'models') $$render(consequent_10); else $$render(alternate_5, false);
									},
									true
								);
							}

							$.append($$anchor, fragment_7);
						};

						$.if(
							node_39,
							($$render) => {
								if (app.route === 'tools') $$render(consequent_9); else $$render(alternate_6, false);
							},
							true
						);
					}

					$.append($$anchor, fragment_5);
				};

				$.if(
					node_38,
					($$render) => {
						if (app.route === 'providers') $$render(consequent_8); else $$render(alternate_7, false);
					},
					true
				);
			}

			$.append($$anchor, fragment_3);
		};

		$.if(node_37, ($$render) => {
			if (app.route === 'browser') $$render(consequent_7); else $$render(alternate_8, false);
		});
	}

	$.reset(main);
	$.reset(div_10);

	var footer = $.sibling(div_10, 2);
	var span_10 = $.child(footer);
	let classes_7;
	var button_25 = $.sibling(span_10);

	button_25.__click = () => app.navigate('harness');

	var text_6 = $.child(button_25, true);

	$.reset(button_25);

	var span_11 = $.sibling(button_25, 2);
	var text_7 = $.child(span_11);

	$.reset(span_11);

	var button_26 = $.sibling(span_11, 2);

	button_26.__click = () => app.navigate('sessions');

	var text_8 = $.child(button_26);

	$.reset(button_26);

	var span_12 = $.sibling(button_26, 2);
	var text_9 = $.child(span_12, true);

	$.reset(span_12);

	var node_45 = $.sibling(span_12, 2);

	Icon(node_45, { name: 'shield', size: 11 });
	$.next();
	$.reset(footer);
	$.reset(div);

	var node_46 = $.sibling(div, 2);

	{
		var consequent_15 = ($$anchor) => {
			ChromeMenu($$anchor, {});
		};

		var alternate_12 = ($$anchor) => {
			var fragment_19 = $.comment();
			var node_47 = $.first_child(fragment_19);

			{
				var consequent_16 = ($$anchor) => {
					Dialog($$anchor, {
						title: 'Add a website',
						children: ($$anchor, $$slotProps) => {
							var form_2 = root_29();
							var label_1 = $.sibling($.child(form_2));
							var input_2 = $.sibling($.child(label_1));

							$.remove_input_defaults(input_2);
							$.reset(label_1);

							var label_2 = $.sibling(label_1);
							var input_3 = $.sibling($.child(label_2), 2);

							$.remove_input_defaults(input_3);
							$.reset(label_2);

							var div_14 = $.sibling(label_2);
							var node_48 = $.child(div_14);

							Icon(node_48, { name: 'shield', size: 15 });
							$.next();
							$.reset(div_14);

							var div_15 = $.sibling(div_14);
							var button_27 = $.child(div_15);

							button_27.__click = () => app.popup = null;

							var button_28 = $.sibling(button_27);
							var node_49 = $.sibling($.child(button_28));

							Icon(node_49, { name: 'arrow', size: 14 });
							$.reset(button_28);
							$.reset(div_15);
							$.reset(form_2);
							$.template_effect(($0) => button_28.disabled = $0, [() => !app.ready || !$.get(addUrl).trim() || app.pending > 0]);
							$.event('submit', form_2, add);
							$.bind_value(input_2, () => $.get(addUrl), ($$value) => $.set(addUrl, $$value));
							$.bind_value(input_3, () => $.get(addLabel), ($$value) => $.set(addLabel, $$value));
							$.append($$anchor, form_2);
						},
						$$slots: { default: true }
					});
				};

				var alternate_11 = ($$anchor) => {
					var fragment_21 = $.comment();
					var node_50 = $.first_child(fragment_21);

					{
						var consequent_19 = ($$anchor) => {
							Dialog($$anchor, {
								title: 'Go anywhere',
								children: ($$anchor, $$slotProps) => {
									var fragment_23 = root_32();
									var label_3 = $.first_child(fragment_23);
									var node_51 = $.child(label_3);

									Icon(node_51, { name: 'search', size: 18 });

									var input_4 = $.sibling(node_51);

									$.remove_input_defaults(input_4);
									$.reset(label_3);

									var div_16 = $.sibling(label_3);
									var node_52 = $.child(div_16);

									$.each(node_52, 19, () => $.get(commands), (command) => command.id, ($$anchor, command, index) => {
										var button_29 = root_33();

										button_29.__click = function (...$$args) {
											$.get(command).action?.apply(this, $$args);
										};

										let classes_8;
										var node_53 = $.child(button_29);

										Icon(node_53, {
											get name() {
												return $.get(command).icon;
											},
											size: 17
										});

										var span_13 = $.sibling(node_53);
										var strong = $.child(span_13);
										var text_10 = $.child(strong, true);

										$.reset(strong);

										var small = $.sibling(strong);
										var text_11 = $.child(small, true);

										$.reset(small);
										$.reset(span_13);

										var node_54 = $.sibling(span_13);

										{
											var consequent_17 = ($$anchor) => {
												var kbd = root_34();

												$.append($$anchor, kbd);
											};

											$.if(node_54, ($$render) => {
												if ($.get(index) === $.get(commandIndex)) $$render(consequent_17);
											});
										}

										$.reset(button_29);

										$.template_effect(() => {
											classes_8 = $.set_class(button_29, 1, '', null, classes_8, { selected: $.get(index) === $.get(commandIndex) });
											$.set_text(text_10, $.get(command).title);
											$.set_text(text_11, $.get(command).description);
										});

										$.append($$anchor, button_29);
									});

									var node_55 = $.sibling(node_52);

									{
										var consequent_18 = ($$anchor) => {
											var p_1 = root_35();

											$.append($$anchor, p_1);
										};

										$.if(node_55, ($$render) => {
											if (!$.get(commands).length) $$render(consequent_18);
										});
									}

									$.reset(div_16);
									$.next();
									$.bind_value(input_4, () => $.get(query), ($$value) => $.set(query, $$value));
									$.append($$anchor, fragment_23);
								},
								$$slots: { default: true }
							});
						};

						var alternate_10 = ($$anchor) => {
							var fragment_24 = $.comment();
							var node_56 = $.first_child(fragment_24);

							{
								var consequent_20 = ($$anchor) => {
									Dialog($$anchor, {
										title: 'Keyboard shortcuts',
										children: ($$anchor, $$slotProps) => {
											var fragment_26 = root_38();
											var node_57 = $.first_child(fragment_26);

											$.each(
												node_57,
												16,
												() => [
													['Address bar', 'Ctrl L'],
													['Commands', 'Ctrl K'],
													['New website tab', 'Ctrl T'],
													['Close current tab', 'Ctrl W'],
													['Next / previous tab', 'Ctrl Tab / Ctrl Shift Tab'],
													['Switch website tabs', 'Ctrl 1–9'],
													['Find on website', 'Ctrl F'],
													['Back / forward', 'Alt ← / →'],
													['Zoom in / out', 'Ctrl + / −'],
													['Reset zoom', 'Ctrl 0']
												],
												$.index,
												($$anchor, $$item) => {
													var $$array = $.derived(() => $.to_array($$item, 2));
													let label = () => $.get($$array)[0];
													let key = () => $.get($$array)[1];
													var div_17 = root_39();
													var span_14 = $.child(div_17);
													var text_12 = $.child(span_14, true);

													$.reset(span_14);

													var kbd_1 = $.sibling(span_14);
													var text_13 = $.child(kbd_1, true);

													$.reset(kbd_1);
													$.reset(div_17);

													$.template_effect(() => {
														$.set_text(text_12, label());
														$.set_text(text_13, key());
													});

													$.append($$anchor, div_17);
												}
											);

											$.next();
											$.append($$anchor, fragment_26);
										},
										$$slots: { default: true }
									});
								};

								var alternate_9 = ($$anchor) => {
									var fragment_27 = $.comment();
									var node_58 = $.first_child(fragment_27);

									{
										var consequent_21 = ($$anchor) => {
											{
												let $0 = $.derived(() => app.popup === 'rotate-key'
													? 'Create a new local API key?'
													: app.popup === 'close-provider'
														? 'Stop generation and close this tab?'
														: app.popup === 'remove-provider'
															? `Remove ${$.get(target)?.label || 'this website'}?`
															: `Clear ${$.get(target)?.label || 'this website'}’s profile?`);

												Dialog($$anchor, {
													get title() {
														return $.get($0);
													},

													children: ($$anchor, $$slotProps) => {
														var fragment_29 = root_42();
														var p_2 = $.first_child(fragment_29);
														var text_14 = $.child(p_2, true);

														$.reset(p_2);

														var div_18 = $.sibling(p_2);
														var button_30 = $.child(div_18);

														button_30.__click = () => app.popup = null;

														var button_31 = $.sibling(button_30);

														button_31.__click = confirm;

														var text_15 = $.child(button_31, true);

														$.reset(button_31);
														$.reset(div_18);

														$.template_effect(() => {
															$.set_text(text_14, app.popup === 'rotate-key'
																? 'The current key will stop working and connected requests will be cancelled. Copy the new key into your clients. This does not change your website accounts.'
																: app.popup === 'close-provider'
																	? 'This website is currently generating a response. Closing it cancels that request. Its login profile is preserved.'
																	: app.popup === 'remove-provider'
																		? 'This removes the website, connector, and local browser storage from your workspace. Related sessions will be ended. Your remote account is not deleted.'
																		: 'This deletes this website’s local cookies and storage and closes its tab. You will need to sign in again. Other website profiles are not affected.');

															button_31.disabled = app.pending > 0;

															$.set_text(text_15, app.popup === 'rotate-key'
																? 'Regenerate key'
																: app.popup === 'remove-provider'
																	? 'Remove website'
																	: app.popup === 'close-provider' ? 'Stop and close' : 'Clear local profile');
														});

														$.append($$anchor, fragment_29);
													},
													$$slots: { default: true }
												});
											}
										};

										$.if(
											node_58,
											($$render) => {
												if (app.popup) $$render(consequent_21);
											},
											true
										);
									}

									$.append($$anchor, fragment_27);
								};

								$.if(
									node_56,
									($$render) => {
										if (app.popup === 'shortcuts') $$render(consequent_20); else $$render(alternate_9, false);
									},
									true
								);
							}

							$.append($$anchor, fragment_24);
						};

						$.if(
							node_50,
							($$render) => {
								if (app.popup === 'commands') $$render(consequent_19); else $$render(alternate_10, false);
							},
							true
						);
					}

					$.append($$anchor, fragment_21);
				};

				$.if(
					node_47,
					($$render) => {
						if (app.popup === 'add') $$render(consequent_16); else $$render(alternate_11, false);
					},
					true
				);
			}

			$.append($$anchor, fragment_19);
		};

		$.if(node_46, ($$render) => {
			if (app.popup === 'menu' || app.popup === 'tab-actions') $$render(consequent_15); else $$render(alternate_12, false);
		});
	}

	$.template_effect(
		($0) => {
			classes = $.set_class(div, 1, 'app-shell', null, classes, { compact: app.preferences.compact });
			$.set_style(div, `--inspector:${app.inspectorWidth}px`);
			$.set_attribute(button, 'aria-expanded', app.popup === 'menu');
			$.set_attribute(button_8, 'aria-label', $.get(maximized) ? 'Restore window' : 'Maximize window');
			button_10.disabled = !app.provider || app.route !== 'browser';
			button_11.disabled = !app.provider || app.route !== 'browser';
			button_12.disabled = !app.provider || app.route !== 'browser';
			$.set_attribute(button_14, 'aria-current', app.route === 'providers' ? 'page' : undefined);
			classes_2 = $.set_class(button_14, 1, '', null, classes_2, { active: app.route === 'providers' });
			$.set_attribute(button_15, 'aria-current', app.route === 'tools' ? 'page' : undefined);
			classes_3 = $.set_class(button_15, 1, '', null, classes_3, { active: app.route === 'tools' });
			classes_4 = $.set_class(button_16, 1, 'connect-shortcut', null, classes_4, { active: app.route === 'harness' });
			$.set_attribute(button_16, 'aria-current', app.route === 'harness' ? 'page' : undefined);

			$.set_attribute(button_16, 'title', $.get(online)
				? 'Local gateway ready · Connect a coding client'
				: 'Connect a coding client · Gateway offline');

			classes_5 = $.set_class(span_6, 1, 'dot', null, classes_5, { online: $.get(online) });
			$.set_attribute(button_17, 'aria-pressed', app.route === 'browser' && app.inspectorVisible);
			classes_7 = $.set_class(span_10, 1, 'dot', null, classes_7, { online: $.get(online) });

			$.set_text(text_6, app.snapshot
				? `127.0.0.1:${app.snapshot.api.port}`
				: 'Gateway offline');

			$.set_text(text_7, `${app.models.length ?? ''} models`);
			$.set_text(text_8, `${$0 ?? ''} active sessions`);

			$.set_text(text_9, app.pending
				? 'Applying changes…'
				: app.provider?.active ? 'Forwarding stream' : 'Symbolic discovery');
		},
		[
			() => app.sessions.filter((s) => s.status === 'ACTIVE').length
		]
	);

	$.event('submit', form, submitAddress);
	$.event('focus', input, () => $.set(addressEditing, true));
	$.event('blur', input, () => $.set(addressEditing, false));
	$.bind_value(input, () => $.get(address), ($$value) => $.set(address, $$value));
	$.append($$anchor, fragment);
	$.pop();
}

$.delegate(['click', 'keydown', 'contextmenu', 'pointerdown', 'dblclick']);