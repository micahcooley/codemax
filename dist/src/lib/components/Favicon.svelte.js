import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';
import { initials } from '../format.js';
import { siteIcon } from '../site-icons.js';

var root = $.from_html(`<img alt="" loading="lazy" draggable="false"/>`);
var root_1 = $.from_html(`<span class="favicon-fallback" aria-hidden="true"> </span>`);

export default function Favicon($$anchor, $$props) {
	$.push($$props, true);

	let size = $.prop($$props, 'size', 3, 16);
	let src = $.derived(() => siteIcon($$props.origin) ?? '');
	var fragment = $.comment();
	var node = $.first_child(fragment);

	{
		var consequent = ($$anchor) => {
			var img = root();

			$.template_effect(() => {
				$.set_attribute(img, 'src', $.get(src));
				$.set_attribute(img, 'width', size());
				$.set_attribute(img, 'height', size());
			});

			$.append($$anchor, img);
		};

		var alternate = ($$anchor) => {
			var span = root_1();
			var text = $.only_child(span, true);

			$.template_effect(($0) => $.set_text(text, $0), [() => initials($$props.label).slice(0, 1)]);
			$.append($$anchor, span);
		};

		$.if(node, ($$render) => {
			if ($.get(src)) $$render(consequent); else $$render(alternate, -1);
		});
	}

	$.append($$anchor, fragment);
	$.pop();
}