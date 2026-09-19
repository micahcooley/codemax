import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';
import { onMount } from '../../../runtime/svelte_svelte.js';
import { app } from '../state/app.svelte.js';
import * as bridge from '../api/bridge.js';
import Icon from './Icon.svelte.js';

var root_1 = $.from_html(`<!><h2>Reconnect the browser</h2><p>The native host or Zag gateway is not connected. Your website profile is preserved.</p><button class="secondary">Open runtime settings</button>`, 1);
var root_2 = $.from_html(`<div class="spinner"></div><h2> </h2><p>The website opens here in its own persistent, native browser view.</p><button class="text-button"><!>Reopen website</button>`, 1);
var root = $.from_html(`<div class="browser-surface"><div class="browser-awaiting"><!></div></div>`);

export default function BrowserPane($$anchor, $$props) {
	$.push($$props, true);

	let element;
	let mounted = $.state(false);
	let frame = 0;
	let disposed = false;

	function measure() {
		cancelAnimationFrame(frame);

		frame = requestAnimationFrame(() => {
			if (disposed || !element) return;

			const r = element.getBoundingClientRect();

			void bridge.position({
				provider_id: $$props.provider.id,
				x: r.x,
				y: r.y,
				width: r.width,
				height: r.height,
				visible: app.route === 'browser' && app.popup === null && app.ready && r.width > 1 && r.height > 1
			}).catch((error) => {
				app.error = String(error);
			});
		});
	}

	onMount(() => {
		$.set(mounted, true);

		const observer = new ResizeObserver(measure);

		observer.observe(element);
		window.addEventListener('resize', measure);
		measure();

		return () => {
			disposed = true;
			observer.disconnect();
			window.removeEventListener('resize', measure);
			cancelAnimationFrame(frame);
			void bridge.hideProviders().catch(() => {});
		};
	});

	$.user_effect(() => {
		void $$props.provider;
		void app.popup;
		void app.ready;
		void app.error;
		void app.notification;
		void app.findVisible;
		void app.liveOrigins;

		if ($.get(mounted)) measure();
	});

	var div = root();
	var div_1 = $.child(div);
	var node = $.child(div_1);

	{
		var consequent = ($$anchor) => {
			var fragment = root_1();
			var node_1 = $.first_child(fragment);

			Icon(node_1, { name: 'globe', size: 27 });

			var button = $.sibling(node_1, 3);

			button.__click = () => app.navigate('settings');
			$.append($$anchor, fragment);
		};

		var alternate = ($$anchor) => {
			var fragment_1 = root_2();
			var h2 = $.sibling($.first_child(fragment_1));
			var text = $.child(h2);

			$.reset(h2);

			var button_1 = $.sibling(h2, 2);

			button_1.__click = () => app.openProvider($$props.provider.id);

			var node_2 = $.child(button_1);

			Icon(node_2, { name: 'refresh', size: 14 });
			$.next();
			$.reset(button_1);
			$.template_effect(() => $.set_text(text, `Opening ${$$props.provider.label ?? ''}`));
			$.append($$anchor, fragment_1);
		};

		$.if(node, ($$render) => {
			if (!app.ready) $$render(consequent); else $$render(alternate, false);
		});
	}

	$.reset(div_1);
	$.reset(div);
	$.bind_this(div, ($$value) => element = $$value, () => element);
	$.template_effect(() => $.set_attribute(div, 'data-native-surface', $$props.provider.id));
	$.append($$anchor, div);
	$.pop();
}

$.delegate(['click']);