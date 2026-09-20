import '../../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../../runtime/svelte_internal_client.js';
import { onMount } from '../../../../runtime/svelte_svelte.js';
import { app } from '../../state/app.svelte.js';
import { routes } from '../../types/bridge.js';
import Icon from '../Icon.svelte.js';

var root_1 = $.from_html(`<button role="menuitem"><!><span>Open website</span></button> <button role="menuitem"><!><span> </span></button> <button role="menuitem"><!><span>Move tab left</span></button> <button role="menuitem"><!><span>Move tab right</span></button> <button role="menuitem"><!><span>Inspect connector</span></button> <button role="menuitem"><!><span>Close tab</span><kbd>Ctrl W</kbd></button> <hr/> <button role="menuitem"><!><span>Clear local profile</span></button> <button role="menuitem" class="danger-text"><!><span>Remove website</span></button>`, 1);
var root_4 = $.from_html(`<small> </small>`);
var root_6 = $.from_html(`<small> </small>`);
var root_3 = $.from_html(`<button role="menuitem"><!><span> </span><!></button>`);
var root_2 = $.from_html(`<button role="menuitem"><!><span>New tab</span><kbd>Ctrl T</kbd></button> <hr/> <!> <hr/> <button role="menuitem"><!><span>Settings</span></button> <button role="menuitem"><!><span>Commands</span><kbd>Ctrl K</kbd></button> <button role="menuitem"><!><span>Keyboard shortcuts</span></button>`, 1);
var root = $.from_html(`<dialog class="chrome-menu"><div class="chrome-menu-heading"><strong> </strong><small> </small></div> <div role="menu"><!></div></dialog>`);

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

	var dialog_1 = root();

	dialog_1.__keydown = keys;

	dialog_1.__click = (event) => {
		if (event.target === dialog) dismiss();
	};

	let styles;
	var div = $.child(dialog_1);
	var strong = $.child(div);
	var text = $.child(strong, true);

	$.reset(strong);

	var small = $.sibling(strong);
	var text_1 = $.child(small, true);

	$.reset(small);
	$.reset(div);

	var div_1 = $.sibling(div, 2);
	var node = $.child(div_1);

	{
		var consequent = ($$anchor) => {
			var fragment = root_1();
			var button = $.first_child(fragment);

			button.__click = () => app.openProvider($.get(provider).id);

			var node_1 = $.child(button);

			Icon(node_1, { name: 'globe', size: 15 });
			$.next();
			$.reset(button);

			var button_1 = $.sibling(button, 2);

			button_1.__click = togglePinned;

			var node_2 = $.child(button_1);

			Icon(node_2, { name: 'pin', size: 15 });

			var span = $.sibling(node_2);
			var text_2 = $.child(span, true);

			$.reset(span);
			$.reset(button_1);

			var button_2 = $.sibling(button_1, 2);

			button_2.__click = () => move(-1);

			var node_3 = $.child(button_2);

			Icon(node_3, { name: 'back', size: 15 });
			$.next();
			$.reset(button_2);

			var button_3 = $.sibling(button_2, 2);

			button_3.__click = () => move(1);

			var node_4 = $.child(button_3);

			Icon(node_4, { name: 'arrow', size: 15 });
			$.next();
			$.reset(button_3);

			var button_4 = $.sibling(button_3, 2);

			button_4.__click = () => {
				app.selectedProvider = $.get(provider).id;
				app.navigate('detector');
			};

			var node_5 = $.child(button_4);

			Icon(node_5, { name: 'scan', size: 15 });
			$.next();
			$.reset(button_4);

			var button_5 = $.sibling(button_4, 2);

			button_5.__click = () => app.closeProvider($.get(provider).id);

			var node_6 = $.child(button_5);

			Icon(node_6, { name: 'close', size: 15 });
			$.next(2);
			$.reset(button_5);

			var button_6 = $.sibling(button_5, 4);

			button_6.__click = () => app.showPopup('clear-profile', $.get(provider).id);

			var node_7 = $.child(button_6);

			Icon(node_7, { name: 'refresh', size: 15 });
			$.next();
			$.reset(button_6);

			var button_7 = $.sibling(button_6, 2);

			button_7.__click = () => app.showPopup('remove-provider', $.get(provider).id);

			var node_8 = $.child(button_7);

			Icon(node_8, { name: 'trash', size: 15 });
			$.next();
			$.reset(button_7);

			$.template_effect(() => {
				$.set_text(text_2, $.get(provider).pinned ? 'Unpin website' : 'Keep website awake');
				button_2.disabled = $.get(position) <= 0;
				button_3.disabled = $.get(position) < 0 || $.get(position) >= app.tabs.length - 1;
			});

			$.append($$anchor, fragment);
		};

		var alternate_1 = ($$anchor) => {
			var fragment_1 = root_2();
			var button_8 = $.first_child(fragment_1);

			button_8.__click = () => app.newTab();

			var node_9 = $.child(button_8);

			Icon(node_9, { name: 'plus', size: 15 });
			$.next(2);
			$.reset(button_8);

			var node_10 = $.sibling(button_8, 4);

			$.each(node_10, 17, () => pages, (page) => page.id, ($$anchor, page) => {
				var button_9 = root_3();

				button_9.__click = () => app.navigate($.get(page).id);

				let classes;
				var node_11 = $.child(button_9);

				Icon(node_11, {
					get name() {
						return $.get(page).icon;
					},
					size: 15
				});

				var span_1 = $.sibling(node_11);
				var text_3 = $.child(span_1, true);

				$.reset(span_1);

				var node_12 = $.sibling(span_1);

				{
					var consequent_1 = ($$anchor) => {
						var small_1 = root_4();
						var text_4 = $.child(small_1, true);

						$.reset(small_1);
						$.template_effect(() => $.set_text(text_4, app.detectedProviders.length));
						$.append($$anchor, small_1);
					};

					var alternate = ($$anchor) => {
						var fragment_2 = $.comment();
						var node_13 = $.first_child(fragment_2);

						{
							var consequent_2 = ($$anchor) => {
								var small_2 = root_6();
								var text_5 = $.child(small_2, true);

								$.reset(small_2);
								$.template_effect(() => $.set_text(text_5, app.models.length));
								$.append($$anchor, small_2);
							};

							$.if(
								node_13,
								($$render) => {
									if ($.get(page).id === 'models') $$render(consequent_2);
								},
								true
							);
						}

						$.append($$anchor, fragment_2);
					};

					$.if(node_12, ($$render) => {
						if ($.get(page).id === 'providers') $$render(consequent_1); else $$render(alternate, false);
					});
				}

				$.reset(button_9);

				$.template_effect(() => {
					$.set_attribute(button_9, 'aria-label', $.get(page).title);
					classes = $.set_class(button_9, 1, '', null, classes, { active: app.route === $.get(page).id });
					$.set_text(text_3, $.get(page).title);
				});

				$.append($$anchor, button_9);
			});

			var button_10 = $.sibling(node_10, 4);

			button_10.__click = () => app.navigate('settings');

			var node_14 = $.child(button_10);

			Icon(node_14, { name: 'settings', size: 15 });
			$.next();
			$.reset(button_10);

			var button_11 = $.sibling(button_10, 2);

			button_11.__click = () => app.showPopup('commands');

			var node_15 = $.child(button_11);

			Icon(node_15, { name: 'command', size: 15 });
			$.next(2);
			$.reset(button_11);

			var button_12 = $.sibling(button_11, 2);

			button_12.__click = () => app.showPopup('shortcuts');

			var node_16 = $.child(button_12);

			Icon(node_16, { name: 'key', size: 15 });
			$.next();
			$.reset(button_12);
			$.append($$anchor, fragment_1);
		};

		$.if(node, ($$render) => {
			if ($.get(provider)) $$render(consequent); else $$render(alternate_1, false);
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

	$.event('cancel', dialog_1, dismiss);
	$.append($$anchor, dialog_1);
	$.pop();
}

$.delegate(['keydown', 'click']);