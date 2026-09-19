import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';

var root_1 = $.from_html(`<span class="activity-mark">!</span>`);
var root = $.from_html(`<span role="img"><span class="activity-ring"></span><!></span>`);

export default function TabActivity($$anchor, $$props) {
	$.push($$props, true);

	let loading = $.prop($$props, 'loading', 3, false),
		online = $.prop($$props, 'online', 3, true);

	const warning = $.derived(() => ['LOGIN_REQUIRED', 'RATE_LIMITED', 'BROKEN_MAPPING'].includes($$props.provider.state));
	const working = $.derived(() => online() && $$props.provider.open_tab && !$.get(warning) && ($$props.provider.active || $$props.provider.browser_busy || loading() || ['LOADING', 'REDISCOVERING'].includes($$props.provider.state)));

	const label = $.derived(() => !online()
		? 'Offline'
		: $.get(warning)
			? $$props.provider.state === 'LOGIN_REQUIRED'
				? 'Sign-in required'
				: $$props.provider.state === 'RATE_LIMITED'
					? 'Website limit reached'
					: 'Connection needs attention'
			: $$props.provider.active || $$props.provider.browser_busy
				? 'Generating'
				: loading() || $$props.provider.state === 'LOADING'
					? 'Loading'
					: $.get(working)
						? 'Discovering controls'
						: $$props.provider.state === 'DISCOVERING'
							? 'Needs control mapping'
							: $$props.provider.open_tab && $$props.provider.state === 'READY' ? 'Idle' : 'Sleeping');

	var span = root();
	let classes;
	var node = $.sibling($.child(span));

	{
		var consequent = ($$anchor) => {
			var span_1 = root_1();

			$.append($$anchor, span_1);
		};

		$.if(node, ($$render) => {
			if ($.get(warning)) $$render(consequent);
		});
	}

	$.reset(span);

	$.template_effect(() => {
		classes = $.set_class(span, 1, 'tab-activity', null, classes, { working: $.get(working), warning: $.get(warning) });
		$.set_attribute(span, 'title', $.get(label));
		$.set_attribute(span, 'aria-label', `${$$props.provider.label}: ${$.get(label)}`);
		$.set_attribute(span, 'data-state', $.get(working) ? 'working' : $.get(warning) ? 'attention' : 'idle');
	});

	$.append($$anchor, span);
	$.pop();
}