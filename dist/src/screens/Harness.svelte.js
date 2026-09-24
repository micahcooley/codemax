import '../../runtime/svelte_internal_disclose-version.js';
import '../../runtime/svelte_internal_flags_legacy.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import Icon from '../lib/components/Icon.svelte.js';
import ExternalClients from '../lib/components/ExternalClients.svelte.js';

var root = $.from_html(`<section class="screen"><div class="screen-inner connect-screen"><header class="screen-head"><div><div class="breadcrumb">Codemax / Harness</div><h1>Connect a client</h1><p>Choose a client and a website model. Copy one launch command; your signed-in website supplies the quota.</p></div><button class="secondary"><!>Manage providers</button></header> <!> <p class="connection-footnote">Already connected? <button class="text-button">View client sessions</button> · Your coding client manages its own tools and permissions.</p></div></section>`);

export default function Harness($$anchor, $$props) {
	$.push($$props, false);
	$.init();

	var section = root();
	var div = $.child(section);
	var header = $.child(div);
	var button = $.sibling($.child(header));
	var node = $.child(button);

	Icon(node, { name: 'globe', size: 15 });
	$.next();
	$.reset(button);
	$.reset(header);

	var node_1 = $.sibling(header, 2);

	ExternalClients(node_1, {});

	var p = $.sibling(node_1, 2);
	var button_1 = $.sibling($.child(p));

	$.next();
	$.reset(p);
	$.reset(div);
	$.reset(section);
	$.delegated('click', button, () => app.navigate('providers'));
	$.delegated('click', button_1, () => app.navigate('sessions'));
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click']);