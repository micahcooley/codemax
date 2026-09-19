import '../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../runtime/svelte_internal_client.js';
import { app } from '../state/app.svelte.js';
import Icon from './Icon.svelte.js';

var root_1 = $.from_html(`<option> </option>`);
var root_2 = $.from_html(`<div class="note"><!><span><strong> </strong> <br/>Only the exact selected website model is used. Tests do not fall back to another model.</span></div>`);
var root_3 = $.from_html(`<button class="primary" style="margin-top:20px"><!> </button>`);
var root_5 = $.from_html(`<p class="field-hint" style="margin-top:12px">Allowing sends this synthetic file’s contents to the selected website. The grant permits one read, expires after five minutes, and is revoked after use or restart. No write or command permission is included.</p><div class="button-group" style="margin-top:16px"><button class="primary"><!>Allow one read and run</button><button class="secondary">Deny</button></div>`, 1);
var root_7 = $.from_html(`<span class="spinner"></span>`);
var root_9 = $.from_html(`<span class="spinner"></span>`);
var root_11 = $.from_html(`<div class="note" role="status"><!><span> </span></div>`);
var root_12 = $.from_html(`<button class="secondary" style="margin-top:14px"><!>Cancel and revoke</button>`);
var root_13 = $.from_html(`<p class="field-hint" style="margin-top:12px"> </p>`);
var root_6 = $.from_html(`<div aria-live="polite" style="margin-top:14px"><div class="proof-step done"><!>Synthetic file created locally</div><div><!>Model tool request → permission check → file read</div><div><!>Tool result → website response → exact-value verification</div></div> <!> <!>`, 1);
var root_4 = $.from_html(`<div class="note" style="margin-top:20px"><!><div><strong> </strong><span class="probe-path"> </span><span> </span></div></div> <!>`, 1);
var root = $.from_html(`<div class="file-probe-panel"><div><header class="screen-head"><div><div class="breadcrumb">Workspace / Website clients</div><h2>File permission diagnostic</h2><p>Use your website session and its quota. No provider API key. No paid API connection.</p></div><button class="secondary"><!>Open Z.ai</button></header> <div class="split"><div><div class="website-client-head"><span class="source-mark"><!></span><div><h2>Website access</h2><p>Messages run in the website tab you can see. Login and limits belong to that website.</p></div></div> <section class="section"><label class="field"><span>Website model</span><select aria-label="Website test model"><option> </option><!></select></label> <!> <p class="field-hint" style="margin-top:12px">For Z.ai, open the model menu and select GLM-5.3-Flash. If discovery needs help, record the controls in Detector. Model names are not silently substituted.</p> <div class="button-group" style="margin-top:16px"><button class="secondary"><!>View website tab</button><button class="text-button">Inspect controls<!></button></div></section> <section class="section" aria-label="Local filesystem test"><div class="section-title"><h2>Test the local tool connection</h2><span class="tag">Read-only · one file</span></div> <p>Bridge creates a harmless file with a random value on this machine. The model must request <code>read_file</code>; the local client checks your permission, reads it, and returns the result. The final answer must match the value.</p> <p class="field-hint" style="margin-top:10px">The website never gets a filesystem API. This test uses two normal website turns and does not touch your project files. End an existing client session on this website before testing.</p> <!> <!></section></div><aside><section class="section"><div class="section-title"><h2>Permission boundary</h2><!></div><table class="permission-table"><tbody><tr><td>Website → local files</td><td>Denied</td></tr><tr><td>Local probe file</td><td> </td></tr><tr><td>Project / home directory</td><td>Not granted</td></tr><tr><td>File writes / deletion</td><td>Denied</td></tr><tr><td>Shell commands</td><td>Denied</td></tr><tr><td>Access after restart</td><td>Revoked</td></tr></tbody></table><p class="field-hint" style="margin-top:16px">This policy controls the built-in test client. External coding tools enforce their own project, file, and command permissions; Bridge does not override them.</p></section> <section class="section"><h3>Read the tab ring</h3><div class="proof-step"><span class="tab-activity working" aria-hidden="true"><span class="activity-ring"></span></span>Spinning: loading, discovering, or generating</div><div class="proof-step"><span class="tab-activity" aria-hidden="true"><span class="activity-ring"></span></span>Stationary: idle or sleeping</div><p class="field-hint" style="margin-top:10px">Hover for the exact state. Sign-in, rate limits, and errors stop the ring. Reduced-motion mode keeps the busy ring still and uses its label.</p></section> <section class="section"><h3>Two different connections</h3><p style="margin-top:12px"><strong>Website:</strong> your normal chat session and website quota.</p><p style="margin-top:12px"><strong>Coding client:</strong> a local tool talking to Bridge. The loopback address and token in Connect a client protect that local connection, not a provider API.</p></section></aside></div></div></div>`);

