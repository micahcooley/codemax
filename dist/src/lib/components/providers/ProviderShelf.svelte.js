import '../../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../../runtime/svelte_internal_client.js';
import { app } from '../../state/app.svelte.js';
import Icon from '../Icon.svelte.js';
import TabActivity from '../TabActivity.svelte.js';
import Favicon from '../Favicon.svelte.js';
import { providerText } from '../../format.js';

var root = $.from_html(`<div><button class="shelf-open"><span class="shelf-monogram" aria-hidden="true"><!></span><span class="shelf-name"> </span><!></button> <button class="shelf-settings"><!></button></div>`);
var root_1 = $.from_html(`<p class="shelf-empty">Visit an AI chat website.<br/>It appears here when recognized.</p>`);
var root_2 = $.from_html(`<aside class="provider-shelf" id="registered-providers" aria-label="Registered providers"><div class="shelf-heading"><span>Providers</span><button class="icon-button" aria-label="Provider settings" title="Manage registered providers"><!></button></div> <nav class="shelf-list" aria-label="Registered website shortcuts"><!> <!></nav> <div class="shelf-bottom"><button class="shelf-action"><!>Browse a website</button></div></aside>`);

export default function ProviderShelf($$anchor, $$props) {
	$.push($$props, true);

	const sites = $.derived(() => app.detectedProviders);

	function manage(id) {
		app.providerSelection = id;
		app.navigate('providers');
	}

	var aside = root_2();
	var div = $.child(aside);
	var button = $.sibling($.child(div));
	var node = $.child(button);

	Icon(node, { name: 'settings', size: 14 });
	$.reset(button);
	$.reset(div);

	var nav = $.sibling(div, 2);
	var node_1 = $.child(nav);

	$.each(node_1, 17, () => $.get(sites), (site) => site.id, ($$anchor, site) => {
		var div_1 = root();
		let classes;
		var button_1 = $.child(div_1);
		var span = $.child(button_1);
		var node_2 = $.child(span);

		Favicon(node_2, {
			get origin() {
				return $.get(site).origin;
			},

			get label() {
				return $.get(site).label;
			},
			size: 16
		});

		$.reset(span);

		var span_1 = $.sibling(span);
		var text = $.only_child(span_1, true);
		var node_3 = $.sibling(span_1);

		{
			let $0 = $.derived(() => app.loading[$.get(site).id] === true);

			TabActivity(node_3, {
				get provider() {
					return $.get(site);
				},

				get loading() {
					return $.get($0);
				},

				get online() {
					return app.ready;
				}
			});
		}

		$.reset(button_1);

		var button_2 = $.sibling(button_1, 2);
		var node_4 = $.child(button_2);

		Icon(node_4, { name: 'more', size: 14 });
		$.reset(button_2);
		$.reset(div_1);

		$.template_effect(
			($0) => {
				classes = $.set_class(div_1, 1, 'shelf-row', null, classes, {
					current: app.route === 'browser'
						? app.selectedProvider === $.get(site).id
						: app.route === 'providers' && (app.providerSelection ?? app.selectedProvider ?? $.get(sites)[0]?.id) === $.get(site).id
				});

				$.set_attribute(button_1, 'aria-label', `Open registered provider ${$.get(site).label}`);
				$.set_attribute(button_1, 'title', $0);
				button_1.disabled = !app.ready;
				$.set_text(text, $.get(site).label);
				$.set_attribute(button_2, 'aria-label', `Settings for ${$.get(site).label}`);
				$.set_attribute(button_2, 'title', `Settings for ${$.get(site).label}`);
			},
			[
				() => `${$.get(site).label} · ${$.get(site).origin}\n${!app.ready
					? 'Last known state'
					: !$.get(site).exposed ? 'Not shared with clients' : providerText($.get(site))}`
			]
		);

		$.delegated('click', button_1, () => app.openProvider($.get(site).id));
		$.delegated('click', button_2, () => manage($.get(site).id));
		$.append($$anchor, div_1);
	});

	var node_5 = $.sibling(node_1, 2);

	{
		var consequent = ($$anchor) => {
			var p = root_1();

			$.append($$anchor, p);
		};

		$.if(node_5, ($$render) => {
			if (!$.get(sites).length) $$render(consequent);
		});
	}

	$.reset(nav);

	var div_2 = $.sibling(nav, 2);
	var button_3 = $.child(div_2);
	var node_6 = $.child(button_3);

	Icon(node_6, { name: 'plus', size: 15 });
	$.next();
	$.reset(button_3);
	$.reset(div_2);
	$.reset(aside);
	$.delegated('click', button, () => app.navigate('providers'));
	$.delegated('click', button_3, () => app.newTab());
	$.append($$anchor, aside);
	$.pop();
}

$.delegate(['click']);