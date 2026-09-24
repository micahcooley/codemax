import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';
import Icon from './Icon.svelte.js';

var root = $.from_html(`<div class="empty"><div class="empty-icon"><!></div><h2> </h2><p> </p></div>`);

export default function Empty($$anchor, $$props) {
	let icon = $.prop($$props, 'icon', 3, 'layers');
	var div = root();
	var div_1 = $.child(div);
	var node = $.child(div_1);

	Icon(node, {
		get name() {
			return icon();
		},
		size: 28
	});

	$.reset(div_1);

	var h2 = $.sibling(div_1);
	var text = $.only_child(h2, true);
	var p = $.sibling(h2);
	var text_1 = $.only_child(p, true);

	$.reset(div);

	$.template_effect(() => {
		$.set_text(text, $$props.title);
		$.set_text(text_1, $$props.description);
	});

	$.append($$anchor, div);
}