import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';

var root = $.from_html(`<span class="badge"><span class="status-dot"></span> </span>`);

export default function Badge($$anchor, $$props) {
	$.push($$props, true);

	var span = root();
	var text = $.sibling($.child(span), 1, true);

	$.reset(span);

	$.template_effect(
		($0) => {
			$.set_attribute(span, 'data-state', $$props.state);
			$.set_text(text, $0);
		},
		[() => $$props.state.toLowerCase().replaceAll('_', ' ')]
	);

	$.append($$anchor, span);
	$.pop();
}