import '../../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../../runtime/svelte_internal_client.js';
import { onMount } from '../../../../runtime/svelte_svelte.js';
import { app } from '../../state/app.svelte.js';
import { routes } from '../../types/bridge.js';
import Icon from '../Icon.svelte.js';

var root = $.from_html(`<button role="menuitem"><!><span>Open website</span></button> <button role="menuitem"><!><span> </span></button> <button role="menuitem"><!><span>Move tab left</span></button> <button role="menuitem"><!><span>Move tab right</span></button> <button role="menuitem"><!><span>Inspect connector</span></button> <button role="menuitem"><!><span>Close tab</span><kbd>Ctrl W</kbd></button> <hr/> <button role="menuitem"><!><span>Clear local profile</span></button> <button role="menuitem" class="danger-text"><!><span>Remove website</span></button>`, 1);
var root_1 = $.from_html(`<small> </small>`);
var root_2 = $.from_html(`<button role="menuitem"><!><span> </span><!></button>`);
var root_3 = $.from_html(`<button role="menuitem"><!><span>New tab</span><kbd>Ctrl T</kbd></button> <button role="menuitem"><!><span> </span></button> <button role="menuitem"><!><span>Connection inspector</span></button> <hr/> <!> <hr/> <button role="menuitem"><!><span>Settings</span></button> <button role="menuitem"><!><span>Commands</span><kbd>Ctrl K</kbd></button> <button role="menuitem"><!><span>Keyboard shortcuts</span></button>`, 1);
var root_4 = $.from_html(`<dialog class="chrome-menu"><div class="chrome-menu-heading"><strong> </strong><small> </small></div> <div role="menu"><!></div></dialog>`);

