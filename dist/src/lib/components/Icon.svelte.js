import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';

var root = $.from_svg(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path></path></svg>`);

export default function Icon($$anchor, $$props) {
	let size = $.prop($$props, 'size', 3, 18);

	const paths = {
		circle: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
		activity: 'M3 12h4l3-8 4 16 3-8h4',
		minimize: 'M5 12h14',
		maximize: 'M5 5h14v14H5z',
		chevron: 'm8 10 4 4 4-4',
		more: 'M5 12h.01M12 12h.01M19 12h.01',
		external: 'M14 3h7v7m0-7-11 11M10 3H3v18h18v-7',
		lock: 'M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3',
		eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Zm7 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z',
		download: 'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',
		upload: 'M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4',
		pin: 'm9 3 12 12-4 1-3 5-3-3-6 6m0-17 4-4ZM5 5 3 9l12 12',
		alert: 'm12 3 10 18H2L12 3Zm0 6v5m0 3h.01',
		home: 'm3 10 9-7 9 7v11h-6v-7H9v7H3V10Z',
		play: 'm7 4 14 8-14 8V4Z',
		trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
		sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z',
		moon: 'M20 14A9 9 0 0 1 10 3a9 9 0 1 0 10 11Z',
		monitor: 'M3 3h18v14H3zM8 21h8m-4-4v4',
		folder: 'M2 5h8l2 3h10v13H2V5Z',
		command: 'M8 8H5a3 3 0 1 1 3-3v14a3 3 0 1 1-3-3h14a3 3 0 1 1-3 3V5a3 3 0 1 1 3 3H8Z',
		grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
		globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
		layers: 'm12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5',
		terminal: 'm5 7 5 5-5 5m8 0h6M3 3h18v18H3z',
		history: 'M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v5l3 2',
		scan: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10m-5-5v10',
		settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2-5h4l1 3 3 1 3 3v4l-3 3-3 1-1 3h-4l-1-3-3-1-3-3v-4l3-3 3-1 1-3Z',
		plus: 'M12 5v14M5 12h14',
		close: 'm6 6 12 12M6 18 18 6',
		arrow: 'm9 5 7 7-7 7',
		back: 'm15 5-7 7 7 7',
		refresh: 'M20 7a8 8 0 1 0 1 8M20 3v5h-5',
		copy: 'M9 9h12v12H9zM15 9V3H3v12h6',
		shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',
		key: 'M14 7a4 4 0 1 1-2 7l-8 7H1v-3l8-8a4 4 0 0 1 5-3Z',
		search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6',
		pause: 'M8 5v14M16 5v14',
		stop: 'M5 5h14v14H5z',
		check: 'm5 12 4 4L19 6',
		panel: 'M3 3h18v18H3zM9 3v18',
		bolt: 'm13 2-9 12h7l-1 8 10-13h-7l1-7Z'
	};

	var svg = root();
	var path = $.child(svg);

	$.reset(svg);

	$.template_effect(() => {
		$.set_attribute(svg, 'width', size());
		$.set_attribute(svg, 'height', size());
		$.set_attribute(path, 'd', paths[$$props.name] ?? paths.grid);
	});

	$.append($$anchor, svg);
}