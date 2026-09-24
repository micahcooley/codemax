import '../runtime/svelte_internal_disclose-version.js';
import * as $ from '../runtime/svelte_internal_client.js';
import { onMount, tick } from '../runtime/svelte_svelte.js';
import * as bridge from './lib/api/bridge.js';
import { app } from './lib/state/app.svelte.js';
import { routes } from './lib/types/bridge.js';
import { errorText, recoveryAction } from './lib/format.js';
import TabActivity from './lib/components/TabActivity.svelte.js';
import Favicon from './lib/components/Favicon.svelte.js';
import Icon from './lib/components/Icon.svelte.js';
import Dialog from './lib/components/Dialog.svelte.js';
import ChromeMenu from './lib/components/chrome/ChromeMenu.svelte.js';
import ProviderShelf from './lib/components/providers/ProviderShelf.svelte.js';
import Providers from './screens/Providers.svelte.js';
import Tools from './screens/Tools.svelte.js';
import Home from './screens/Home.svelte.js';
import ProviderBrowser from './screens/ProviderBrowser.svelte.js';
import Models from './screens/Models.svelte.js';
import Harness from './screens/Harness.svelte.js';
import Sessions from './screens/Sessions.svelte.js';
import Detector from './screens/Detector.svelte.js';
import Settings from './screens/Settings.svelte.js';

var root = $.from_html(`<div draggable="true" role="presentation"><button class="tab-open" role="tab"><span class="tab-initial"><!></span><span class="truncate"> </span><!></button><button class="tab-close"><!></button></div>`);
var root_1 = $.from_html(`<button class="tab-close" aria-label="Close new tab" title="Back to your website tabs"><!></button>`);
var root_2 = $.from_html(`<div class="browser-tab active"><button class="tab-open" role="tab" aria-selected="true"><span class="tab-initial"><!></span><span>New tab</span></button><!></div>`);
var root_3 = $.from_html(`<div class="browser-tab active utility-tab"><button class="tab-open" role="tab" aria-selected="true"><span class="tab-initial"><!></span><span class="truncate"> </span></button><button class="tab-close" aria-label="Return to browser"><!></button></div>`);
var root_4 = $.from_html(`<button class="icon-button" style="width:23px;height:23px;min-width:23px;min-height:23px" type="button" aria-label="Copy website URL"><!></button>`);
var root_5 = $.from_html(`<span class="attention-count" aria-label="Task needs attention">1</span>`);
var root_6 = $.from_html(`<span class="mini-working" role="img" aria-label="Task running"></span>`);
var root_7 = $.from_html(`<form class="findbar"><!><input aria-label="Find on page" placeholder="Find on this page" maxlength="256"/><small>Enter to find next</small><button type="button" class="icon-button" aria-label="Previous match"><!></button><button class="icon-button" aria-label="Next match"><!></button><button type="button" class="icon-button" aria-label="Close find"><!></button></form>`);
var root_8 = $.from_html(`<div><!><span> </span><button class="text-button">Runtime settings</button></div>`);
var root_9 = $.from_html(`<div class="layout-notice"><!><span> </span><button class="text-button">Runtime settings</button><button class="icon-button" aria-label="Dismiss notice"><!></button></div>`);
var root_10 = $.from_html(`<button class="text-button">Allow one popup</button>`);
var root_11 = $.from_html(`<button class="text-button"> </button>`);
var root_12 = $.from_html(`<div class="layout-notice error" role="alert"><!><span> </span><!><button class="icon-button" aria-label="Dismiss error"><!></button></div>`);
var root_13 = $.from_html(`<div class="stale-notice" role="status">Last known state · reconnect to save changes or run requests.</div>`);
var root_14 = $.from_html(`<div role="status"><!><span> </span><button class="secondary"> </button></div>`);
var root_15 = $.from_html(`<div class="empty-state"><!><h2> </h2><p>No provider or session data has been received. This is not an empty account.</p><button class="secondary">Runtime settings</button></div>`);
var root_16 = $.from_html(`<!><span> </span><button aria-label="Dismiss notification"><!></button>`, 1);
var root_17 = $.from_html(`<span>Applying changes…</span>`);
var root_18 = $.from_html(`<p class="dialog-error" role="alert"> </p>`);
var root_19 = $.from_html(`<p class="dialog-description"> </p><!><div class="dialog-actions"><button data-initial-focus="" class="secondary">Cancel</button><button> </button></div>`, 1);
var root_20 = $.from_html(`<form><p class="dialog-description">Open the public chat page, then sign in on the website. Its browser profile is kept separate from your other providers.</p><label class="field">Website address<input required="" maxlength="2048" placeholder="https://chat.example.com" autocomplete="url" spellcheck="false"/></label><label class="field">Name in your workspace <span class="faint">Optional</span><input maxlength="120" placeholder="Use the website’s name" autocomplete="off"/></label><div class="dialog-notice"><!><span>Use an HTTPS chat URL, not a sign-in callback or a link containing credentials. Website quotas still apply.</span></div><div class="dialog-actions"><button type="button" class="secondary">Cancel</button><button class="primary">Open website<!></button></div></form>`);
var root_21 = $.from_html(`<kbd>↵</kbd>`);
var root_22 = $.from_html(`<button><!><span><strong> </strong><small> </small></span><!></button>`);
var root_23 = $.from_html(`<p class="muted" style="padding:20px 5px">No matching commands.</p>`);
var root_24 = $.from_html(`<label class="command-search"><!><input aria-label="Search commands" placeholder="Search pages, websites, and actions…" autocomplete="off"/></label><div class="command-results"><!><!></div><div class="command-footer">↑ ↓ to navigate <span style="margin-left:15px">Enter to open</span><span style="float:right">Esc to close</span></div>`, 1);
var root_25 = $.from_html(`<div class="shortcut-row"><span> </span><kbd> </kbd></div>`);
var root_26 = $.from_html(`<!><p class="field-hint" style="margin-top:18px">Tab shortcuts also work while a provider page has focus. Other shortcuts may be handled by the website.</p>`, 1);
var root_27 = $.from_html(`<!><p class="dialog-description"> </p><div class="dialog-actions"><button data-initial-focus="" class="secondary">Cancel</button><button class="primary danger"> </button></div>`, 1);
var root_28 = $.from_html(`<div><header class="titlebar"><button class="title-brand" aria-label="Codemax menu" aria-haspopup="menu" title="Codemax menu"><span class="brand-glyph"><!></span><span class="brand-name">CODEMAX</span><!></button> <div class="title-tabs" aria-label="Website tabs" role="tablist"><!> <!> <button class="icon-button new-tab" aria-label="New tab" title="New tab · Ctrl T"><!></button></div> <div class="drag-zone" role="presentation"></div> <div class="window-controls"><button aria-label="Minimize window"><!></button><button><!></button><button aria-label="Close application"><!></button></div></header> <div class="toolbar"><button class="icon-button shelf-toggle" aria-label="Toggle provider sidebar" aria-controls="registered-providers" title="Registered providers · Ctrl Shift B"><!></button><div class="navigation-buttons"><button class="icon-button" aria-label="Back"><!></button><button class="icon-button" aria-label="Forward"><!></button><button class="icon-button" aria-label="Reload website"><!></button></div> <form class="address-form"><!><input aria-label="Address bar" spellcheck="false" autocomplete="off" placeholder="Enter a website address" maxlength="2048"/><kbd>Ctrl L</kbd><!></form> <nav class="chrome-shortcuts" aria-label="Codemax tools"><button aria-label="Tools &amp; MCP" title="Tools and permissions"><!><span>Tools</span><!></button> <button aria-label="Connect a client"><span></span><span>Connect</span></button></nav> <span class="divider"></span> <div class="toolbar-tail"><button class="icon-button" title="Browser controls" aria-label="Browser controls"><!></button></div></div> <!> <div><!> <main class="workspace-content"><!> <!> <!> <!> <!></main></div> <footer class="statusbar"><span></span><button title="Manage the local client connection"> </button><span class="divider"></span><button title="Models currently exposed and available"> </button><span class="divider"></span><button> </button><div class="footer-feedback" role="status" aria-live="polite"><!></div></footer></div> <!>`, 1);

