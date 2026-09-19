import '../../runtime/svelte_internal_disclose-version.js';
import '../../runtime/svelte_internal_flags_legacy.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import Icon from '../lib/components/Icon.svelte.js';
import ExternalClients from '../lib/components/ExternalClients.svelte.js';

var root_1 = $.from_html(`<div class="note"><!><span>No ready models are exposed yet. Keep browsing; login screens and ordinary websites are never published as providers. Open a model menu normally when its options are hidden.</span></div>`);
var root = $.from_html(`<section class="screen"><div class="screen-inner"><header class="screen-head"><div><div class="breadcrumb">Codemax / Harness</div><h1>Connect a client</h1><p>Choose your harness. Use the connection below once. Every model runs through its website session—not a provider API.</p></div><button class="secondary"><!>Manage providers</button></header> <div class="setup-strip"><span class="setup-step"><!><strong>1</strong> Browse & sign in</span><!><span class="setup-step"><!><strong>2</strong> Models detected automatically</span><!><span class="setup-step"><!><strong>3</strong> Connect your harness</span></div> <!> <!> <details class="advanced-client"><summary>Advanced · MCP versus model connections</summary><p>MCP connects tools to an assistant. A model-provider connection lets a harness use the website model as its model. Codemax keeps both paths separate; adding an MCP server alone does not replace a harness’s model.</p><p style="margin-top:12px">The registry updates live. A harness that caches or requires an explicit model list may need a refresh, restart, or an updated configuration export. Codemax does not secretly overwrite client configuration files.</p><button class="secondary" style="margin-top:16px">Manage website tools<!></button></details></div></section>`);

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

	var div_1 = $.sibling(header, 2);
	var span = $.child(div_1);
	var node_1 = $.child(span);

	Icon(node_1, { name: 'globe', size: 16 });
	$.next(2);
	$.reset(span);

	var node_2 = $.sibling(span);

	Icon(node_2, { name: 'arrow', size: 14 });

	var span_1 = $.sibling(node_2);
	var node_3 = $.child(span_1);

	Icon(node_3, { name: 'scan', size: 16 });
	$.next(2);
	$.reset(span_1);

	var node_4 = $.sibling(span_1);

	Icon(node_4, { name: 'arrow', size: 14 });

	var span_2 = $.sibling(node_4);
	var node_5 = $.child(span_2);

	Icon(node_5, { name: 'terminal', size: 16 });
	$.next(2);
	$.reset(span_2);
	$.reset(div_1);

	var node_6 = $.sibling(div_1, 2);

	{
		var consequent = ($$anchor) => {
			var div_2 = root_1();
			var node_7 = $.child(div_2);

			Icon(node_7, { name: 'scan', size: 17 });
			$.next();
			$.reset(div_2);
			$.append($$anchor, div_2);
		};

		$.if(node_6, ($$render) => {
			if (!app.exposedModels.length) $$render(consequent);
		});
	}

	var node_8 = $.sibling(node_6, 2);

	ExternalClients(node_8, {});

	var details = $.sibling(node_8, 2);
	var button_1 = $.sibling($.child(details), 3);

	button_1.__click = () => app.navigate('tools');

	var node_9 = $.sibling($.child(button_1));

	Icon(node_9, { name: 'arrow', size: 14 });
	$.reset(button_1);
	$.reset(details);
	$.reset(div);
	$.reset(section);
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click']);