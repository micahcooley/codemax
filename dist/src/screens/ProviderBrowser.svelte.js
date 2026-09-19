import '../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import Icon from '../lib/components/Icon.svelte.js';
import BrowserPane from '../lib/components/BrowserPane.svelte.js';
import Inspector from '../lib/components/chrome/Inspector.svelte.js';

var root_3 = $.from_html(`<button><span class="workspace-logo"> </span><span><strong> </strong><small>Open website</small></span></button>`);
var root_2 = $.from_html(`<div class="empty-website"><div class="new-site-content"><div class="new-site-mark"><!><span class="label">Your browser. Your models.</span></div><h1>Open a website.<br/>Connect what’s already yours.</h1><p>Browse normally. Sign in to the AI websites you use. Codemax detects their models and makes only confirmed providers available to your harness.</p><form class="new-site-form"><!><input aria-label="Website to open" placeholder="Search or enter a website" autocomplete="url" spellcheck="false" maxlength="2048" required/><button class="primary" aria-label="Open website"><!></button></form><div class="site-shortcuts"></div><div class="start-footer"><!><span>Sign in on the website itself. Passwords, cookies, and authentication tokens stay in the provider’s isolated browser profile.</span></div></div></div>`);
var root_4 = $.from_html(`<div class="resize-handle" role="slider" tabindex="0" aria-label="Inspector width" aria-orientation="vertical" aria-valuemin="240" aria-valuemax="380"></div><!>`, 1);
var root = $.from_html(`<section class="browser-layout" aria-label="Website browser"><div class="provider-center"><!></div> <!></section>`);

export default function ProviderBrowser($$anchor, $$props) {
	$.push($$props, true);

	let url = $.state('');

	const shortcuts = [
		{ name: 'Z.ai', url: 'https://chat.z.ai', mark: 'Z' },
		{ name: 'Qwen', url: 'https://chat.qwen.ai', mark: 'Q' },
		{
			name: 'DeepSeek',
			url: 'https://chat.deepseek.com',
			mark: 'D'
		}
	];

	function resize(event) {
		const el = event.currentTarget;

		el.setPointerCapture(event.pointerId);

		const start = event.clientX,
			width = app.inspectorWidth;

		const move = (e) => {
			app.inspectorWidth = Math.max(240, Math.min(380, width + start - e.clientX));
		};

		const end = () => {
			el.removeEventListener('pointermove', move);
			el.removeEventListener('pointerup', end);
			el.removeEventListener('pointercancel', end);
			app.saveLayout();
		};

		el.addEventListener('pointermove', move);
		el.addEventListener('pointerup', end, { once: true });
		el.addEventListener('pointercancel', end, { once: true });
	}

	function resizeKey(event) {
		if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;

		event.preventDefault();
		app.inspectorWidth = Math.max(240, Math.min(380, app.inspectorWidth + (event.key === 'ArrowLeft' ? 16 : -16)));
		app.saveLayout();
	}

	var section = root();
	var div = $.child(section);
	var node = $.child(div);

	{
		var consequent = ($$anchor) => {
			BrowserPane($$anchor, {
				get provider() {
					return app.provider;
				}
			});
		};

		var alternate = ($$anchor) => {
			var div_1 = root_2();
			var div_2 = $.child(div_1);
			var div_3 = $.child(div_2);
			var node_1 = $.child(div_3);

			Icon(node_1, { name: 'globe', size: 26 });
			$.next();
			$.reset(div_3);

			var form = $.sibling(div_3, 3);
			var node_2 = $.child(form);

			Icon(node_2, { name: 'search', size: 18 });

			var input = $.sibling(node_2);

			$.remove_input_defaults(input);

			var button = $.sibling(input);
			var node_3 = $.child(button);

			Icon(node_3, { name: 'arrow', size: 17 });
			$.reset(button);
			$.reset(form);

			var div_4 = $.sibling(form);

			$.each(div_4, 21, () => shortcuts, $.index, ($$anchor, site) => {
				var button_1 = root_3();

				button_1.__click = () => app.addWebsite($.get(site).url, $.get(site).name);

				var span = $.child(button_1);
				var text = $.child(span, true);

				$.reset(span);

				var span_1 = $.sibling(span);
				var strong = $.child(span_1);
				var text_1 = $.child(strong, true);

				$.reset(strong);
				$.next();
				$.reset(span_1);
				$.reset(button_1);

				$.template_effect(() => {
					button_1.disabled = !app.ready;
					$.set_text(text, $.get(site).mark);
					$.set_text(text_1, $.get(site).name);
				});

				$.append($$anchor, button_1);
			});

			$.reset(div_4);

			var div_5 = $.sibling(div_4);
			var node_4 = $.child(div_5);

			Icon(node_4, { name: 'shield', size: 16 });
			$.next();
			$.reset(div_5);
			$.reset(div_2);
			$.reset(div_1);
			$.template_effect(($0) => button.disabled = $0, [() => !app.ready || !$.get(url).trim()]);

			$.event('submit', form, (event) => {
				event.preventDefault();
				void app.addWebsite($.get(url));
			});

			$.bind_value(input, () => $.get(url), ($$value) => $.set(url, $$value));
			$.append($$anchor, div_1);
		};

		$.if(node, ($$render) => {
			if (app.provider) $$render(consequent); else $$render(alternate, false);
		});
	}

	$.reset(div);

	var node_5 = $.sibling(div, 2);

	{
		var consequent_1 = ($$anchor) => {
			var fragment_1 = root_4();
			var div_6 = $.first_child(fragment_1);

			div_6.__pointerdown = resize;
			div_6.__keydown = resizeKey;

			var node_6 = $.sibling(div_6);

			Inspector(node_6, {});
			$.template_effect(() => $.set_attribute(div_6, 'aria-valuenow', app.inspectorWidth));
			$.append($$anchor, fragment_1);
		};

		$.if(node_5, ($$render) => {
			if (app.inspectorVisible) $$render(consequent_1);
		});
	}

	$.reset(section);
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click', 'pointerdown', 'keydown']);