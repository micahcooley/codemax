import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';
import { onMount } from '../../../runtime/svelte_svelte.js';
import { app } from '../state/app.svelte.js';
import * as bridge from '../api/bridge.js';
import Icon from './Icon.svelte.js';

var root = $.from_html(`<!><h2>Reconnect the browser</h2><p>The native host or Zag gateway is not connected. Your website profile is preserved.</p><button class="secondary">Open runtime settings</button>`, 1);
var root_1 = $.from_html(`<!><h2> </h2><p>Close the menu to return to the website. Its session stays connected.</p>`, 1);
var root_2 = $.from_html(`<div class="spinner"></div><h2> </h2><p>The website opens here in its own persistent, native browser view.</p><button class="text-button"><!>Reopen website</button>`, 1);
var root_3 = $.from_html(`<div class="browser-surface"><div class="browser-awaiting"><!></div></div>`);

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

			// Snap to the device-pixel grid so Retina (DPR 2) live-resizes don't spam
			// the native host with sub-pixel rects. Every measurement is sent: popups
			// and route changes also hide the surface out-of-band (hideProviders),
			// so skipping "unchanged" rects here can stick on a stale send. The
			// native host owns no-op suppression (it tracks placed/shown per view).
			const dpr = window.devicePixelRatio || 1;

			const snap = (v) => Math.round(v * dpr) / dpr;

			void bridge.position({
				provider_id: $$props.provider.id,
				x: snap(r.x),
				y: snap(r.y),
				width: snap(r.width),
				height: snap(r.height),
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

	var div = root_3();
	var div_1 = $.child(div);
	var node = $.child(div_1);

	{
		var consequent = ($$anchor) => {
			var fragment = root();
			var node_1 = $.first_child(fragment);

			Icon(node_1, { name: 'globe', size: 27 });

			var button = $.sibling(node_1, 3);

			$.delegated('click', button, () => app.settingsPage('runtime'));
			$.append($$anchor, fragment);
		};

		var consequent_1 = ($$anchor) => {
			var fragment_1 = root_1();
			var node_2 = $.first_child(fragment_1);

			Icon(node_2, { name: 'globe', size: 27 });

			var h2 = $.sibling(node_2);
			var text = $.only_child(h2);

			$.next();
			$.template_effect(() => $.set_text(text, `${$$props.provider.label ?? ''} is still open`));
			$.append($$anchor, fragment_1);
		};

		var alternate = ($$anchor) => {
			var fragment_2 = root_2();
			var h2_1 = $.sibling($.first_child(fragment_2));
			var text_1 = $.only_child(h2_1);
			var button_1 = $.sibling(h2_1, 2);
			var node_3 = $.child(button_1);

			Icon(node_3, { name: 'refresh', size: 14 });
			$.next();
			$.reset(button_1);
			$.template_effect(() => $.set_text(text_1, `Opening ${$$props.provider.label ?? ''}`));
			$.delegated('click', button_1, () => app.openProvider($$props.provider.id));
			$.append($$anchor, fragment_2);
		};

		$.if(node, ($$render) => {
			if (!app.ready) $$render(consequent); else if (app.popup) $$render(consequent_1, 1); else $$render(alternate, -1);
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