import '../../runtime/svelte_internal_disclose-version.js';
import '../../runtime/svelte_internal_flags_legacy.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import Icon from '../lib/components/Icon.svelte.js';
import ExternalClients from '../lib/components/ExternalClients.svelte.js';

var root = $.from_html(`<section class="screen"><div class="screen-inner"><header class="screen-head"><div><div class="breadcrumb">Codemax / Harness</div><h1>Connect a client</h1><p>Choose your coding client, start the local connection, and copy its configuration. Your signed-in websites supply the models.</p></div><button class="secondary"><!>Manage providers</button></header> <!> <details class="advanced-client"><summary>Advanced · MCP versus model connections</summary><p>MCP connects tools to an assistant. A model-provider connection lets a harness use the website model as its model. Codemax keeps both paths separate; adding an MCP server alone does not replace a harness’s model.</p><p style="margin-top:12px">The registry updates live. A harness that caches or requires an explicit model list may need a refresh, restart, or an updated configuration export. Codemax does not secretly overwrite client configuration files.</p><button class="secondary" style="margin-top:16px">Manage website tools<!></button></details></div></section>`);

export default function Harness($$anchor, $$props) {
	$.push($$props, false);
	$.init();

	var section = root();
	var div = $.child(section);
	var header = $.child(div);
	var button = $.sibling($.child(header));

	button.__click = () => app.navigate('providers');

	var node = $.child(button);

	Icon(node, { name: 'globe', size: 15 });
	$.next();
	$.reset(button);
	$.reset(header);

	var node_1 = $.sibling(header, 2);

	ExternalClients(node_1, {});

	var details = $.sibling(node_1, 2);
	var button_1 = $.sibling($.child(details), 3);

	button_1.__click = () => app.navigate('tools');

	var node_2 = $.sibling($.child(button_1));

	Icon(node_2, { name: 'arrow', size: 14 });
	$.reset(button_1);
	$.reset(details);
	$.reset(div);
	$.reset(section);
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click']);