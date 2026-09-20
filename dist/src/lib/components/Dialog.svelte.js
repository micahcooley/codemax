import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';
import { onMount, tick } from '../../../runtime/svelte_svelte.js';
import { app } from '../state/app.svelte.js';
import Icon from './Icon.svelte.js';

var root = $.from_html(`<dialog><div class="dialog-title"><h2> </h2><button class="icon-button" aria-label="Close dialog"><!></button></div> <!></dialog>`);

export default function Dialog($$anchor, $$props) {
	$.push($$props, true);

	let dialog;

	onMount(() => {
		const previous = document.activeElement;

		dialog.showModal();

		void tick().then(() => {
			// Cancel is the safe first target in confirmations; forms focus the first field.
			const target = dialog.querySelector('[data-initial-focus],input:not(:disabled),textarea:not(:disabled)');

			target?.focus();
		});

		return () => {
			if (previous?.isConnected) previous.focus(); else document.querySelector('.title-tabs [aria-selected="true"]')?.focus();
		};
	});

	var dialog_1 = root();
	var div = $.child(dialog_1);
	var h2 = $.child(div);
	var text = $.child(h2, true);

	$.reset(h2);

	var button = $.sibling(h2);

	button.__click = () => app.popup = null;

	var node = $.child(button);

	Icon(node, { name: 'close' });
	$.reset(button);
	$.reset(div);

	var node_1 = $.sibling(div, 2);

	$.snippet(node_1, () => $$props.children);
	$.reset(dialog_1);
	$.bind_this(dialog_1, ($$value) => dialog = $$value, () => dialog);

	$.template_effect(() => {
		$.set_attribute(dialog_1, 'aria-label', $$props.title);
		$.set_text(text, $$props.title);
		button.disabled = app.confirming;
	});

	$.event('cancel', dialog_1, (event) => {
		event.preventDefault();

		if (!app.confirming) app.popup = null;
	});

	$.append($$anchor, dialog_1);
	$.pop();
}

$.delegate(['click']);