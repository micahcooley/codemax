import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';
import { onMount } from '../../../runtime/svelte_svelte.js';
import { app } from '../state/app.svelte.js';
import Icon from './Icon.svelte.js';

var root = $.from_html(`<dialog><div class="dialog-title"><h2> </h2><button class="icon-button" aria-label="Close dialog"><!></button></div> <!></dialog>`);

export default function Dialog($$anchor, $$props) {
	$.push($$props, true);

	let dialog;

	onMount(() => {
		const previous = document.activeElement;

		dialog.showModal();

		return () => previous?.focus();
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
	});

	$.event('cancel', dialog_1, () => app.popup = null);
	$.event('close', dialog_1, () => app.popup = null);
	$.append($$anchor, dialog_1);
	$.pop();
}

$.delegate(['click']);