export default function FileProbe($$anchor, $$props) {
	$.push($$props, true);

	let selected = $.state('');
	const model = $.derived(() => app.exposedModels.find((m) => m.id === $.get(selected)) || app.exposedModels.find((m) => m.display_name.toLowerCase().replaceAll(' ', '-') === 'glm-5.3-flash') || app.exposedModels.find((m) => m.id === app.preferences.default_model) || app.exposedModels[0]);
	const probe = $.derived(() => app.snapshot?.file_probe);
	const busy = $.derived(() => $.get(probe)?.state === 'WAITING_FOR_TOOL' || $.get(probe)?.state === 'WAITING_FOR_REPLY');
	const needsPermission = $.derived(() => $.get(probe)?.state === 'PERMISSION_REQUIRED');
	const canPrepare = $.derived(() => app.ready && !!$.get(model) && $.get(model).provider.state === 'READY' && !$.get(model).provider.active && !$.get(model).provider.browser_busy && !$.get(busy));
	const boundModel = $.derived(() => app.exposedModels.find((m) => m.id === $.get(probe)?.model));

	async function prepare() {
		if ($.get(model)) await app.perform('filesystem.prepare', {
			provider_id: $.get(model).provider.id,
			model: $.get(model).id
		});
	}

	async function allow() {
		if ($.get(probe)) await app.perform('filesystem.allow', { test_id: $.get(probe).id, confirmed: true });
	}

	async function revoke() {
		if ($.get(probe)) await app.perform('filesystem.revoke', { test_id: $.get(probe).id });
	}

	var div = root();
	var div_1 = $.child(div);
	var header = $.child(div_1);
	var button = $.sibling($.child(header));

	button.__click = () => app.addWebsite('https://chat.z.ai/', 'Z.ai');

	var node = $.child(button);

	Icon(node, { name: 'globe', size: 15 });
	$.next();
	$.reset(button);
	$.reset(header);

	var div_2 = $.sibling(header, 2);
	var div_3 = $.child(div_2);
	var div_4 = $.child(div_3);
	var span = $.child(div_4);
	var node_1 = $.child(span);

	Icon(node_1, { name: 'globe', size: 22 });
	$.reset(span);
	$.next();
	$.reset(div_4);

	var section = $.sibling(div_4, 2);
	var label = $.child(section);
	var select = $.sibling($.child(label));
	var option = $.child(select);
	var text = $.child(option, true);

	$.reset(option);
	option.value = option.__value = '';

	var node_2 = $.sibling(option);

	$.each(node_2, 17, () => app.exposedModels, (m) => m.id, ($$anchor, m) => {
		var option_1 = root_1();
		var text_1 = $.child(option_1);

		$.reset(option_1);

		var option_1_value = {};

		$.template_effect(() => {
			$.set_text(text_1, `${$.get(m).provider.label ?? ''} / ${$.get(m).display_name ?? ''}`);

			if (option_1_value !== (option_1_value = $.get(m).id)) {
				option_1.value = (option_1.__value = $.get(m).id) ?? '';
			}
		});

		$.append($$anchor, option_1);
	});

	$.reset(select);
	$.reset(label);

	var node_3 = $.sibling(label, 2);

	{
		var consequent = ($$anchor) => {
			var div_5 = root_2();
			var node_4 = $.child(div_5);

			Icon(node_4, { name: 'shield', size: 15 });

			var span_1 = $.sibling(node_4);
			var strong = $.child(span_1);
			var text_2 = $.child(strong, true);

			$.reset(strong);

			var text_3 = $.sibling(strong);

			$.next(2);
			$.reset(span_1);
			$.reset(div_5);

			$.template_effect(() => {
				$.set_text(text_2, $.get(model).provider.label);
				$.set_text(text_3, ` · ${$.get(model).provider.origin ?? ''}`);
			});

			$.append($$anchor, div_5);
		};

		$.if(node_3, ($$render) => {
			if ($.get(model)) $$render(consequent);
		});
	}

	var div_6 = $.sibling(node_3, 4);
	var button_1 = $.child(div_6);

	button_1.__click = () => $.get(model) && app.openProvider($.get(model).provider.id);

	var node_5 = $.child(button_1);

	Icon(node_5, { name: 'globe', size: 14 });
	$.next();
	$.reset(button_1);

	var button_2 = $.sibling(button_1);

	button_2.__click = () => app.navigate('detector');

	var node_6 = $.sibling($.child(button_2));

	Icon(node_6, { name: 'arrow', size: 13 });
	$.reset(button_2);
	$.reset(div_6);
	$.reset(section);

	var section_1 = $.sibling(section, 2);
	var node_7 = $.sibling($.child(section_1), 6);

	{
		var consequent_1 = ($$anchor) => {
			var button_3 = root_3();

			button_3.__click = prepare;

			var node_8 = $.child(button_3);

			Icon(node_8, { name: 'folder', size: 15 });

			var text_4 = $.sibling(node_8, 1, true);

			$.reset(button_3);

			$.template_effect(() => {
				button_3.disabled = !$.get(canPrepare) || app.pending > 0;
				$.set_text(text_4, $.get(probe)?.state === 'PASSED' ? 'Prepare another file test' : 'Prepare file test');
			});

			$.append($$anchor, button_3);
		};

		$.if(node_7, ($$render) => {
			if (!$.get(probe) || ['IDLE', 'PASSED', 'FAILED', 'REVOKED'].includes($.get(probe).state)) $$render(consequent_1);
		});
	}

	var node_9 = $.sibling(node_7, 2);

	{
		var consequent_7 = ($$anchor) => {
			var fragment = root_4();
			var div_7 = $.first_child(fragment);
			var node_10 = $.child(div_7);

			Icon(node_10, { name: 'shield', size: 17 });

			var div_8 = $.sibling(node_10);
			var strong_1 = $.child(div_8);
			var text_5 = $.child(strong_1, true);

			$.reset(strong_1);

			var span_2 = $.sibling(strong_1);
			var text_6 = $.child(span_2, true);

			$.reset(span_2);

			var span_3 = $.sibling(span_2);
			var text_7 = $.child(span_3);

			$.reset(span_3);
			$.reset(div_8);
			$.reset(div_7);

			var node_11 = $.sibling(div_7, 2);

			{
				var consequent_2 = ($$anchor) => {
					var fragment_1 = root_5();
					var div_9 = $.sibling($.first_child(fragment_1));
					var button_4 = $.child(div_9);

					button_4.__click = allow;

					var node_12 = $.child(button_4);

					Icon(node_12, { name: 'shield', size: 14 });
					$.next();
					$.reset(button_4);

					var button_5 = $.sibling(button_4);

					button_5.__click = revoke;
					$.reset(div_9);
					$.template_effect(() => button_4.disabled = app.pending > 0);
					$.append($$anchor, fragment_1);
				};

				var alternate_3 = ($$anchor) => {
					var fragment_2 = root_6();
					var div_10 = $.first_child(fragment_2);
					var div_11 = $.child(div_10);
					var node_13 = $.child(div_11);

					Icon(node_13, { name: 'check', size: 14 });
					$.next();
					$.reset(div_11);

					var div_12 = $.sibling(div_11);
					let classes;
					var node_14 = $.child(div_12);

					{
						var consequent_3 = ($$anchor) => {
							var span_4 = root_7();

							$.append($$anchor, span_4);
						};

						var alternate = ($$anchor) => {
							{
								let $0 = $.derived(() => $.get(probe).read_count === 1 ? 'check' : 'circle');

								Icon($$anchor, {
									get name() {
										return $.get($0);
									},
									size: 14
								});
							}
						};

						$.if(node_14, ($$render) => {
							if ($.get(probe).state === 'WAITING_FOR_TOOL') $$render(consequent_3); else $$render(alternate, false);
						});
					}

					$.next();
					$.reset(div_12);

					var div_13 = $.sibling(div_12);
					let classes_1;
					var node_15 = $.child(div_13);

					{
						var consequent_4 = ($$anchor) => {
							var span_5 = root_9();

							$.append($$anchor, span_5);
						};

						var alternate_1 = ($$anchor) => {
							{
								let $0 = $.derived(() => $.get(probe).proof_verified ? 'check' : 'circle');

								Icon($$anchor, {
									get name() {
										return $.get($0);
									},
									size: 14
								});
							}
						};

						$.if(node_15, ($$render) => {
							if ($.get(probe).state === 'WAITING_FOR_REPLY') $$render(consequent_4); else $$render(alternate_1, false);
						});
					}

					$.next();
					$.reset(div_13);
					$.reset(div_10);

					var node_16 = $.sibling(div_10, 2);

					{
						var consequent_5 = ($$anchor) => {
							var div_14 = root_11();
							var node_17 = $.child(div_14);

							Icon(node_17, { name: 'alert', size: 15 });

							var span_6 = $.sibling(node_17);
							var text_8 = $.child(span_6);

							$.reset(span_6);
							$.reset(div_14);
							$.template_effect(($0) => $.set_text(text_8, `${$0 ?? ''}. A model claiming it read a file does not count as a pass.`), [() => $.get(probe).error.replaceAll('_', ' ')]);
							$.append($$anchor, div_14);
						};

						$.if(node_16, ($$render) => {
							if ($.get(probe).error) $$render(consequent_5);
						});
					}

					var node_18 = $.sibling(node_16, 2);

					{
						var consequent_6 = ($$anchor) => {
							var button_6 = root_12();

							button_6.__click = revoke;

							var node_19 = $.child(button_6);

							Icon(node_19, { name: 'stop', size: 14 });
							$.next();
							$.reset(button_6);
							$.append($$anchor, button_6);
						};

						var alternate_2 = ($$anchor) => {
							var p = root_13();
							var text_9 = $.child(p);

							$.reset(p);

							$.template_effect(() => $.set_text(text_9, `${$.get(probe).read_count ?? ''} permitted reads · ${$.get(probe).denied_count ?? ''} denied attempts. Permission is inactive. ${$.get(probe).file_removed
								? 'The synthetic file is removed.'
								: 'Synthetic file cleanup could not be confirmed.'}`));

							$.append($$anchor, p);
						};

						$.if(node_18, ($$render) => {
							if ($.get(busy)) $$render(consequent_6); else $$render(alternate_2, false);
						});
					}

					$.template_effect(() => {
						classes = $.set_class(div_12, 1, 'proof-step', null, classes, { done: $.get(probe).read_count === 1 });
						classes_1 = $.set_class(div_13, 1, 'proof-step', null, classes_1, { done: $.get(probe).proof_verified });
					});

					$.append($$anchor, fragment_2);
				};

				$.if(node_11, ($$render) => {
					if ($.get(needsPermission)) $$render(consequent_2); else $$render(alternate_3, false);
				});
			}

			$.template_effect(() => {
				$.set_text(text_5, $.get(needsPermission)
					? 'Allow this exact read?'
					: $.get(probe).state === 'PASSED'
						? 'File contents verified'
						: $.get(probe).state === 'FAILED'
							? 'Test did not pass'
							: $.get(probe).state === 'REVOKED'
								? 'Permission revoked'
								: 'Permissioned test in progress');

				$.set_text(text_6, $.get(probe).path);
				$.set_text(text_7, `${($.get(boundModel)?.provider.label || 'Website') ?? ''} / ${($.get(boundModel)?.display_name || $.get(probe).model) ?? ''}`);
			});

			$.append($$anchor, fragment);
		};

		$.if(node_9, ($$render) => {
			if ($.get(probe) && $.get(probe).state !== 'IDLE') $$render(consequent_7);
		});
	}

	$.reset(section_1);
	$.reset(div_3);

	var aside = $.sibling(div_3);
	var section_2 = $.child(aside);
	var div_15 = $.child(section_2);
	var node_20 = $.sibling($.child(div_15));

	Icon(node_20, { name: 'shield', size: 15 });
	$.reset(div_15);

	var table = $.sibling(div_15);
	var tbody = $.child(table);
	var tr = $.sibling($.child(tbody));
	var td = $.sibling($.child(tr));
	var text_10 = $.child(td, true);

	$.reset(td);
	$.reset(tr);
	$.next(4);
	$.reset(tbody);
	$.reset(table);
	$.next();
	$.reset(section_2);
	$.next(4);
	$.reset(aside);
	$.reset(div_2);
	$.reset(div_1);
	$.reset(div);

	$.template_effect(() => {
		button.disabled = !app.ready;
		select.disabled = !app.exposedModels.length || $.get(busy) || $.get(needsPermission);

		$.set_text(text, $.get(model)
			? `${$.get(model).provider.label} / ${$.get(model).display_name}`
			: 'Open a website to discover models');

		button_1.disabled = !$.get(model);
		$.set_text(text_10, $.get(probe)?.granted ? 'One read allowed' : 'Ask first');
	});

	$.bind_select_value(select, () => $.get(selected), ($$value) => $.set(selected, $$value));
	$.append($$anchor, div);
	$.pop();
}

$.delegate(['click']);