export default function ChromeMenu($$anchor, $$props) {
	$.push($$props, true);

	let dialog;
	let left = $.state(8);
	let top = $.state(46);

	const provider = $.derived(() => app.popup === 'tab-actions'
		? app.providers.find((p) => p.id === app.popupProvider)
		: undefined);

	const pages = routes.filter((r) => !['browser', 'settings'].includes(r.id));

	const position = $.derived(() => $.get(provider)
		? app.tabs.findIndex((p) => p.id === $.get(provider).id)
		: -1);

	onMount(() => {
		const previous = document.activeElement;

		dialog.showModal();

		const place = () => {
			const rect = dialog.getBoundingClientRect();

			$.set(left, Math.max(8, Math.min(app.contextMenu?.x ?? 8, window.innerWidth - rect.width - 8)), true);
			$.set(top, Math.max(8, Math.min(app.contextMenu?.y ?? 46, window.innerHeight - rect.height - 8)), true);
		};

		place();
		window.addEventListener('resize', place);
		dialog.querySelector('[role="menuitem"]:not(:disabled)')?.focus();

		return () => {
			window.removeEventListener('resize', place);

			if (previous?.isConnected) previous.focus();
		};
	});

	function dismiss() {
		app.popup = null;
		app.contextMenu = null;
	}

	function keys(event) {
		if (event.key === 'Escape') {
			event.preventDefault();
			dismiss();

			return;
		}

		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

		event.preventDefault();

		const items = [
			...dialog.querySelectorAll('[role="menuitem"]:not(:disabled)')
		];

		const index = items.indexOf(document.activeElement);

		const next = event.key === 'Home'
			? 0
			: event.key === 'End'
				? items.length - 1
				: (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;

		items[next]?.focus();
	}

	function togglePinned() {
		if ($.get(provider)) {
			void app.perform('provider.update', {
				provider_id: $.get(provider).id,
				pinned: !$.get(provider).pinned
			});

			dismiss();
		}
	}

	function move(offset) {
		if ($.get(provider)) {
			app.moveTab($.get(provider).id, offset);
			dismiss();
		}
	}

	var dialog_1 = root_4();
	let styles;
	var div = $.child(dialog_1);
	var strong = $.child(div);
	var text = $.only_child(strong, true);
	var small = $.sibling(strong);
	var text_1 = $.only_child(small, true);

	$.reset(div);

	var div_1 = $.sibling(div, 2);
	var node = $.child(div_1);

	{
		var consequent = ($$anchor) => {
			var fragment = root();
			var button = $.first_child(fragment);
			var node_1 = $.child(button);

			Icon(node_1, { name: 'globe', size: 15 });
			$.next();
			$.reset(button);

			var button_1 = $.sibling(button, 2);
			var node_2 = $.child(button_1);

			Icon(node_2, { name: 'pin', size: 15 });

			var span = $.sibling(node_2);
			var text_2 = $.only_child(span, true);

			$.reset(button_1);

			var button_2 = $.sibling(button_1, 2);
			var node_3 = $.child(button_2);

			Icon(node_3, { name: 'back', size: 15 });
			$.next();
			$.reset(button_2);

			var button_3 = $.sibling(button_2, 2);
			var node_4 = $.child(button_3);

			Icon(node_4, { name: 'arrow', size: 15 });
			$.next();
			$.reset(button_3);

			var button_4 = $.sibling(button_3, 2);
			var node_5 = $.child(button_4);

			Icon(node_5, { name: 'scan', size: 15 });
			$.next();
			$.reset(button_4);

			var button_5 = $.sibling(button_4, 2);
			var node_6 = $.child(button_5);

			Icon(node_6, { name: 'close', size: 15 });
			$.next(2);
			$.reset(button_5);

			var button_6 = $.sibling(button_5, 4);
			var node_7 = $.child(button_6);

			Icon(node_7, { name: 'refresh', size: 15 });
			$.next();
			$.reset(button_6);

			var button_7 = $.sibling(button_6, 2);
			var node_8 = $.child(button_7);

			Icon(node_8, { name: 'trash', size: 15 });
			$.next();
			$.reset(button_7);

			$.template_effect(() => {
				$.set_text(text_2, $.get(provider).pinned ? 'Allow website to sleep' : 'Keep website awake');
				button_2.disabled = $.get(position) <= 0;
				button_3.disabled = $.get(position) < 0 || $.get(position) >= app.tabs.length - 1;
			});

			$.delegated('click', button, () => app.openProvider($.get(provider).id));
			$.delegated('click', button_1, togglePinned);
			$.delegated('click', button_2, () => move(-1));
			$.delegated('click', button_3, () => move(1));

			$.delegated('click', button_4, () => {
				app.selectedProvider = $.get(provider).id;
				app.navigate('detector');
			});

			$.delegated('click', button_5, () => app.closeProvider($.get(provider).id));
			$.delegated('click', button_6, () => app.showPopup('clear-profile', $.get(provider).id));
			$.delegated('click', button_7, () => app.showPopup('remove-provider', $.get(provider).id));
			$.append($$anchor, fragment);
		};

		var alternate = ($$anchor) => {
			var fragment_1 = root_3();
			var button_8 = $.first_child(fragment_1);
			var node_9 = $.child(button_8);

			Icon(node_9, { name: 'plus', size: 15 });
			$.next(2);
			$.reset(button_8);

			var button_9 = $.sibling(button_8, 2);
			var node_10 = $.child(button_9);

			Icon(node_10, { name: 'panel', size: 15 });

			var span_1 = $.sibling(node_10);
			var text_3 = $.only_child(span_1, true);

			$.reset(button_9);

			var button_10 = $.sibling(button_9, 2);
			var node_11 = $.child(button_10);

			Icon(node_11, { name: 'scan', size: 15 });
			$.next();
			$.reset(button_10);

			var node_12 = $.sibling(button_10, 4);

			$.each(node_12, 17, () => pages, (page) => page.id, ($$anchor, page) => {
				var button_11 = root_2();
				let classes;
				var node_13 = $.child(button_11);

				Icon(node_13, {
					get name() {
						return $.get(page).icon;
					},
					size: 15
				});

				var span_2 = $.sibling(node_13);
				var text_4 = $.only_child(span_2, true);
				var node_14 = $.sibling(span_2);

				{
					var consequent_1 = ($$anchor) => {
						var small_1 = root_1();
						var text_5 = $.only_child(small_1, true);

						$.template_effect(() => $.set_text(text_5, app.detectedProviders.length));
						$.append($$anchor, small_1);
					};

					var consequent_2 = ($$anchor) => {
						var small_2 = root_1();
						var text_6 = $.only_child(small_2, true);

						$.template_effect(() => $.set_text(text_6, app.models.length));
						$.append($$anchor, small_2);
					};

					$.if(node_14, ($$render) => {
						if ($.get(page).id === 'providers') $$render(consequent_1); else if ($.get(page).id === 'models') $$render(consequent_2, 1);
					});
				}

				$.reset(button_11);

				$.template_effect(() => {
					$.set_attribute(button_11, 'aria-label', $.get(page).title);
					classes = $.set_class(button_11, 1, '', null, classes, { active: app.route === $.get(page).id });
					$.set_text(text_4, $.get(page).title);
				});

				$.delegated('click', button_11, () => app.navigate($.get(page).id));
				$.append($$anchor, button_11);
			});

			var button_12 = $.sibling(node_12, 4);
			var node_15 = $.child(button_12);

			Icon(node_15, { name: 'settings', size: 15 });
			$.next();
			$.reset(button_12);

			var button_13 = $.sibling(button_12, 2);
			var node_16 = $.child(button_13);

			Icon(node_16, { name: 'command', size: 15 });
			$.next(2);
			$.reset(button_13);

			var button_14 = $.sibling(button_13, 2);
			var node_17 = $.child(button_14);

			Icon(node_17, { name: 'key', size: 15 });
			$.next();
			$.reset(button_14);
			$.template_effect(() => $.set_text(text_3, app.shelfVisible ? 'Hide provider sidebar' : 'Show provider sidebar'));
			$.delegated('click', button_8, () => app.newTab());

			$.delegated('click', button_9, () => {
				app.toggleShelf();
				dismiss();
			});

			$.delegated('click', button_10, () => {
				app.navigate('browser');
				app.inspectorVisible = !app.inspectorVisible;
				app.saveLayout();
			});

			$.delegated('click', button_12, () => app.navigate('settings'));
			$.delegated('click', button_13, () => app.showPopup('commands'));
			$.delegated('click', button_14, () => app.showPopup('shortcuts'));
			$.append($$anchor, fragment_1);
		};

		$.if(node, ($$render) => {
			if ($.get(provider)) $$render(consequent); else $$render(alternate, -1);
		});
	}

	$.reset(div_1);
	$.reset(dialog_1);
	$.bind_this(dialog_1, ($$value) => dialog = $$value, () => dialog);

	$.template_effect(() => {
		$.set_attribute(dialog_1, 'aria-label', $.get(provider) ? `${$.get(provider).label} actions` : 'Codemax menu');
		styles = $.set_style(dialog_1, '', styles, { left: `${$.get(left)}px`, top: `${$.get(top)}px` });
		$.set_text(text, $.get(provider) ? $.get(provider).label : 'Codemax');

		$.set_text(text_1, $.get(provider)
			? $.get(provider).origin
			: 'Browse · discover · connect');

		$.set_attribute(div_1, 'aria-label', $.get(provider)
			? `${$.get(provider).label} actions`
			: 'Codemax pages and actions');
	});

	$.delegated('keydown', dialog_1, keys);
	$.event('cancel', dialog_1, dismiss);

	$.delegated('click', dialog_1, (event) => {
		if (event.target === dialog) dismiss();
	});

	$.append($$anchor, dialog_1);
	$.pop();
}

$.delegate(['keydown', 'click']);