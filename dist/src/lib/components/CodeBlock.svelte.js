import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';
import Icon from './Icon.svelte.js';
import { app } from '../state/app.svelte.js';

var root = $.from_html(`<div class="code-block"><div class="code-caption"><span> </span><button class="text-button"><!>Copy</button></div><pre><code> </code></pre></div>`);

export default function CodeBlock($$anchor, $$props) {
	$.push($$props, true);

	let label = $.prop($$props, 'label', 3, 'Configuration');
	var div = root();
	var div_1 = $.child(div);
	var span = $.child(div_1);
	var text = $.only_child(span, true);
	var button = $.sibling(span);
	var node = $.child(button);

	Icon(node, { name: 'copy', size: 14 });
	$.next();
	$.reset(button);
	$.reset(div_1);

	var pre = $.sibling(div_1);
	var code_1 = $.child(pre);
	var text_1 = $.only_child(code_1, true);

	$.reset(pre);
	$.reset(div);

	$.template_effect(() => {
		$.set_text(text, label());
		$.set_text(text_1, $$props.code);
	});

	$.delegated('click', button, () => app.clipboard($$props.code));
	$.append($$anchor, div);
	$.pop();
}

$.delegate(['click']);