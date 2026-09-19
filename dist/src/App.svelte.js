import '../runtime/svelte_internal_disclose-version.js';
import * as $ from '../runtime/svelte_internal_client.js';
import { onMount } from '../runtime/svelte_svelte.js';
import * as bridge from './lib/api/bridge.js';
import { app } from './lib/state/app.svelte.js';
import { routes } from './lib/types/bridge.js';
import { initials, errorText } from './lib/format.js';
import TabActivity from './lib/components/TabActivity.svelte.js';
import Icon from './lib/components/Icon.svelte.js';
import Dialog from './lib/components/Dialog.svelte.js';
import Sidebar from './lib/components/chrome/Sidebar.svelte.js';
import Home from './screens/Home.svelte.js';
import ProviderBrowser from './screens/ProviderBrowser.svelte.js';
import Models from './screens/Models.svelte.js';
import Harness from './screens/Harness.svelte.js';
import Sessions from './screens/Sessions.svelte.js';
import Detector from './screens/Detector.svelte.js';
import Settings from './screens/Settings.svelte.js';

var root_1 = $.from_html(`<span class="brand-name">BRIDGE</span><span class="spacer"></span><span class="label" style="font-size:8px;letter-spacing:1px">WORKSPACE</span>`, 1);
var root_2 = $.from_html(`<div draggable="true" role="presentation"><button class="tab-open" role="tab"><span class="tab-initial"> </span><span class="truncate"> </span><!></button><button class="tab-close"><!></button></div>`);
var root_3 = $.from_html(`<div class="browser-tab active"><span class="tab-initial"><!></span><span>New tab</span></div>`);
var root_5 = $.from_html(`<div class="browser-tab active"><span class="tab-initial"><!></span><span class="truncate"> </span><button class="tab-close" style="margin-left:auto" aria-label="Return to browser"><!></button></div>`);
var root_6 = $.from_html(`<button class="icon-button" style="width:23px;height:23px;min-width:23px;min-height:23px" type="button" aria-label="Copy website URL"><!></button>`);
var root_7 = $.from_html(`<form class="findbar"><!><input aria-label="Find on page" placeholder="Find on this page" maxlength="256"/><small>Enter to find next</small><button type="button" class="icon-button" aria-label="Previous match"><!></button><button class="icon-button" aria-label="Next match"><!></button><button type="button" class="icon-button" aria-label="Close find"><!></button></form>`);
var root_8 = $.from_html(`<div class="resize-handle" role="slider" tabindex="0" aria-label="Sidebar width" aria-orientation="vertical" aria-valuemin="180" aria-valuemax="320"></div>`);
var root_9 = $.from_html(`<div style="width:1px;background:var(--line)"></div>`);
var root_10 = $.from_html(`<div><!><span> </span><button class="text-button">Runtime settings</button></div>`);
var root_11 = $.from_html(`<div class="layout-notice error" role="alert"><!><span> </span><button class="icon-button" aria-label="Dismiss error"><!></button></div>`);
var root_12 = $.from_html(`<div class="layout-notice" role="status"><!><span> </span><button class="icon-button" aria-label="Dismiss notification"><!></button></div>`);
var root_26 = $.from_html(`<form><p class="dialog-description">Open the public chat page, then sign in on the website. Its browser profile is kept separate from your other providers.</p><label class="field">Website address<input required maxlength="2048" placeholder="https://chat.example.com" autocomplete="url" spellcheck="false"/></label><label class="field">Name in your workspace <span class="faint">Optional</span><input maxlength="120" placeholder="Use the website’s name" autocomplete="off"/></label><div class="dialog-notice"><!><span>Use an HTTPS chat URL, not a sign-in callback or a link containing credentials. Website quotas still apply.</span></div><div class="dialog-actions"><button type="button" class="secondary">Cancel</button><button class="primary">Open website<!></button></div></form>`);
var root_31 = $.from_html(`<kbd>↵</kbd>`);
var root_30 = $.from_html(`<button><!><span><strong> </strong><small> </small></span><!></button>`);
var root_32 = $.from_html(`<p class="muted" style="padding:20px 5px">No matching commands.</p>`);
var root_29 = $.from_html(`<label class="command-search"><!><input aria-label="Search commands" placeholder="Search pages, websites, and actions…" autocomplete="off"/></label><div class="command-results"><!><!></div><div class="command-footer">↑ ↓ to navigate <span style="margin-left:15px">Enter to open</span><span style="float:right">Esc to close</span></div>`, 1);
var root_36 = $.from_html(`<div class="shortcut-row"><span> </span><kbd> </kbd></div>`);
var root_35 = $.from_html(`<!><p class="field-hint" style="margin-top:18px">Address and command shortcuts also work while a provider page has focus. Other shortcuts may be handled by the website.</p>`, 1);
var root_39 = $.from_html(`<p class="dialog-description"> </p><div class="dialog-actions"><button class="secondary">Cancel</button><button class="primary danger"> </button></div>`, 1);
var root = $.from_html(`<div><header class="titlebar"><div class="title-brand" role="presentation"><span class="brand-glyph"><!></span><!></div> <div class="title-tabs" aria-label="Website tabs" role="tablist"><!> <!> <button class="icon-button new-tab" aria-label="New tab" title="New tab · Ctrl T"><!></button></div> <div class="drag-zone" role="presentation"></div> <div class="window-controls"><button aria-label="Minimize window"><!></button><button><!></button><button aria-label="Close application"><!></button></div></header> <div class="toolbar"><div class="navigation-buttons"><button class="icon-button" title="Toggle sidebar" aria-label="Toggle sidebar"><!></button><span class="divider"></span><button class="icon-button" aria-label="Back"><!></button><button class="icon-button" aria-label="Forward"><!></button><button class="icon-button" aria-label="Reload website"><!></button></div> <form class="address-form"><!><input aria-label="Address bar" spellcheck="false" autocomplete="off" placeholder="Enter a website address" maxlength="2048"/><kbd>Ctrl L</kbd><!></form> <button title="Local gateway and client setup"><span></span><span>Local API</span><span class="api-detail mono"> </span></button><div class="toolbar-tail"><button class="icon-button" title="Connection inspector" aria-label="Toggle connection inspector"><!></button><button class="icon-button" title="Browser controls" aria-label="Browser controls"><!></button></div></div> <!> <div class="workspace"><!><!> <main class="workspace-content"><!> <!> <!> <!></main></div> <footer class="statusbar"><span></span><button class="mono"> </button><span class="divider"></span><span> </span><span class="divider"></span><button> </button><span class="spacer"></span><span> </span><span class="divider"></span><!><span>Local only</span></footer></div> <!>`, 1);

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
				p
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
		} else if (mod && key === 'w') {
			event.preventDefault();

			if (app.provider) void app.closeProvider(app.provider.id);
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

	function resizeSidebar(event) {
		const el = event.currentTarget;

		el.setPointerCapture(event.pointerId);

		const start = event.clientX,
			width = app.sidebarWidth;

		const move = (e) => {
			app.sidebarWidth = Math.max(180, Math.min(320, width + e.clientX - start));
		};

		const end = () => {
			el.removeEventListener('pointermove', move);
			el.removeEventListener('pointerup', end);
			el.removeEventListener('pointercancel', end);
			app.saveLayout();
		};

		el.addEventListener('pointermove', move);
		el.addEventListener('pointerup', end, { once: true });
		el.addEventListener('pointercancel', end, { once: true });
	}

	function sidebarKey(e) {
		if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
			e.preventDefault();
			app.sidebarWidth = Math.max(180, Math.min(320, app.sidebarWidth + (e.key === 'ArrowRight' ? 16 : -16)));
			app.saveLayout();
		}
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

	$.event('click', $.window, (event) => {
		if (!event.target.closest('.context-menu')) app.contextMenu = null;
	});

	var div = $.first_child(fragment);
	let classes;
	var header = $.child(div);
	var div_1 = $.child(header);

	div_1.__pointerdown = (event) => {
		if (event.button === 0 && !event.target.closest('button')) void windowAction('drag');
	};

	var span = $.child(div_1);
	var node = $.child(span);

	Icon(node, { name: 'layers', size: 22 });
	$.reset(span);

	var node_1 = $.sibling(span);

	{
		var consequent = ($$anchor) => {
			var fragment_1 = root_1();

			$.next(2);
			$.append($$anchor, fragment_1);
		};

		$.if(node_1, ($$render) => {
			if (app.sidebarVisible) $$render(consequent);
		});
	}

	$.reset(div_1);

	var div_2 = $.sibling(div_1, 2);
	var node_2 = $.child(div_2);

	$.each(node_2, 17, () => app.tabs, (tab) => tab.id, ($$anchor, tab) => {
		var div_3 = root_2();
		let classes_1;
		var button = $.child(div_3);

		button.__click = () => app.openProvider($.get(tab).id);

		var span_1 = $.child(button);
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

		$.reset(button);

		var button_1 = $.sibling(button);

		button_1.__click = () => app.closeProvider($.get(tab).id);

		var node_4 = $.child(button_1);

		Icon(node_4, { name: 'close', size: 11 });
		$.reset(button_1);
		$.reset(div_3);

		$.template_effect(
			($0) => {
				classes_1 = $.set_class(div_3, 1, 'browser-tab', null, classes_1, {
					active: app.selectedProvider === $.get(tab).id && app.route === 'browser'
				});

				$.set_attribute(button, 'aria-selected', app.selectedProvider === $.get(tab).id && app.route === 'browser');
				$.set_attribute(button, 'title', $.get(tab).origin);
				$.set_text(text, $0);
				$.set_text(text_1, $.get(tab).label);
				$.set_attribute(button_1, 'aria-label', `Close ${$.get(tab).label} tab`);
			},
			[() => initials($.get(tab).label).slice(0, 1)]
		);

		$.event('dragstart', div_3, (event) => {
			dragTab = $.get(tab).id;
			event.dataTransfer?.setData('text/plain', String($.get(tab).id));
		});

		$.event('dragover', div_3, (event) => event.preventDefault());
		$.event('drop', div_3, (event) => reorder(event, $.get(tab).id));
		$.append($$anchor, div_3);
	});

	var node_5 = $.sibling(node_2, 2);

	{
		var consequent_1 = ($$anchor) => {
			var div_4 = root_3();
			var span_3 = $.child(div_4);
			var node_6 = $.child(span_3);

			Icon(node_6, { name: 'globe', size: 13 });
			$.reset(span_3);
			$.next();
			$.reset(div_4);
			$.append($$anchor, div_4);
		};

		var alternate = ($$anchor) => {
			var fragment_2 = $.comment();
			var node_7 = $.first_child(fragment_2);

			{
				var consequent_2 = ($$anchor) => {
					var div_5 = root_5();
					var span_4 = $.child(div_5);
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

					var button_2 = $.sibling(span_5);

					button_2.__click = () => app.navigate('browser');

					var node_9 = $.child(button_2);

					Icon(node_9, { name: 'close', size: 11 });
					$.reset(button_2);
					$.reset(div_5);
					$.template_effect(($0) => $.set_text(text_2, $0), [() => routes.find((r) => r.id === app.route)?.title]);
					$.append($$anchor, div_5);
				};

				$.if(
					node_7,
					($$render) => {
						if (app.route !== 'browser') $$render(consequent_2);
					},
					true
				);
			}

			$.append($$anchor, fragment_2);
		};

		$.if(node_5, ($$render) => {
			if (app.selectedProvider === null && app.route === 'browser') $$render(consequent_1); else $$render(alternate, false);
		});
	}

	var button_3 = $.sibling(node_5, 2);

	button_3.__click = () => app.newTab();

	var node_10 = $.child(button_3);

	Icon(node_10, { name: 'plus', size: 15 });
	$.reset(button_3);
	$.reset(div_2);

	var div_6 = $.sibling(div_2, 2);

	div_6.__pointerdown = (event) => {
		if (event.button === 0) void windowAction('drag');
	};

	div_6.__dblclick = () => windowAction('maximize');

	var div_7 = $.sibling(div_6, 2);
	var button_4 = $.child(div_7);

	button_4.__click = () => windowAction('minimize');

	var node_11 = $.child(button_4);

	Icon(node_11, { name: 'minimize', size: 14 });
	$.reset(button_4);

	var button_5 = $.sibling(button_4);

	button_5.__click = () => windowAction('maximize');

	var node_12 = $.child(button_5);

	Icon(node_12, { name: 'maximize', size: 12 });
	$.reset(button_5);

	var button_6 = $.sibling(button_5);

	button_6.__click = () => windowAction('close');

	var node_13 = $.child(button_6);

	Icon(node_13, { name: 'close', size: 15 });
	$.reset(button_6);
	$.reset(div_7);
	$.reset(header);

	var div_8 = $.sibling(header, 2);
	var div_9 = $.child(div_8);
	var button_7 = $.child(div_9);

	button_7.__click = () => {
		app.sidebarVisible = !app.sidebarVisible;
		app.saveLayout();
	};

	var node_14 = $.child(button_7);

	Icon(node_14, { name: 'panel', size: 16 });
	$.reset(button_7);

	var button_8 = $.sibling(button_7, 2);

	button_8.__click = () => app.control('back');

	var node_15 = $.child(button_8);

	Icon(node_15, { name: 'back', size: 16 });
	$.reset(button_8);

	var button_9 = $.sibling(button_8);

	button_9.__click = () => app.control('forward');

	var node_16 = $.child(button_9);

	Icon(node_16, { name: 'arrow', size: 16 });
	$.reset(button_9);

	var button_10 = $.sibling(button_9);

	button_10.__click = () => app.control('reload');

	var node_17 = $.child(button_10);

	Icon(node_17, { name: 'refresh', size: 15 });
	$.reset(button_10);
	$.reset(div_9);

	var form = $.sibling(div_9, 2);
	var node_18 = $.child(form);

	{
		let $0 = $.derived(() => app.provider ? 'lock' : 'search');

		Icon(node_18, {
			get name() {
				return $.get($0);
			},
			size: 13
		});
	}

	var input = $.sibling(node_18);

	$.remove_input_defaults(input);
	$.bind_this(input, ($$value) => addressInput = $$value, () => addressInput);

	var node_19 = $.sibling(input, 2);

	{
		var consequent_3 = ($$anchor) => {
			var button_11 = root_6();

			button_11.__click = () => app.clipboard($.get(address));

			var node_20 = $.child(button_11);

			Icon(node_20, { name: 'copy', size: 12 });
			$.reset(button_11);
			$.append($$anchor, button_11);
		};

		$.if(node_19, ($$render) => {
			if (app.provider) $$render(consequent_3);
		});
	}

	$.reset(form);

	var button_12 = $.sibling(form, 2);
	let classes_2;

	button_12.__click = () => app.navigate('harness');

	var span_6 = $.child(button_12);
	let classes_3;
	var span_7 = $.sibling(span_6, 2);
	var text_3 = $.child(span_7, true);

	$.reset(span_7);
	$.reset(button_12);

	var div_10 = $.sibling(button_12);
	var button_13 = $.child(div_10);

	button_13.__click = () => {
		app.inspectorVisible = !app.inspectorVisible;
		app.saveLayout();
	};

	var node_21 = $.child(button_13);

	Icon(node_21, { name: 'scan', size: 17 });
	$.reset(button_13);

	var button_14 = $.sibling(button_13);

	button_14.__click = () => {
		app.inspectorVisible = true;
		app.inspectorTab = app.inspectorTab === 'browser' ? 'connection' : 'browser';
		app.navigate('browser');
	};

	var node_22 = $.child(button_14);

	Icon(node_22, { name: 'more', size: 18 });
	$.reset(button_14);
	$.reset(div_10);
	$.reset(div_8);

	var node_23 = $.sibling(div_8, 2);

	{
		var consequent_4 = ($$anchor) => {
			var form_1 = root_7();
			var node_24 = $.child(form_1);

			Icon(node_24, { name: 'search', size: 15 });

			var input_1 = $.sibling(node_24);

			$.remove_input_defaults(input_1);

			var button_15 = $.sibling(input_1, 2);

			button_15.__click = () => find(true);

			var node_25 = $.child(button_15);

			Icon(node_25, { name: 'back', size: 13 });
			$.reset(button_15);

			var button_16 = $.sibling(button_15);
			var node_26 = $.child(button_16);

			Icon(node_26, { name: 'arrow', size: 13 });
			$.reset(button_16);

			var button_17 = $.sibling(button_16);

			button_17.__click = () => app.findVisible = false;

			var node_27 = $.child(button_17);

			Icon(node_27, { name: 'close', size: 13 });
			$.reset(button_17);
			$.reset(form_1);

			$.event('submit', form_1, (event) => {
				event.preventDefault();
				void find();
			});

			$.bind_value(input_1, () => $.get(findQuery), ($$value) => $.set(findQuery, $$value));
			$.append($$anchor, form_1);
		};

		$.if(node_23, ($$render) => {
			if (app.findVisible && app.provider && app.route === 'browser') $$render(consequent_4);
		});
	}

	var div_11 = $.sibling(node_23, 2);
	var node_28 = $.child(div_11);

	Sidebar(node_28, {});

	var node_29 = $.sibling(node_28);

	{
		var consequent_5 = ($$anchor) => {
			var div_12 = root_8();

			div_12.__pointerdown = resizeSidebar;
			div_12.__keydown = sidebarKey;
			$.template_effect(() => $.set_attribute(div_12, 'aria-valuenow', app.sidebarWidth));
			$.append($$anchor, div_12);
		};

		var alternate_1 = ($$anchor) => {
			var div_13 = root_9();

			$.append($$anchor, div_13);
		};

		$.if(node_29, ($$render) => {
			if (app.sidebarVisible) $$render(consequent_5); else $$render(alternate_1, false);
		});
	}

	var main = $.sibling(node_29, 2);
	var node_30 = $.child(main);

	{
		var consequent_6 = ($$anchor) => {
			var div_14 = root_10();
			let classes_4;
			var node_31 = $.child(div_14);

			{
				let $0 = $.derived(() => app.host.state === 'STARTING' ? 'bolt' : 'alert');

				Icon(node_31, {
					get name() {
						return $.get($0);
					},
					size: 15
				});
			}

			var span_8 = $.sibling(node_31);
			var text_4 = $.child(span_8, true);

			$.reset(span_8);

			var button_18 = $.sibling(span_8);

			button_18.__click = () => app.navigate('settings');
			$.reset(div_14);

			$.template_effect(
				($0, $1) => {
					classes_4 = $.set_class(div_14, 1, 'layout-notice', null, classes_4, $0);
					$.set_text(text_4, $1);
				},
				[
					() => ({ error: ['FAILED', 'LOST'].includes(app.host.state) }),
					() => app.host.state === 'STARTING'
						? 'Starting the native Zag gateway…'
						: errorText(app.host.code || 'NATIVE_HOST_REQUIRED')
				]
			);

			$.append($$anchor, div_14);
		};

		$.if(node_30, ($$render) => {
			if (app.host.state !== 'READY') $$render(consequent_6);
		});
	}

	var node_32 = $.sibling(node_30, 2);

	{
		var consequent_7 = ($$anchor) => {
			var div_15 = root_11();
			var node_33 = $.child(div_15);

			Icon(node_33, { name: 'alert', size: 15 });

			var span_9 = $.sibling(node_33);
			var text_5 = $.child(span_9, true);

			$.reset(span_9);

			var button_19 = $.sibling(span_9);

			button_19.__click = () => app.error = '';

			var node_34 = $.child(button_19);

			Icon(node_34, { name: 'close', size: 13 });
			$.reset(button_19);
			$.reset(div_15);
			$.template_effect(($0) => $.set_text(text_5, $0), [() => errorText(app.error)]);
			$.append($$anchor, div_15);
		};

		$.if(node_32, ($$render) => {
			if (app.error) $$render(consequent_7);
		});
	}

	var node_35 = $.sibling(node_32, 2);

	{
		var consequent_8 = ($$anchor) => {
			var div_16 = root_12();
			var node_36 = $.child(div_16);

			Icon(node_36, { name: 'check', size: 15 });

			var span_10 = $.sibling(node_36);
			var text_6 = $.child(span_10, true);

			$.reset(span_10);

			var button_20 = $.sibling(span_10);

			button_20.__click = () => app.notification = '';

			var node_37 = $.child(button_20);

			Icon(node_37, { name: 'close', size: 13 });
			$.reset(button_20);
			$.reset(div_16);
			$.template_effect(() => $.set_text(text_6, app.notification));
			$.append($$anchor, div_16);
		};

		$.if(node_35, ($$render) => {
			if (app.notification) $$render(consequent_8);
		});
	}

	var node_38 = $.sibling(node_35, 2);

	{
		var consequent_9 = ($$anchor) => {
			ProviderBrowser($$anchor, {});
		};

		var alternate_7 = ($$anchor) => {
			var fragment_4 = $.comment();
			var node_39 = $.first_child(fragment_4);

			{
				var consequent_10 = ($$anchor) => {
					Models($$anchor, {});
				};

				var alternate_6 = ($$anchor) => {
					var fragment_6 = $.comment();
					var node_40 = $.first_child(fragment_6);

					{
						var consequent_11 = ($$anchor) => {
							Sessions($$anchor, {});
						};

						var alternate_5 = ($$anchor) => {
							var fragment_8 = $.comment();
							var node_41 = $.first_child(fragment_8);

							{
								var consequent_12 = ($$anchor) => {
									Harness($$anchor, {});
								};

								var alternate_4 = ($$anchor) => {
									var fragment_10 = $.comment();
									var node_42 = $.first_child(fragment_10);

									{
										var consequent_13 = ($$anchor) => {
											Detector($$anchor, {});
										};

										var alternate_3 = ($$anchor) => {
											var fragment_12 = $.comment();
											var node_43 = $.first_child(fragment_12);

											{
												var consequent_14 = ($$anchor) => {
													Settings($$anchor, {});
												};

												var alternate_2 = ($$anchor) => {
													Home($$anchor, {});
												};

												$.if(
													node_43,
													($$render) => {
														if (app.route === 'settings') $$render(consequent_14); else $$render(alternate_2, false);
													},
													true
												);
											}

											$.append($$anchor, fragment_12);
										};

										$.if(
											node_42,
											($$render) => {
												if (app.route === 'detector') $$render(consequent_13); else $$render(alternate_3, false);
											},
											true
										);
									}

									$.append($$anchor, fragment_10);
								};

								$.if(
									node_41,
									($$render) => {
										if (app.route === 'harness') $$render(consequent_12); else $$render(alternate_4, false);
									},
									true
								);
							}

							$.append($$anchor, fragment_8);
						};

						$.if(
							node_40,
							($$render) => {
								if (app.route === 'sessions') $$render(consequent_11); else $$render(alternate_5, false);
							},
							true
						);
					}

					$.append($$anchor, fragment_6);
				};

				$.if(
					node_39,
					($$render) => {
						if (app.route === 'models') $$render(consequent_10); else $$render(alternate_6, false);
					},
					true
				);
			}

			$.append($$anchor, fragment_4);
		};

		$.if(node_38, ($$render) => {
			if (app.route === 'browser') $$render(consequent_9); else $$render(alternate_7, false);
		});
	}

	$.reset(main);
	$.reset(div_11);

	var footer = $.sibling(div_11, 2);
	var span_11 = $.child(footer);
	let classes_5;
	var button_21 = $.sibling(span_11);

	button_21.__click = () => app.navigate('harness');

	var text_7 = $.child(button_21, true);

	$.reset(button_21);

	var span_12 = $.sibling(button_21, 2);
	var text_8 = $.child(span_12);

	$.reset(span_12);

	var button_22 = $.sibling(span_12, 2);

	button_22.__click = () => app.navigate('sessions');

	var text_9 = $.child(button_22);

	$.reset(button_22);

	var span_13 = $.sibling(button_22, 2);
	var text_10 = $.child(span_13, true);

	$.reset(span_13);

	var node_44 = $.sibling(span_13, 2);

	Icon(node_44, { name: 'shield', size: 11 });
	$.next();
	$.reset(footer);
	$.reset(div);

	var node_45 = $.sibling(div, 2);

	{
		var consequent_15 = ($$anchor) => {
			Dialog($$anchor, {
				title: 'Add a website',
				children: ($$anchor, $$slotProps) => {
					var form_2 = root_26();
					var label_1 = $.sibling($.child(form_2));
					var input_2 = $.sibling($.child(label_1));

					$.remove_input_defaults(input_2);
					$.reset(label_1);

					var label_2 = $.sibling(label_1);
					var input_3 = $.sibling($.child(label_2), 2);

					$.remove_input_defaults(input_3);
					$.reset(label_2);

					var div_17 = $.sibling(label_2);
					var node_46 = $.child(div_17);

					Icon(node_46, { name: 'shield', size: 15 });
					$.next();
					$.reset(div_17);

					var div_18 = $.sibling(div_17);
					var button_23 = $.child(div_18);

					button_23.__click = () => app.popup = null;

					var button_24 = $.sibling(button_23);
					var node_47 = $.sibling($.child(button_24));

					Icon(node_47, { name: 'arrow', size: 14 });
					$.reset(button_24);
					$.reset(div_18);
					$.reset(form_2);
					$.template_effect(($0) => button_24.disabled = $0, [() => !app.ready || !$.get(addUrl).trim() || app.pending > 0]);
					$.event('submit', form_2, add);
					$.bind_value(input_2, () => $.get(addUrl), ($$value) => $.set(addUrl, $$value));
					$.bind_value(input_3, () => $.get(addLabel), ($$value) => $.set(addLabel, $$value));
					$.append($$anchor, form_2);
				},
				$$slots: { default: true }
			});
		};

		var alternate_10 = ($$anchor) => {
			var fragment_16 = $.comment();
			var node_48 = $.first_child(fragment_16);

			{
				var consequent_18 = ($$anchor) => {
					Dialog($$anchor, {
						title: 'Go anywhere',
						children: ($$anchor, $$slotProps) => {
							var fragment_18 = root_29();
							var label_3 = $.first_child(fragment_18);
							var node_49 = $.child(label_3);

							Icon(node_49, { name: 'search', size: 18 });

							var input_4 = $.sibling(node_49);

							$.remove_input_defaults(input_4);
							$.reset(label_3);

							var div_19 = $.sibling(label_3);
							var node_50 = $.child(div_19);

							$.each(node_50, 19, () => $.get(commands), (command) => command.id, ($$anchor, command, index) => {
								var button_25 = root_30();

								button_25.__click = function (...$$args) {
									$.get(command).action?.apply(this, $$args);
								};

								let classes_6;
								var node_51 = $.child(button_25);

								Icon(node_51, {
									get name() {
										return $.get(command).icon;
									},
									size: 17
								});

								var span_14 = $.sibling(node_51);
								var strong = $.child(span_14);
								var text_11 = $.child(strong, true);

								$.reset(strong);

								var small = $.sibling(strong);
								var text_12 = $.child(small, true);

								$.reset(small);
								$.reset(span_14);

								var node_52 = $.sibling(span_14);

								{
									var consequent_16 = ($$anchor) => {
										var kbd = root_31();

										$.append($$anchor, kbd);
									};

									$.if(node_52, ($$render) => {
										if ($.get(index) === $.get(commandIndex)) $$render(consequent_16);
									});
								}

								$.reset(button_25);

								$.template_effect(() => {
									classes_6 = $.set_class(button_25, 1, '', null, classes_6, { selected: $.get(index) === $.get(commandIndex) });
									$.set_text(text_11, $.get(command).title);
									$.set_text(text_12, $.get(command).description);
								});

								$.append($$anchor, button_25);
							});

							var node_53 = $.sibling(node_50);

							{
								var consequent_17 = ($$anchor) => {
									var p_1 = root_32();

									$.append($$anchor, p_1);
								};

								$.if(node_53, ($$render) => {
									if (!$.get(commands).length) $$render(consequent_17);
								});
							}

							$.reset(div_19);
							$.next();
							$.bind_value(input_4, () => $.get(query), ($$value) => $.set(query, $$value));
							$.append($$anchor, fragment_18);
						},
						$$slots: { default: true }
					});
				};

				var alternate_9 = ($$anchor) => {
					var fragment_19 = $.comment();
					var node_54 = $.first_child(fragment_19);

					{
						var consequent_19 = ($$anchor) => {
							Dialog($$anchor, {
								title: 'Keyboard shortcuts',
								children: ($$anchor, $$slotProps) => {
									var fragment_21 = root_35();
									var node_55 = $.first_child(fragment_21);

									$.each(
										node_55,
										16,
										() => [
											['Address bar', 'Ctrl L'],
											['Commands', 'Ctrl K'],
											['New website tab', 'Ctrl T'],
											['Close website tab', 'Ctrl W'],
											['Switch tabs', 'Ctrl 1–9'],
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
											var div_20 = root_36();
											var span_15 = $.child(div_20);
											var text_13 = $.child(span_15, true);

											$.reset(span_15);

											var kbd_1 = $.sibling(span_15);
											var text_14 = $.child(kbd_1, true);

											$.reset(kbd_1);
											$.reset(div_20);

											$.template_effect(() => {
												$.set_text(text_13, label());
												$.set_text(text_14, key());
											});

											$.append($$anchor, div_20);
										}
									);

									$.next();
									$.append($$anchor, fragment_21);
								},
								$$slots: { default: true }
							});
						};

						var alternate_8 = ($$anchor) => {
							var fragment_22 = $.comment();
							var node_56 = $.first_child(fragment_22);

							{
								var consequent_20 = ($$anchor) => {
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
												var fragment_24 = root_39();
												var p_2 = $.first_child(fragment_24);
												var text_15 = $.child(p_2, true);

												$.reset(p_2);

												var div_21 = $.sibling(p_2);
												var button_26 = $.child(div_21);

												button_26.__click = () => app.popup = null;

												var button_27 = $.sibling(button_26);

												button_27.__click = confirm;

												var text_16 = $.child(button_27, true);

												$.reset(button_27);
												$.reset(div_21);

												$.template_effect(() => {
													$.set_text(text_15, app.popup === 'rotate-key'
														? 'The current key will stop working and connected requests will be cancelled. Copy the new key into your clients. This does not change your website accounts.'
														: app.popup === 'close-provider'
															? 'This website is currently generating a response. Closing it cancels that request. Its login profile is preserved.'
															: app.popup === 'remove-provider'
																? 'This removes the website, connector, and local browser storage from your workspace. Related sessions will be ended. Your remote account is not deleted.'
																: 'This deletes this website’s local cookies and storage and closes its tab. You will need to sign in again. Other website profiles are not affected.');

													button_27.disabled = app.pending > 0;

													$.set_text(text_16, app.popup === 'rotate-key'
														? 'Regenerate key'
														: app.popup === 'remove-provider'
															? 'Remove website'
															: app.popup === 'close-provider' ? 'Stop and close' : 'Clear local profile');
												});

												$.append($$anchor, fragment_24);
											},
											$$slots: { default: true }
										});
									}
								};

								$.if(
									node_56,
									($$render) => {
										if (app.popup) $$render(consequent_20);
									},
									true
								);
							}

							$.append($$anchor, fragment_22);
						};

						$.if(
							node_54,
							($$render) => {
								if (app.popup === 'shortcuts') $$render(consequent_19); else $$render(alternate_8, false);
							},
							true
						);
					}

					$.append($$anchor, fragment_19);
				};

				$.if(
					node_48,
					($$render) => {
						if (app.popup === 'commands') $$render(consequent_18); else $$render(alternate_9, false);
					},
					true
				);
			}

			$.append($$anchor, fragment_16);
		};

		$.if(node_45, ($$render) => {
			if (app.popup === 'add') $$render(consequent_15); else $$render(alternate_10, false);
		});
	}

	$.template_effect(
		($0) => {
			classes = $.set_class(div, 1, 'app-shell', null, classes, { compact: app.preferences.compact });
			$.set_style(div, `--sidebar:${app.sidebarVisible ? app.sidebarWidth : 54}px;--inspector:${app.inspectorWidth}px`);
			$.set_attribute(button_5, 'aria-label', $.get(maximized) ? 'Restore window' : 'Maximize window');
			$.set_attribute(button_7, 'aria-pressed', app.sidebarVisible);
			button_8.disabled = !app.provider || app.route !== 'browser';
			button_9.disabled = !app.provider || app.route !== 'browser';
			button_10.disabled = !app.provider || app.route !== 'browser';
			classes_2 = $.set_class(button_12, 1, 'api-pill', null, classes_2, { online: $.get(online) });
			classes_3 = $.set_class(span_6, 1, 'dot', null, classes_3, { online: $.get(online) });
			$.set_text(text_3, app.snapshot?.api.port ?? 7331);
			$.set_attribute(button_13, 'aria-pressed', app.inspectorVisible);
			classes_5 = $.set_class(span_11, 1, 'dot', null, classes_5, { online: $.get(online) });

			$.set_text(text_7, app.snapshot
				? `127.0.0.1:${app.snapshot.api.port}`
				: 'Gateway offline');

			$.set_text(text_8, `${app.models.length ?? ''} models`);
			$.set_text(text_9, `${$0 ?? ''} active sessions`);

			$.set_text(text_10, app.pending
				? 'Applying changes…'
				: app.provider?.active ? 'Forwarding stream' : 'Symbolic discovery');
		},
		[
			() => app.sessions.filter((s) => s.status === 'ACTIVE').length
		]
	);

	$.event('submit', form, (event) => {
		event.preventDefault();
		$.set(addressEditing, false);
		addressInput.blur();
		app.navigate('browser');
		void app.go($.get(address));
	});

	$.event('focus', input, () => $.set(addressEditing, true));
	$.event('blur', input, () => $.set(addressEditing, false));
	$.bind_value(input, () => $.get(address), ($$value) => $.set(address, $$value));
	$.append($$anchor, fragment);
	$.pop();
}

$.delegate(['pointerdown', 'click', 'dblclick', 'keydown']);