export default function App($$anchor, $$props) {
	$.push($$props, true);

	let address = $.state('');
	let addressEditing = $.state(false);
	let addressInput;
	let findInput = $.state(void 0);
	let addUrl = $.state('');
	let addLabel = $.state('');
	let query = $.state('');
	let commandIndex = $.state(0);
	let findQuery = $.state('');
	let dragTab = null;
	let darkSystem = $.state(true);
	let maximized = $.state(false);
	const online = $.derived(() => app.ready && app.snapshot?.api.running);
	let fallbackBannerHidden = $.state($.proxy(typeof localStorage !== 'undefined' && localStorage.getItem('codemax.hideFallbackBanner') === '1'));

	function dismissFallbackBanner() {
		$.set(fallbackBannerHidden, true /* Private browsing: session-only dismissal. */);

		try {
			localStorage.setItem('codemax.hideFallbackBanner', '1');
		} catch {
			/* Private browsing: session-only dismissal. */
		}
	}

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
			id: 'shelf',
			title: 'Toggle provider sidebar',
			description: 'Show registered websites, not a second tab strip',
			icon: 'panel',
			action: () => {
				app.popup = null;
				app.toggleShelf();
			}
		},

		{
			id: 'inspector',
			title: 'Toggle connection inspector',
			description: 'Show or hide page controls and model details',
			icon: 'scan',
			action: () => {
				app.navigate('browser');
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
		const route = app.route;

		if (route !== 'browser') {
			void bridge.hideProviders().catch((error) => app.error = String(error));

			void tick().then(() => {
				const heading = document.querySelector('.screen h1');

				if (heading) {
					heading.tabIndex = -1;
					heading.focus({ preventScroll: true });
				}
			});
		}
	});

	$.user_effect(() => {
		void app.focusFind;

		if (app.findVisible) void tick().then(() => {
			$.get(findInput)?.focus();
			$.get(findInput)?.select();
		});
	});

	$.user_effect(() => {
		const text = app.notification;

		if (!text) return;

		const timer = setTimeout(
			() => {
				if (app.notification === text) app.notification = '';
			},
			5000
		);

		return () => clearTimeout(timer);
	});

	$.user_effect(() => {
		void $.get(commandIndex);

		if (app.popup === 'commands') void tick().then(() => document.querySelector('.command-results .selected')?.scrollIntoView({ block: 'nearest' }));
	});

	const errorRecovery = $.derived(() => recoveryAction(app.error));

	function recover() {
		if ($.get(errorRecovery) === 'runtime' || $.get(errorRecovery) === 'gateway') app.settingsPage($.get(errorRecovery)); else if ($.get(errorRecovery) === 'popup' || $.get(errorRecovery) === 'download') {
			app.navigate('browser');
			app.inspectorVisible = true;
			app.inspectorTab = 'browser';
		} else if ($.get(errorRecovery) === 'mapping') app.navigate('detector');
	}

	async function closeApplication() {
		if (app.sessions.some((s) => s.status === 'ACTIVE') || app.activeTask || app.providers.some((p) => p.active || p.browser_busy)) {
			await app.ask('Close Codemax and stop active work?', 'Running requests and tool tasks will be interrupted. Your website profiles are kept.', 'Stop work and close', async () => {
				await bridge.windowControl('close');

				return true;
			});
		} else await windowAction('close');
	}

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
					app.secret = '';
					app.loading = {};
					void bridge.hideProviders().catch(() => {});
				}
			},

			error: (message, providerId) => {
				app.error = message;
				app.errorProvider = providerId ?? null;
			},
			notice: (message) => app.notification = message,
			shortcut: (key) => {
				if (key === 'address') {
					app.focusAddress++;

					return;
				}

				if (key === 'commands') {
					void app.showPopup('commands');

					return;
				}

				if (key === 'close-tab') {
					closeCurrentTab();

					return;
				}

				if (key === 'reopen-tab') {
					void app.reopenLastClosed();

					return;
				}

				if (key === 'new-tab') {
					app.newTab();

					return;
				}

				if (key === 'next-tab') {
					cycleTabs(1);

					return;
				}

				if (key === 'prev-tab') {
					cycleTabs(-1);

					return;
				}

				if (key.startsWith('tab-')) {
					const n = Number(key.slice(4));
					const tab = n === 9 ? app.tabs.at(-1) : app.tabs[n - 1];

					if (tab) void app.openProvider(tab.id);
				}
			},

			browser: (id, origin, loading) => {
				app.liveOrigins = { ...app.liveOrigins, [id]: origin };
				app.markLoading(id, loading);
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

		if (app.popup) {
			if (event.key === 'Escape' && !app.confirming) {
				event.preventDefault();
				app.popup = null;
				app.contextMenu = null;
			}

			return;
		}

		if (event.key === 'Escape' && document.activeElement === addressInput) {
			event.preventDefault();
			$.set(addressEditing, false);
			$.set(address, app.route === 'browser' ? app.pageUrl : `codemax://${app.route}`, true);
			addressInput.blur();
			document.querySelector('.title-tabs [aria-selected="true"]')?.focus();

			return;
		}

		if (mod && key === 'k') {
			event.preventDefault();
			void app.showPopup(app.popup === 'commands' ? null : 'commands');
		} else if (mod && event.shiftKey && key === 'b') {
			event.preventDefault();
			app.toggleShelf();
		} else if (mod && key === 'l') {
			event.preventDefault();
			app.focusAddress++;
		} else if (mod && key === 't' && !event.shiftKey) {
			event.preventDefault();
			app.newTab();
		} else if (mod && key === 't') {
			event.preventDefault();
			void app.reopenLastClosed();
		} else if (mod && key === 'tab') {
			event.preventDefault();
			cycleTabs(event.shiftKey ? -1 : 1);
		} else if (mod && key === 'w' && !event.shiftKey) {
			event.preventDefault();
			closeCurrentTab();
		} else if (mod && key === 'w') {
			event.preventDefault();
			void closeApplication();
		} else if (mod && key === 'f' && app.route === 'browser' && app.provider) {
			event.preventDefault();
			app.showFind();
		} else if (mod && (/^[1-9]$/).test(key)) {
			event.preventDefault();

			const tab = key === '9' ? app.tabs.at(-1) : app.tabs[Number(key) - 1];

			if (tab) void app.openProvider(tab.id);
		} else if (mod && ['+', '=', '-', '0'].includes(key) && app.route === 'browser') {
			event.preventDefault();
			void app.control(key === '0' ? 'zoom_reset' : key === '-' ? 'zoom_out' : 'zoom_in');
		} else if (event.altKey && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
			event.preventDefault();
			void (event.key === 'ArrowLeft' ? app.back() : app.forward());
		} else if (event.key === 'Escape' && app.findVisible) {
			app.findVisible = false;
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

	// A blocked sign-in/sign-up popup grants exactly one window for the site
	// that was denied, right where the denial appears. Same one-shot,
	// 60-second permission as the Inspector button; nothing blanket.
	async function grantPopup() {
		const id = app.errorProvider ?? app.selectedProvider;

		if (id === null || id === undefined) {
			app.navigate('browser');
			app.inspectorVisible = true;
			app.inspectorTab = 'browser';

			return;
		}

		try {
			await bridge.browserControl(id, 'popup_once');
			app.error = '';
			app.errorProvider = null;
			app.notification = 'One sign-in or sign-up popup allowed for 60 seconds. Try the website button again.';
		} catch(error) {
			app.error = String(error);
			app.errorProvider = id;
		}
	}

	var fragment = root_28();

	$.event('keydown', $.window, keyboard);

	var div = $.first_child(fragment);
	let classes;
	var header = $.child(div);
	var button = $.child(header);
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
		var div_2 = root();
		let classes_1;
		var button_1 = $.child(div_2);
		var span_1 = $.child(button_1);
		var node_3 = $.child(span_1);

		Favicon(node_3, {
			get origin() {
				return $.get(tab).origin;
			},

			get label() {
				return $.get(tab).label;
			},
			size: 16
		});

		$.reset(span_1);

		var span_2 = $.sibling(span_1);
		var text_1 = $.only_child(span_2, true);
		var node_4 = $.sibling(span_2);

		{
			let $0 = $.derived(() => app.loading[$.get(tab).id] === true);

			TabActivity(node_4, {
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
		var node_5 = $.child(button_2);

		Icon(node_5, { name: 'close', size: 11 });
		$.reset(button_2);
		$.reset(div_2);

		$.template_effect(() => {
			classes_1 = $.set_class(div_2, 1, 'browser-tab', null, classes_1, {
				active: app.selectedProvider === $.get(tab).id && app.route === 'browser'
			});

			$.set_attribute(div_2, 'data-provider-id', $.get(tab).id);
			$.set_attribute(button_1, 'aria-label', $.get(tab).label);
			$.set_attribute(button_1, 'aria-selected', app.selectedProvider === $.get(tab).id && app.route === 'browser');
			$.set_attribute(button_1, 'tabindex', app.selectedProvider === $.get(tab).id && app.route === 'browser' ? 0 : -1);
			$.set_attribute(button_1, 'title', `${$.get(tab).label} · ${$.get(tab).origin}`);
			$.set_text(text_1, $.get(tab).label);
			$.set_attribute(button_2, 'aria-label', `Close ${$.get(tab).label} tab`);
		});

		$.event('dragstart', div_2, (event) => {
			dragTab = $.get(tab).id;
			event.dataTransfer?.setData('text/plain', String($.get(tab).id));
		});

		$.event('dragover', div_2, (event) => event.preventDefault());
		$.event('drop', div_2, (event) => reorder(event, $.get(tab).id));
		$.event('dragend', div_2, () => dragTab = null);
		$.delegated('keydown', button_1, (event) => tabKey(event, $.get(tab).id));
		$.delegated('contextmenu', button_1, (event) => tabContext(event, $.get(tab).id));
		$.delegated('click', button_1, () => app.openProvider($.get(tab).id));
		$.delegated('click', button_2, () => app.closeProvider($.get(tab).id));
		$.append($$anchor, div_2);
	});

	var node_6 = $.sibling(node_2, 2);

	{
		var consequent_1 = ($$anchor) => {
			var div_3 = root_2();
			var button_3 = $.child(div_3);
			var span_3 = $.child(button_3);
			var node_7 = $.child(span_3);

			Icon(node_7, { name: 'globe', size: 13 });
			$.reset(span_3);
			$.next();
			$.reset(button_3);

			var node_8 = $.sibling(button_3);

			{
				var consequent = ($$anchor) => {
					var button_4 = root_1();
					var node_9 = $.child(button_4);

					Icon(node_9, { name: 'close', size: 11 });
					$.reset(button_4);
					$.delegated('click', button_4, () => app.openProvider(app.tabs[0].id));
					$.append($$anchor, button_4);
				};

				$.if(node_8, ($$render) => {
					if (app.tabs.length) $$render(consequent);
				});
			}

			$.reset(div_3);
			$.delegated('keydown', button_3, (event) => tabKey(event));
			$.delegated('click', button_3, () => app.newTab());
			$.append($$anchor, div_3);
		};

		var consequent_2 = ($$anchor) => {
			var div_4 = root_3();
			var button_5 = $.child(div_4);
			var span_4 = $.child(button_5);
			var node_10 = $.child(span_4);

			{
				let $0 = $.derived(() => routes.find((r) => r.id === app.route)?.icon || 'grid');

				Icon(node_10, {
					get name() {
						return $.get($0);
					},
					size: 13
				});
			}

			$.reset(span_4);

			var span_5 = $.sibling(span_4);
			var text_2 = $.only_child(span_5, true);

			$.reset(button_5);

			var button_6 = $.sibling(button_5);
			var node_11 = $.child(button_6);

			Icon(node_11, { name: 'close', size: 11 });
			$.reset(button_6);
			$.reset(div_4);

			$.template_effect(
				($0, $1) => {
					$.set_attribute(button_5, 'title', $0);
					$.set_text(text_2, $1);
				},
				[
					() => `Codemax · ${routes.find((r) => r.id === app.route)?.title}`,
					() => routes.find((r) => r.id === app.route)?.title
				]
			);

			$.delegated('keydown', button_5, (event) => tabKey(event));
			$.delegated('click', button_5, () => app.navigate(app.route));
			$.delegated('click', button_6, () => app.navigate('browser'));
			$.append($$anchor, div_4);
		};

		$.if(node_6, ($$render) => {
			if (app.selectedProvider === null && app.route === 'browser') $$render(consequent_1); else if (app.route !== 'browser') $$render(consequent_2, 1);
		});
	}

	var button_7 = $.sibling(node_6, 2);
	var node_12 = $.child(button_7);

	Icon(node_12, { name: 'plus', size: 15 });
	$.reset(button_7);
	$.reset(div_1);

	var div_5 = $.sibling(div_1, 2);
	var div_6 = $.sibling(div_5, 2);
	var button_8 = $.child(div_6);
	var node_13 = $.child(button_8);

	Icon(node_13, { name: 'minimize', size: 14 });
	$.reset(button_8);

	var button_9 = $.sibling(button_8);
	var node_14 = $.child(button_9);

	Icon(node_14, { name: 'maximize', size: 12 });
	$.reset(button_9);

	var button_10 = $.sibling(button_9);
	var node_15 = $.child(button_10);

	Icon(node_15, { name: 'close', size: 15 });
	$.reset(button_10);
	$.reset(div_6);
	$.reset(header);

	var div_7 = $.sibling(header, 2);
	var button_11 = $.child(div_7);
	var node_16 = $.child(button_11);

	Icon(node_16, { name: 'panel', size: 17 });
	$.reset(button_11);

	var div_8 = $.sibling(button_11);
	var button_12 = $.child(div_8);
	var node_17 = $.child(button_12);

	Icon(node_17, { name: 'back', size: 16 });
	$.reset(button_12);

	var button_13 = $.sibling(button_12);
	var node_18 = $.child(button_13);

	Icon(node_18, { name: 'arrow', size: 16 });
	$.reset(button_13);

	var button_14 = $.sibling(button_13);
	var node_19 = $.child(button_14);

	Icon(node_19, { name: 'refresh', size: 15 });
	$.reset(button_14);
	$.reset(div_8);

	var form = $.sibling(div_8, 2);
	var node_20 = $.child(form);

	{
		let $0 = $.derived(() => app.route !== 'browser'
			? 'layers'
			: app.provider
				? $.get(address).startsWith('https://') ? 'lock' : 'globe'
				: 'search');

		Icon(node_20, {
			get name() {
				return $.get($0);
			},
			size: 13
		});
	}

	var input = $.sibling(node_20);

	$.remove_input_defaults(input);
	$.bind_this(input, ($$value) => addressInput = $$value, () => addressInput);

	var node_21 = $.sibling(input, 2);

	{
		var consequent_3 = ($$anchor) => {
			var button_15 = root_4();
			var node_22 = $.child(button_15);

			Icon(node_22, { name: 'copy', size: 12 });
			$.reset(button_15);
			$.delegated('click', button_15, () => app.clipboard(app.pageUrl));
			$.append($$anchor, button_15);
		};

		$.if(node_21, ($$render) => {
			if (app.provider && app.route === 'browser') $$render(consequent_3);
		});
	}

	$.reset(form);

	var nav = $.sibling(form, 2);
	var button_16 = $.child(nav);
	let classes_2;
	var node_23 = $.child(button_16);

	Icon(node_23, { name: 'terminal', size: 15 });

	var node_24 = $.sibling(node_23, 2);

	{
		var consequent_4 = ($$anchor) => {
			var span_6 = root_5();

			$.append($$anchor, span_6);
		};

		var d = $.derived(() => app.activeTask && ['PERMISSION_REQUIRED', 'PAUSED', 'RESULT_READY'].includes(app.activeTask.state));

		var consequent_5 = ($$anchor) => {
			var span_7 = root_6();

			$.append($$anchor, span_7);
		};

		$.if(node_24, ($$render) => {
			if ($.get(d)) $$render(consequent_4); else if (app.activeTask) $$render(consequent_5, 1);
		});
	}

	$.reset(button_16);

	var button_17 = $.sibling(button_16, 2);
	let classes_3;
	var span_8 = $.child(button_17);
	let classes_4;

	$.next();
	$.reset(button_17);
	$.reset(nav);

	var div_9 = $.sibling(nav, 4);
	var button_18 = $.child(div_9);
	var node_25 = $.child(button_18);

	Icon(node_25, { name: 'more', size: 18 });
	$.reset(button_18);
	$.reset(div_9);
	$.reset(div_7);

	var node_26 = $.sibling(div_7, 2);

	{
		var consequent_6 = ($$anchor) => {
			var form_1 = root_7();
			var node_27 = $.child(form_1);

			Icon(node_27, { name: 'search', size: 15 });

			var input_1 = $.sibling(node_27);

			$.remove_input_defaults(input_1);
			$.bind_this(input_1, ($$value) => $.set(findInput, $$value), () => $.get(findInput));

			var button_19 = $.sibling(input_1, 2);
			var node_28 = $.child(button_19);

			Icon(node_28, { name: 'back', size: 13 });
			$.reset(button_19);

			var button_20 = $.sibling(button_19);
			var node_29 = $.child(button_20);

			Icon(node_29, { name: 'arrow', size: 13 });
			$.reset(button_20);

			var button_21 = $.sibling(button_20);
			var node_30 = $.child(button_21);

			Icon(node_30, { name: 'close', size: 13 });
			$.reset(button_21);
			$.reset(form_1);

			$.event('submit', form_1, (event) => {
				event.preventDefault();
				void find();
			});

			$.delegated('keydown', input_1, (event) => {
				if (event.key === 'Enter' && event.shiftKey) {
					event.preventDefault();
					void find(true);
				}
			});

			$.bind_value(input_1, () => $.get(findQuery), ($$value) => $.set(findQuery, $$value));
			$.delegated('click', button_19, () => find(true));
			$.delegated('click', button_21, () => app.findVisible = false);
			$.append($$anchor, form_1);
		};

		$.if(node_26, ($$render) => {
			if (app.findVisible && app.provider && app.route === 'browser') $$render(consequent_6);
		});
	}

	var div_10 = $.sibling(node_26, 2);
	let classes_5;
	var node_31 = $.child(div_10);

	{
		var consequent_7 = ($$anchor) => {
			ProviderShelf($$anchor, {});
		};

		$.if(node_31, ($$render) => {
			if (app.shelfVisible) $$render(consequent_7);
		});
	}

	var main = $.sibling(node_31, 2);
	var node_32 = $.child(main);

	{
		var consequent_8 = ($$anchor) => {
			var div_11 = root_8();
			let classes_6;
			var node_33 = $.child(div_11);

			{
				let $0 = $.derived(() => app.host.state === 'STARTING' ? 'bolt' : 'alert');

				Icon(node_33, {
					get name() {
						return $.get($0);
					},
					size: 15
				});
			}

			var span_9 = $.sibling(node_33);
			var text_3 = $.only_child(span_9, true);
			var button_22 = $.sibling(span_9);

			$.reset(div_11);

			$.template_effect(
				($0, $1) => {
					classes_6 = $.set_class(div_11, 1, 'layout-notice', null, classes_6, { error: $0 });
					$.set_text(text_3, $1);
				},
				[
					() => ['FAILED', 'LOST'].includes(app.host.state),
					() => app.host.state === 'STARTING'
						? 'Starting Codemax… Your website profiles are being restored.'
						: errorText(app.host.code || 'NATIVE_HOST_REQUIRED')
				]
			);

			$.delegated('click', button_22, () => app.settingsPage('runtime'));
			$.append($$anchor, div_11);
		};

		var consequent_9 = ($$anchor) => {
			var div_12 = root_9();
			var node_34 = $.child(div_12);

			Icon(node_34, { name: 'globe', size: 15 });

			var span_10 = $.sibling(node_34);
			var text_4 = $.only_child(span_10, true);
			var button_23 = $.sibling(span_10);
			var button_24 = $.sibling(button_23);
			var node_35 = $.child(button_24);

			Icon(node_35, { name: 'close', size: 13 });
			$.reset(button_24);
			$.reset(div_12);
			$.template_effect(($0) => $.set_text(text_4, $0), [() => errorText('FALLBACK_MODE')]);
			$.delegated('click', button_23, () => app.settingsPage('runtime'));
			$.delegated('click', button_24, dismissFallbackBanner);
			$.append($$anchor, div_12);
		};

		$.if(node_32, ($$render) => {
			if (app.host.state !== 'READY') $$render(consequent_8); else if (app.host.code === 'FALLBACK_MODE' && !$.get(fallbackBannerHidden)) $$render(consequent_9, 1);
		});
	}

	var node_36 = $.sibling(node_32, 2);

	{
		var consequent_12 = ($$anchor) => {
			var div_13 = root_12();
			var node_37 = $.child(div_13);

			Icon(node_37, { name: 'alert', size: 15 });

			var span_11 = $.sibling(node_37);
			var text_5 = $.only_child(span_11, true);
			var node_38 = $.sibling(span_11);

			{
				var consequent_10 = ($$anchor) => {
					var button_25 = root_10();

					$.delegated('click', button_25, grantPopup);
					$.append($$anchor, button_25);
				};

				var consequent_11 = ($$anchor) => {
					var button_26 = root_11();
					var text_6 = $.only_child(button_26, true);

					$.template_effect(() => $.set_text(text_6, $.get(errorRecovery) === 'runtime'
						? 'Reconnect'
						: $.get(errorRecovery) === 'gateway'
							? 'Gateway settings'
							: $.get(errorRecovery) === 'mapping' ? 'Repair mapping' : 'Review permission'));

					$.delegated('click', button_26, recover);
					$.append($$anchor, button_26);
				};

				$.if(node_38, ($$render) => {
					if ($.get(errorRecovery) === 'popup') $$render(consequent_10); else if ($.get(errorRecovery)) $$render(consequent_11, 1);
				});
			}

			var button_27 = $.sibling(node_38);
			var node_39 = $.child(button_27);

			Icon(node_39, { name: 'close', size: 13 });
			$.reset(button_27);
			$.reset(div_13);
			$.template_effect(($0) => $.set_text(text_5, $0), [() => errorText(app.error)]);

			$.delegated('click', button_27, () => {
				app.error = '';
				app.errorProvider = null;
			});

			$.append($$anchor, div_13);
		};

		$.if(node_36, ($$render) => {
			if (app.error) $$render(consequent_12);
		});
	}

	var node_40 = $.sibling(node_36, 2);

	{
		var consequent_13 = ($$anchor) => {
			var div_14 = root_13();

			$.append($$anchor, div_14);
		};

		$.if(node_40, ($$render) => {
			if (!app.ready && app.snapshot) $$render(consequent_13);
		});
	}

	var node_41 = $.sibling(node_40, 2);

	{
		var consequent_14 = ($$anchor) => {
			var div_15 = root_14();
			let classes_7;
			var node_42 = $.child(div_15);

			Icon(node_42, { name: 'shield', size: 15 });

			var span_12 = $.sibling(node_42);
			var text_7 = $.only_child(span_12, true);
			var button_28 = $.sibling(span_12);
			var text_8 = $.only_child(button_28, true);

			$.reset(div_15);

			$.template_effect(
				($0) => {
					classes_7 = $.set_class(div_15, 1, 'task-status', null, classes_7, { attention: $0 });

					$.set_text(text_7, app.activeTask.state === 'PERMISSION_REQUIRED'
						? 'A website task needs your approval. No tool will run until you review it.'
						: app.activeTask.state === 'PAUSED'
							? 'Task paused at a safe boundary. Progress is kept for you to continue.'
							: app.activeTask.state === 'RESULT_READY'
								? 'Tool result ready. Continue the conversation when you are ready.'
								: 'Website tool task running. You can keep browsing.');

					$.set_text(text_8, app.activeTask.state === 'PERMISSION_REQUIRED' ? 'Review tool call' : 'View task');
				},
				[
					() => ['PERMISSION_REQUIRED', 'RESULT_READY', 'PAUSED'].includes(app.activeTask.state)
				]
			);

			$.delegated('click', button_28, () => app.navigate('tools'));
			$.append($$anchor, div_15);
		};

		var d_1 = $.derived(() => app.activeTask && app.route !== 'tools' && ['PERMISSION_REQUIRED', 'RESULT_READY', 'PAUSED'].includes(app.activeTask.state));

		$.if(node_41, ($$render) => {
			if ($.get(d_1)) $$render(consequent_14);
		});
	}

	var node_43 = $.sibling(node_41, 2);

	{
		var consequent_15 = ($$anchor) => {
			var div_16 = root_15();
			var node_44 = $.child(div_16);

			Icon(node_44, { name: 'activity', size: 28 });

			var h2 = $.sibling(node_44);
			var text_9 = $.only_child(h2, true);
			var button_29 = $.sibling(h2, 2);

			$.reset(div_16);

			$.template_effect(() => {
				$.set_attribute(div_16, 'aria-busy', app.host.state === 'STARTING');
				$.set_text(text_9, app.host.state === 'STARTING' ? 'Loading your workspace' : 'Workspace unavailable');
			});

			$.delegated('click', button_29, () => app.settingsPage('runtime'));
			$.append($$anchor, div_16);
		};

		var d_2 = $.derived(() => !app.snapshot && !['browser', 'settings'].includes(app.route));

		var consequent_16 = ($$anchor) => {
			ProviderBrowser($$anchor, {});
		};

		var consequent_17 = ($$anchor) => {
			Providers($$anchor, {});
		};

		var consequent_18 = ($$anchor) => {
			Tools($$anchor, {});
		};

		var consequent_19 = ($$anchor) => {
			Models($$anchor, {});
		};

		var consequent_20 = ($$anchor) => {
			Sessions($$anchor, {});
		};

		var consequent_21 = ($$anchor) => {
			Harness($$anchor, {});
		};

		var consequent_22 = ($$anchor) => {
			Detector($$anchor, {});
		};

		var consequent_23 = ($$anchor) => {
			Settings($$anchor, {});
		};

		var alternate = ($$anchor) => {
			Home($$anchor, {});
		};

		$.if(node_43, ($$render) => {
			if ($.get(d_2)) $$render(consequent_15); else if (app.route === 'browser') $$render(consequent_16, 1); else if (app.route === 'providers') $$render(consequent_17, 2); else if (app.route === 'tools') $$render(consequent_18, 3); else if (app.route === 'models') $$render(consequent_19, 4); else if (app.route === 'sessions') $$render(consequent_20, 5); else if (app.route === 'harness') $$render(consequent_21, 6); else if (app.route === 'detector') $$render(consequent_22, 7); else if (app.route === 'settings') $$render(consequent_23, 8); else $$render(alternate, -1);
		});
	}

	$.reset(main);
	$.reset(div_10);

	var footer = $.sibling(div_10, 2);
	var span_13 = $.child(footer);
	let classes_8;
	var button_30 = $.sibling(span_13);
	var text_10 = $.only_child(button_30, true);
	var button_31 = $.sibling(button_30, 2);
	var text_11 = $.only_child(button_31);
	var button_32 = $.sibling(button_31, 2);
	var text_12 = $.only_child(button_32);
	var div_17 = $.sibling(button_32);
	var node_45 = $.child(div_17);

	{
		var consequent_24 = ($$anchor) => {
			var fragment_11 = root_16();
			var node_46 = $.first_child(fragment_11);

			Icon(node_46, { name: 'check', size: 12 });

			var span_14 = $.sibling(node_46);
			var text_13 = $.only_child(span_14, true);
			var button_33 = $.sibling(span_14);
			var node_47 = $.child(button_33);

			Icon(node_47, { name: 'close', size: 12 });
			$.reset(button_33);
			$.template_effect(() => $.set_text(text_13, app.notification));
			$.delegated('click', button_33, () => app.notification = '');
			$.append($$anchor, fragment_11);
		};

		var consequent_25 = ($$anchor) => {
			var span_15 = root_17();

			$.append($$anchor, span_15);
		};

		$.if(node_45, ($$render) => {
			if (app.notification) $$render(consequent_24); else if (app.pending) $$render(consequent_25, 1);
		});
	}

	$.reset(div_17);
	$.reset(footer);
	$.reset(div);

	var node_48 = $.sibling(div, 2);

	{
		var consequent_27 = ($$anchor) => {
			Dialog($$anchor, {
				get title() {
					return app.confirmation.title;
				},

				children: ($$anchor, $$slotProps) => {
					var fragment_13 = root_19();
					var p_1 = $.first_child(fragment_13);
					var text_14 = $.only_child(p_1, true);
					var node_49 = $.sibling(p_1);

					{
						var consequent_26 = ($$anchor) => {
							var p_2 = root_18();
							var text_15 = $.only_child(p_2, true);

							$.template_effect(($0) => $.set_text(text_15, $0), [() => errorText(app.popupError)]);
							$.append($$anchor, p_2);
						};

						$.if(node_49, ($$render) => {
							if (app.popupError) $$render(consequent_26);
						});
					}

					var div_18 = $.sibling(node_49);
					var button_34 = $.child(div_18);
					var button_35 = $.sibling(button_34);
					let classes_9;
					var text_16 = $.only_child(button_35, true);

					$.reset(div_18);

					$.template_effect(() => {
						$.set_text(text_14, app.confirmation.description);
						button_34.disabled = app.confirming;
						classes_9 = $.set_class(button_35, 1, 'primary', null, classes_9, { danger: app.confirmation.danger });
						button_35.disabled = app.confirming;
						$.set_text(text_16, app.confirming ? 'Working…' : app.confirmation.label);
					});

					$.delegated('click', button_34, () => app.popup = null);
					$.delegated('click', button_35, () => app.acceptConfirmation());
					$.append($$anchor, fragment_13);
				},
				$$slots: { default: true }
			});
		};

		var consequent_28 = ($$anchor) => {
			ChromeMenu($$anchor, {});
		};

		var consequent_29 = ($$anchor) => {
			Dialog($$anchor, {
				title: 'Add a website',
				children: ($$anchor, $$slotProps) => {
					var form_2 = root_20();
					var label_1 = $.sibling($.child(form_2));
					var input_2 = $.sibling($.child(label_1));

					$.remove_input_defaults(input_2);
					$.reset(label_1);

					var label_2 = $.sibling(label_1);
					var input_3 = $.sibling($.child(label_2), 2);

					$.remove_input_defaults(input_3);
					$.reset(label_2);

					var div_19 = $.sibling(label_2);
					var node_50 = $.child(div_19);

					Icon(node_50, { name: 'shield', size: 15 });
					$.next();
					$.reset(div_19);

					var div_20 = $.sibling(div_19);
					var button_36 = $.child(div_20);
					var button_37 = $.sibling(button_36);
					var node_51 = $.sibling($.child(button_37));

					Icon(node_51, { name: 'arrow', size: 14 });
					$.reset(button_37);
					$.reset(div_20);
					$.reset(form_2);
					$.template_effect(($0) => button_37.disabled = $0, [() => !app.ready || !$.get(addUrl).trim() || app.pending > 0]);
					$.event('submit', form_2, add);
					$.bind_value(input_2, () => $.get(addUrl), ($$value) => $.set(addUrl, $$value));
					$.bind_value(input_3, () => $.get(addLabel), ($$value) => $.set(addLabel, $$value));
					$.delegated('click', button_36, () => app.popup = null);
					$.append($$anchor, form_2);
				},
				$$slots: { default: true }
			});
		};

		var consequent_32 = ($$anchor) => {
			Dialog($$anchor, {
				title: 'Go anywhere',
				children: ($$anchor, $$slotProps) => {
					var fragment_17 = root_24();
					var label_3 = $.first_child(fragment_17);
					var node_52 = $.child(label_3);

					Icon(node_52, { name: 'search', size: 18 });

					var input_4 = $.sibling(node_52);

					$.remove_input_defaults(input_4);
					$.reset(label_3);

					var div_21 = $.sibling(label_3);
					var node_53 = $.child(div_21);

					$.each(node_53, 19, () => $.get(commands), (command) => command.id, ($$anchor, command, index) => {
						var button_38 = root_22();
						let classes_10;
						var node_54 = $.child(button_38);

						Icon(node_54, {
							get name() {
								return $.get(command).icon;
							},
							size: 17
						});

						var span_16 = $.sibling(node_54);
						var strong = $.child(span_16);
						var text_17 = $.only_child(strong, true);
						var small = $.sibling(strong);
						var text_18 = $.only_child(small, true);

						$.reset(span_16);

						var node_55 = $.sibling(span_16);

						{
							var consequent_30 = ($$anchor) => {
								var kbd = root_21();

								$.append($$anchor, kbd);
							};

							$.if(node_55, ($$render) => {
								if ($.get(index) === $.get(commandIndex)) $$render(consequent_30);
							});
						}

						$.reset(button_38);

						$.template_effect(() => {
							classes_10 = $.set_class(button_38, 1, '', null, classes_10, { selected: $.get(index) === $.get(commandIndex) });
							$.set_text(text_17, $.get(command).title);
							$.set_text(text_18, $.get(command).description);
						});

						$.delegated('click', button_38, function (...$$args) {
							$.get(command).action?.apply(this, $$args);
						});

						$.append($$anchor, button_38);
					});

					var node_56 = $.sibling(node_53);

					{
						var consequent_31 = ($$anchor) => {
							var p_3 = root_23();

							$.append($$anchor, p_3);
						};

						$.if(node_56, ($$render) => {
							if (!$.get(commands).length) $$render(consequent_31);
						});
					}

					$.reset(div_21);
					$.next();
					$.bind_value(input_4, () => $.get(query), ($$value) => $.set(query, $$value));
					$.append($$anchor, fragment_17);
				},
				$$slots: { default: true }
			});
		};

		var consequent_33 = ($$anchor) => {
			Dialog($$anchor, {
				title: 'Keyboard shortcuts',
				children: ($$anchor, $$slotProps) => {
					var fragment_19 = root_26();
					var node_57 = $.first_child(fragment_19);

					$.each(
						node_57,
						16,
						() => [
							['Address bar', 'Ctrl L'],
							['Provider sidebar', 'Ctrl Shift B'],
							['Commands', 'Ctrl K'],
							['New website tab', 'Ctrl T'],
							['Reopen closed tab', 'Ctrl Shift T'],
							['Close current tab', 'Ctrl W'],
							['Close application', 'Ctrl Shift W'],
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
							var div_22 = root_25();
							var span_17 = $.child(div_22);
							var text_19 = $.only_child(span_17, true);
							var kbd_1 = $.sibling(span_17);
							var text_20 = $.only_child(kbd_1, true);

							$.reset(div_22);

							$.template_effect(() => {
								$.set_text(text_19, label());
								$.set_text(text_20, key());
							});

							$.append($$anchor, div_22);
						}
					);

					$.next();
					$.append($$anchor, fragment_19);
				},
				$$slots: { default: true }
			});
		};

		var consequent_35 = ($$anchor) => {
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
						var fragment_21 = root_27();
						var node_58 = $.first_child(fragment_21);

						{
							var consequent_34 = ($$anchor) => {
								var p_4 = root_18();
								var text_21 = $.only_child(p_4, true);

								$.template_effect(($0) => $.set_text(text_21, $0), [() => errorText(app.popupError)]);
								$.append($$anchor, p_4);
							};

							$.if(node_58, ($$render) => {
								if (app.popupError) $$render(consequent_34);
							});
						}

						var p_5 = $.sibling(node_58);
						var text_22 = $.only_child(p_5, true);
						var div_23 = $.sibling(p_5);
						var button_39 = $.child(div_23);
						var button_40 = $.sibling(button_39);
						var text_23 = $.only_child(button_40, true);

						$.reset(div_23);

						$.template_effect(() => {
							$.set_text(text_22, app.popup === 'rotate-key'
								? 'The current key will stop working and connected requests will be cancelled. Copy the new key into your clients. This does not change your website accounts.'
								: app.popup === 'close-provider'
									? 'This website is currently generating a response. Closing it cancels that request. Its login profile is preserved.'
									: app.popup === 'remove-provider'
										? 'This removes the website, connector, and local browser storage from your workspace. Related sessions will be ended. Your remote account is not deleted.'
										: 'This deletes this website’s local cookies and storage and closes its tab. You will need to sign in again. Other website profiles are not affected.');

							button_40.disabled = app.pending > 0;

							$.set_text(text_23, app.popup === 'rotate-key'
								? 'Regenerate key'
								: app.popup === 'remove-provider'
									? 'Remove website'
									: app.popup === 'close-provider' ? 'Stop and close' : 'Clear local profile');
						});

						$.delegated('click', button_39, () => app.popup = null);
						$.delegated('click', button_40, confirm);
						$.append($$anchor, fragment_21);
					},
					$$slots: { default: true }
				});
			}
		};

		$.if(node_48, ($$render) => {
			if (app.popup === 'confirm' && app.confirmation) $$render(consequent_27); else if (app.popup === 'menu' || app.popup === 'tab-actions') $$render(consequent_28, 1); else if (app.popup === 'add') $$render(consequent_29, 2); else if (app.popup === 'commands') $$render(consequent_32, 3); else if (app.popup === 'shortcuts') $$render(consequent_33, 4); else if (app.popup) $$render(consequent_35, 5);
		});
	}

	$.template_effect(
		($0, $1) => {
			classes = $.set_class(div, 1, 'app-shell', null, classes, { compact: app.preferences.compact });
			$.set_style(div, `--inspector:${app.inspectorWidth}px`);
			$.set_attribute(button, 'aria-expanded', app.popup === 'menu');
			$.set_attribute(button_9, 'aria-label', $.get(maximized) ? 'Restore window' : 'Maximize window');
			$.set_attribute(button_11, 'aria-expanded', app.shelfVisible);
			button_12.disabled = app.route === 'browser' ? !app.provider : !app.canGoBack;
			button_13.disabled = !app.canGoForward && (app.route !== 'browser' || !app.provider);
			button_14.disabled = !app.provider || app.route !== 'browser';
			$.set_attribute(button_16, 'aria-current', app.route === 'tools' ? 'page' : undefined);
			classes_2 = $.set_class(button_16, 1, '', null, classes_2, { active: app.route === 'tools' });
			classes_3 = $.set_class(button_17, 1, 'connect-shortcut', null, classes_3, { active: app.route === 'harness' });
			$.set_attribute(button_17, 'aria-current', app.route === 'harness' ? 'page' : undefined);

			$.set_attribute(button_17, 'title', $.get(online)
				? 'Local gateway ready · Connect a coding client'
				: 'Connect a coding client · Gateway offline');

			classes_4 = $.set_class(span_8, 1, 'dot', null, classes_4, { online: $.get(online) });
			classes_5 = $.set_class(div_10, 1, 'workspace', null, classes_5, { 'with-shelf': app.shelfVisible });
			classes_8 = $.set_class(span_13, 1, 'dot', null, classes_8, { online: $.get(online) });

			$.set_text(text_10, !app.ready
				? 'Gateway offline'
				: $.get(online)
					? 'Gateway ready'
					: app.host.code === 'FALLBACK_MODE' ? 'No gateway' : 'Gateway stopped');

			$.set_text(text_11, `${(app.ready ? app.exposedModels.length : '—') ?? ''} ready ${app.ready && app.exposedModels.length === 1 ? 'model' : 'models'}`);
			$.set_text(text_12, `${$0 ?? ''} active ${$1 ?? ''}`);
		},
		[
			() => app.sessions.filter((s) => s.status === 'ACTIVE').length,
			() => app.sessions.filter((s) => s.status === 'ACTIVE').length === 1 ? 'session' : 'sessions'
		]
	);

	$.delegated('click', button, () => app.showPopup(app.popup === 'menu' ? null : 'menu'));
	$.delegated('click', button_7, () => app.newTab());

	$.delegated('pointerdown', div_5, (event) => {
		if (event.button === 0) void windowAction('drag');
	});

	$.delegated('dblclick', div_5, () => windowAction('maximize'));
	$.delegated('click', button_8, () => windowAction('minimize'));
	$.delegated('click', button_9, () => windowAction('maximize'));
	$.delegated('click', button_10, closeApplication);
	$.delegated('click', button_11, () => app.toggleShelf());
	$.delegated('click', button_12, () => app.back());
	$.delegated('click', button_13, () => app.forward());
	$.delegated('click', button_14, () => app.control('reload'));
	$.event('submit', form, submitAddress);
	$.event('focus', input, () => $.set(addressEditing, true));
	$.event('blur', input, () => $.set(addressEditing, false));
	$.bind_value(input, () => $.get(address), ($$value) => $.set(address, $$value));
	$.delegated('click', button_16, () => app.navigate('tools'));
	$.delegated('click', button_17, () => app.navigate('harness'));

	$.delegated('click', button_18, () => {
		app.inspectorVisible = true;
		app.inspectorTab = 'browser';
		app.navigate('browser');
		app.saveLayout();
	});

	$.delegated('click', button_30, () => app.navigate('harness'));
	$.delegated('click', button_31, () => app.navigate('providers'));
	$.delegated('click', button_32, () => app.navigate('sessions'));
	$.append($$anchor, fragment);
	$.pop();
}

$.delegate(['click', 'keydown', 'contextmenu', 'pointerdown', 'dblclick']);