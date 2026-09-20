import '../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../runtime/svelte_internal_client.js';
import { app } from '../lib/state/app.svelte.js';
import * as bridge from '../lib/api/bridge.js';
import { initials, providerText } from '../lib/format.js';
import Icon from '../lib/components/Icon.svelte.js';

var root_1 = $.from_html(`<button> </button>`);
var root_3 = $.from_html(`<button><!> </button>`);
var root_2 = $.from_html(`<section class="section"><h2>Appearance</h2><div class="setting-row"><div><strong>Color theme</strong><p>Use a light workspace, a dark workspace, or follow your system.</p></div><div class="segmented"></div></div><div class="setting-row"><div><strong>Compact density</strong><p>Reduce spacing in tables and settings.</p></div><button class="toggle" role="switch" aria-label="Compact density"></button></div><div class="setting-row"><div><strong>Connection inspector</strong><p>Show mappings and session details beside the website.</p></div><button class="toggle" role="switch" aria-label="Connection inspector"></button></div></section><section class="section"><h2>Startup & tabs</h2><div class="setting-row"><div><strong>Restore website tabs</strong><p>Reopen your previous website tabs when the application starts. Their isolated login profiles are retained either way.</p></div><button class="toggle" role="switch" aria-label="Restore website tabs"></button></div><div class="setting-row"><div><strong>Launch at login</strong><p>Register this application in your Linux desktop’s user autostart directory.</p></div><button class="toggle" role="switch" aria-label="Launch at login"></button></div><div class="setting-row"><div><strong>Sleep inactive websites</strong><p>Unload idle background webviews. Active requests, the current tab, and pinned websites stay awake.</p></div><select aria-label="Idle website timeout"><option>Never</option><option>After 5 minutes</option><option>After 15 minutes</option><option>After 30 minutes</option><option>After 1 hour</option><option>After 2 hours</option></select></div></section>`, 1);
var root_6 = $.from_html(`<option> </option>`);
var root_7 = $.from_html(`<option> </option>`);
var root_5 = $.from_html(`<section class="section"><h2>Local gateway</h2><div class="setting-row"><div><strong>Accept client connections</strong><p>Stop cancels active inference and closes the local HTTP listener. The desktop browser remains usable.</p></div><button class="toggle" role="switch" aria-label="Accept client connections"></button></div><div class="setting-row"><div><strong>Listening port</strong><p>Only 127.0.0.1 is allowed. Changing ports preserves existing requests until they finish.</p></div><form class="inline"><input type="number" aria-label="Gateway port" min="1024" max="65535" required/><button class="secondary">Apply</button></form></div><div class="setting-row"><div><strong>Local API key</strong><p>Regeneration revokes the old key and terminates connected clients. Website credentials are unaffected.</p></div><button class="secondary"><!>Regenerate</button></div><div class="setting-row"><div><strong>Default model alias</strong><p>Requests for <code>bridge/default</code> route to this explicitly selected model.</p></div><select aria-label="Default gateway model"><option>No default selected</option><!></select></div></section> <section class="section"><h2>Explicit fallback</h2><div class="setting-row"><div><strong>Fallback model</strong><p>Choose another available model for new sessions only. Existing conversations are never silently moved between websites.</p></div><select aria-label="Fallback model"><option>No fallback selected</option><!></select></div><div class="setting-row"><div><strong>Allow fallback before dispatch</strong><p>Only before a prompt is submitted, when the selected website reports a limit or is unavailable. No retry after generation begins.</p></div><button class="toggle" role="switch" aria-label="Allow fallback"></button></div><div class="note"><!><span>Fallback follows your explicit routing policy; it does not bypass a provider’s quota or create additional accounts.</span></div></section>`, 1);
var root_10 = $.from_html(`<option> </option>`);
var root_11 = $.from_html(`<div class="setting-row"><div><strong>Display name</strong><p> </p></div><input aria-label="Website display name" maxlength="120"/></div><div class="setting-row"><div><strong>Keep this website awake</strong><p>Pinned profiles are excluded from idle suspension.</p></div><button class="toggle" role="switch" aria-label="Keep website awake"></button></div><div class="setting-row"><div><strong>Context window hint</strong><p>A user-supplied maximum used for conservative admission checks. Set 0 for unknown; it is never labeled as provider reported.</p></div><input type="number" aria-label="Context window hint" min="0" max="10000000"/></div><div class="setting-row"><div><strong>Reasoning selection</strong><p>Exact label or value of an observed reasoning option. Leave empty to preserve the website’s setting.</p></div><input aria-label="Reasoning option label" maxlength="160" placeholder="Website’s current setting"/></div><div class="setting-row"><div><strong>Clear local profile</strong><p>Delete this website’s local storage and sign out of this profile. Remote account data is not deleted.</p></div><button class="secondary">Clear storage</button></div><div class="setting-row"><div><strong>Remove website</strong><p>Remove the profile and connector from the workspace and end associated sessions.</p></div><button class="secondary danger-text">Remove</button></div>`, 1);
var root_12 = $.from_html(`<p>No website profiles have been added.</p>`);
var root_9 = $.from_html(`<section class="section"><div class="section-title"><h2>Website profiles</h2><button class="secondary"><!>Add website</button></div><label class="field"><span>Website</span><select aria-label="Website profile"><option>Choose a website</option><!></select></label><!></section>`);
var root_15 = $.from_html(`<option> </option>`);
var root_14 = $.from_html(`<section class="section"><h2>Privacy boundaries</h2><div class="setting-row"><div><strong>Provider authentication</strong><p>Passwords, cookies, OAuth tokens, and authentication headers remain in website-owned browser storage. Instrumentation does not extract them.</p></div><!></div><div class="setting-row"><div><strong>Conversation storage</strong><p>Session IDs, conversation URLs, and SHA-256 message receipts persist locally. Prompt bodies and tool results are not written to session files.</p></div><span class="tag">Metadata only</span></div><div class="setting-row"><div><strong>Raw payload capture</strong><p>Raw network payload and credential capture are not enabled by any preference in this build.</p></div><span class="tag">Disabled</span></div></section><section class="section"><h2>Diagnostics</h2><div class="setting-row"><div><strong>Log level</strong><p>Debug adds bounded structural browser events. Authentication values and form data remain excluded.</p></div><select aria-label="Log level"></select></div><div class="setting-row"><div><strong>Developer diagnostics</strong><p>Enable authenticated debug endpoints and allow the native page inspector. This never grants arbitrary commands to provider pages.</p></div><button class="toggle" role="switch" aria-label="Developer diagnostics"></button></div><div class="setting-row"><div><strong>Retained diagnostic events</strong><p>The ring holds at most 160 redacted records and is cleared when the backend exits.</p></div><button class="secondary">Clear events</button></div></section>`, 1);
var root_16 = $.from_html(`<section class="section"><h2>Desktop runtime</h2><div class="setting-row"><div><strong>Zag sidecar</strong><p> </p></div><span><span></span> </span></div><div class="setting-row"><div><strong>Backend version</strong><p>Protocol version 1 · Linux x86-64 distribution target</p></div><code> </code></div><div class="setting-row"><div><strong>Restart backend</strong><p>Cancel current requests, restart the sidecar, reload saved metadata, and reconnect the trusted UI. Provider profiles remain on disk.</p></div><button class="secondary"><!> </button></div><div class="setting-row"><div><strong>Keyboard controls</strong><p>Review the desktop shortcuts and website-focus behavior.</p></div><button class="secondary">View shortcuts</button></div></section><section class="section"><h2>Research detector</h2><p style="margin-top:15px"> </p><div class="note"><!><span>TNN action proposals must pass the same bounded browser action validator. An unqualified detector cannot take over production behavior.</span></div></section>`, 1);
var root = $.from_html(`<section class="screen"><div class="screen-inner"><header class="screen-head"><div><div class="breadcrumb">Workspace / Preferences</div><h1>Settings</h1><p>Changes are saved by the Zag backend. Browser permissions remain explicit.</p></div></header><div class="preferences-layout"><nav class="preferences-nav" aria-label="Settings sections"></nav><div><!></div></div></div></section>`);

export default function Settings($$anchor, $$props) {
	$.push($$props, true);

	let tab = $.state('appearance');
	let port = $.state('');
	let restarting = $.state(false);
	let selectedProfile = $.state('');

	const sections = [
		{ id: 'appearance', label: 'Appearance' },
		{ id: 'gateway', label: 'Local gateway' },
		{ id: 'profiles', label: 'Website profiles' },
		{ id: 'privacy', label: 'Privacy & diagnostics' },
		{ id: 'runtime', label: 'Runtime' }
	];

	const profile = $.derived(() => app.providers.find((p) => p.id === Number($.get(selectedProfile))) ?? app.provider ?? app.providers[0]);

	async function restart() {
		$.set(restarting, true);

		try {
			await bridge.restart();
		} catch(error) {
			app.error = String(error);
		} finally {
			$.set(restarting, false);
		}
	}

	async function updateProfile(key, value) {
		if ($.get(profile)) await app.perform('provider.update', { provider_id: $.get(profile).id, [key]: value });
	}

	var section_1 = root();
	var div = $.child(section_1);
	var div_1 = $.sibling($.child(div));
	var nav = $.child(div_1);

	$.each(nav, 21, () => sections, $.index, ($$anchor, section) => {
		var button = root_1();

		button.__click = () => $.set(tab, $.get(section).id, true);

		let classes;
		var text = $.child(button, true);

		$.reset(button);

		$.template_effect(() => {
			classes = $.set_class(button, 1, '', null, classes, { active: $.get(tab) === $.get(section).id });
			$.set_text(text, $.get(section).label);
		});

		$.append($$anchor, button);
	});

	$.reset(nav);

	var div_2 = $.sibling(nav);
	var node = $.child(div_2);

	{
		var consequent = ($$anchor) => {
			var fragment = root_2();
			var section_2 = $.first_child(fragment);
			var div_3 = $.sibling($.child(section_2));
			var div_4 = $.sibling($.child(div_3));

			$.each(div_4, 20, () => ['dark', 'light', 'system'], $.index, ($$anchor, theme) => {
				var button_1 = root_3();

				button_1.__click = () => app.settings({ theme });

				let classes_1;
				var node_1 = $.child(button_1);

				{
					let $0 = $.derived(() => theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : 'monitor');

					Icon(node_1, {
						get name() {
							return $.get($0);
						},
						size: 15
					});
				}

				var text_1 = $.sibling(node_1, 1, true);

				$.reset(button_1);

				$.template_effect(
					($0) => {
						$.set_attribute(button_1, 'aria-label', `${theme} theme`);
						button_1.disabled = !app.ready;
						classes_1 = $.set_class(button_1, 1, '', null, classes_1, { active: app.preferences.theme === theme });
						$.set_text(text_1, $0);
					},
					[() => theme[0].toUpperCase() + theme.slice(1)]
				);

				$.append($$anchor, button_1);
			});

			$.reset(div_4);
			$.reset(div_3);

			var div_5 = $.sibling(div_3);
			var button_2 = $.sibling($.child(div_5));

			button_2.__click = () => app.settings({ compact: !app.preferences.compact });
			$.reset(div_5);

			var div_6 = $.sibling(div_5);
			var button_3 = $.sibling($.child(div_6));

			button_3.__click = () => {
				app.inspectorVisible = !app.inspectorVisible;
				app.saveLayout();
			};

			$.reset(div_6);
			$.reset(section_2);

			var section_3 = $.sibling(section_2);
			var div_7 = $.sibling($.child(section_3));
			var button_4 = $.sibling($.child(div_7));

			button_4.__click = () => app.settings({ restore_tabs: !app.preferences.restore_tabs });
			$.reset(div_7);

			var div_8 = $.sibling(div_7);
			var button_5 = $.sibling($.child(div_8));

			button_5.__click = () => app.settings({ auto_start: !app.preferences.auto_start });
			$.reset(div_8);

			var div_9 = $.sibling(div_8);
			var select = $.sibling($.child(div_9));

			select.__change = (event) => app.settings({ idle_minutes: Number(event.currentTarget.value) });

			var option = $.child(select);

			option.value = option.__value = '0';

			var option_1 = $.sibling(option);

			option_1.value = option_1.__value = '5';

			var option_2 = $.sibling(option_1);

			option_2.value = option_2.__value = '15';

			var option_3 = $.sibling(option_2);

			option_3.value = option_3.__value = '30';

			var option_4 = $.sibling(option_3);

			option_4.value = option_4.__value = '60';

			var option_5 = $.sibling(option_4);

			option_5.value = option_5.__value = '120';
			$.reset(select);

			var select_value;

			$.init_select(select);
			$.reset(div_9);
			$.reset(section_3);

			$.template_effect(() => {
				$.set_attribute(button_2, 'aria-checked', app.preferences.compact);
				button_2.disabled = !app.ready;
				$.set_attribute(button_3, 'aria-checked', app.inspectorVisible);
				$.set_attribute(button_4, 'aria-checked', app.preferences.restore_tabs);
				button_4.disabled = !app.ready;
				$.set_attribute(button_5, 'aria-checked', app.preferences.auto_start);
				button_5.disabled = !app.ready;
				select.disabled = !app.ready;

				if (select_value !== (select_value = app.preferences.idle_minutes)) {
					(
						select.value = (select.__value = app.preferences.idle_minutes) ?? '',
						$.select_option(select, app.preferences.idle_minutes)
					);
				}
			});

			$.append($$anchor, fragment);
		};

		var alternate_4 = ($$anchor) => {
			var fragment_1 = $.comment();
			var node_2 = $.first_child(fragment_1);

			{
				var consequent_1 = ($$anchor) => {
					var fragment_2 = root_5();
					var section_4 = $.first_child(fragment_2);
					var div_10 = $.sibling($.child(section_4));
					var button_6 = $.sibling($.child(div_10));

					button_6.__click = () => app.perform(app.snapshot?.api.running ? 'api.stop' : 'api.start');
					$.reset(div_10);

					var div_11 = $.sibling(div_10);
					var form = $.sibling($.child(div_11));
					var input = $.child(form);

					$.remove_input_defaults(input);
					input.__input = (event) => $.set(port, event.currentTarget.value, true);

					var button_7 = $.sibling(input);

					$.reset(form);
					$.reset(div_11);

					var div_12 = $.sibling(div_11);
					var button_8 = $.sibling($.child(div_12));

					button_8.__click = () => app.showPopup('rotate-key');

					var node_3 = $.child(button_8);

					Icon(node_3, { name: 'key', size: 14 });
					$.next();
					$.reset(button_8);
					$.reset(div_12);

					var div_13 = $.sibling(div_12);
					var select_1 = $.sibling($.child(div_13));

					select_1.__change = (event) => app.settings({ default_model: event.currentTarget.value });

					var option_6 = $.child(select_1);

					option_6.value = option_6.__value = '';

					var node_4 = $.sibling(option_6);

					$.each(node_4, 17, () => app.models, $.index, ($$anchor, m) => {
						var option_7 = root_6();
						var text_2 = $.child(option_7);

						$.reset(option_7);

						var option_7_value = {};

						$.template_effect(() => {
							$.set_text(text_2, `${$.get(m).provider.label ?? ''} / ${$.get(m).display_name ?? ''}`);

							if (option_7_value !== (option_7_value = $.get(m).id)) {
								option_7.value = (option_7.__value = $.get(m).id) ?? '';
							}
						});

						$.append($$anchor, option_7);
					});

					$.reset(select_1);

					var select_1_value;

					$.init_select(select_1);
					$.reset(div_13);
					$.reset(section_4);

					var section_5 = $.sibling(section_4, 2);
					var div_14 = $.sibling($.child(section_5));
					var select_2 = $.sibling($.child(div_14));

					select_2.__change = (event) => app.settings({
						fallback_model: event.currentTarget.value,
						fallback_enabled: !!event.currentTarget.value && app.preferences.fallback_enabled
					});

					var option_8 = $.child(select_2);

					option_8.value = option_8.__value = '';

					var node_5 = $.sibling(option_8);

					$.each(node_5, 17, () => app.models, $.index, ($$anchor, m) => {
						var option_9 = root_7();
						var text_3 = $.child(option_9);

						$.reset(option_9);

						var option_9_value = {};

						$.template_effect(() => {
							$.set_text(text_3, `${$.get(m).provider.label ?? ''} / ${$.get(m).display_name ?? ''}`);

							if (option_9_value !== (option_9_value = $.get(m).id)) {
								option_9.value = (option_9.__value = $.get(m).id) ?? '';
							}
						});

						$.append($$anchor, option_9);
					});

					$.reset(select_2);

					var select_2_value;

					$.init_select(select_2);
					$.reset(div_14);

					var div_15 = $.sibling(div_14);
					var button_9 = $.sibling($.child(div_15));

					button_9.__click = () => app.settings({ fallback_enabled: !app.preferences.fallback_enabled });
					$.reset(div_15);

					var div_16 = $.sibling(div_15);
					var node_6 = $.child(div_16);

					Icon(node_6, { name: 'shield', size: 15 });
					$.next();
					$.reset(div_16);
					$.reset(section_5);

					$.template_effect(() => {
						$.set_attribute(button_6, 'aria-checked', app.snapshot?.api.running ?? false);
						button_6.disabled = !app.ready;
						$.set_value(input, $.get(port) || app.snapshot?.api.port || 7331);
						button_7.disabled = !app.ready || !$.get(port);
						button_8.disabled = !app.ready;
						select_1.disabled = !app.ready;

						if (select_1_value !== (select_1_value = app.preferences.default_model)) {
							(
								select_1.value = (select_1.__value = app.preferences.default_model) ?? '',
								$.select_option(select_1, app.preferences.default_model)
							);
						}

						select_2.disabled = !app.ready;

						if (select_2_value !== (select_2_value = app.preferences.fallback_model)) {
							(
								select_2.value = (select_2.__value = app.preferences.fallback_model) ?? '',
								$.select_option(select_2, app.preferences.fallback_model)
							);
						}

						$.set_attribute(button_9, 'aria-checked', app.preferences.fallback_enabled);
						button_9.disabled = !app.ready || !app.preferences.fallback_model;
					});

					$.event('submit', form, (event) => {
						event.preventDefault();
						void app.settings({ port: Number($.get(port)) });
					});

					$.append($$anchor, fragment_2);
				};

				var alternate_3 = ($$anchor) => {
					var fragment_3 = $.comment();
					var node_7 = $.first_child(fragment_3);

					{
						var consequent_3 = ($$anchor) => {
							var section_6 = root_9();
							var div_17 = $.child(section_6);
							var button_10 = $.sibling($.child(div_17));

							button_10.__click = () => app.showPopup('add');

							var node_8 = $.child(button_10);

							Icon(node_8, { name: 'plus', size: 13 });
							$.next();
							$.reset(button_10);
							$.reset(div_17);

							var label = $.sibling(div_17);
							var select_3 = $.sibling($.child(label));

							select_3.__change = (event) => $.set(selectedProfile, event.currentTarget.value, true);

							var option_10 = $.child(select_3);

							option_10.value = option_10.__value = '';

							var node_9 = $.sibling(option_10);

							$.each(node_9, 17, () => app.providers, $.index, ($$anchor, p) => {
								var option_11 = root_10();
								var text_4 = $.child(option_11);

								$.reset(option_11);

								var option_11_value = {};

								$.template_effect(() => {
									$.set_text(text_4, `${$.get(p).label ?? ''} · ${$.get(p).origin ?? ''}`);

									if (option_11_value !== (option_11_value = $.get(p).id)) {
										option_11.value = (option_11.__value = $.get(p).id) ?? '';
									}
								});

								$.append($$anchor, option_11);
							});

							$.reset(select_3);

							var select_3_value;

							$.init_select(select_3);
							$.reset(label);

							var node_10 = $.sibling(label);

							{
								var consequent_2 = ($$anchor) => {
									var fragment_4 = root_11();
									var div_18 = $.first_child(fragment_4);
									var div_19 = $.child(div_18);
									var p_1 = $.sibling($.child(div_19));
									var text_5 = $.child(p_1, true);

									$.reset(p_1);
									$.reset(div_19);

									var input_1 = $.sibling(div_19);

									$.remove_input_defaults(input_1);
									input_1.__change = (event) => updateProfile('label', event.currentTarget.value);
									$.reset(div_18);

									var div_20 = $.sibling(div_18);
									var button_11 = $.sibling($.child(div_20));

									button_11.__click = () => updateProfile('pinned', !$.get(profile).pinned);
									$.reset(div_20);

									var div_21 = $.sibling(div_20);
									var input_2 = $.sibling($.child(div_21));

									$.remove_input_defaults(input_2);
									input_2.__change = (event) => updateProfile('context_hint', Number(event.currentTarget.value));
									$.reset(div_21);

									var div_22 = $.sibling(div_21);
									var input_3 = $.sibling($.child(div_22));

									$.remove_input_defaults(input_3);
									input_3.__change = (event) => updateProfile('reasoning_value', event.currentTarget.value);
									$.reset(div_22);

									var div_23 = $.sibling(div_22);
									var button_12 = $.sibling($.child(div_23));

									button_12.__click = () => app.showPopup('clear-profile', $.get(profile).id);
									$.reset(div_23);

									var div_24 = $.sibling(div_23);
									var button_13 = $.sibling($.child(div_24));

									button_13.__click = () => app.showPopup('remove-provider', $.get(profile).id);
									$.reset(div_24);

									$.template_effect(() => {
										$.set_text(text_5, $.get(profile).origin);
										$.set_value(input_1, $.get(profile).label);
										input_1.disabled = $.get(profile).active;
										$.set_attribute(button_11, 'aria-checked', $.get(profile).pinned);
										$.set_value(input_2, $.get(profile).context_hint);
										input_2.disabled = $.get(profile).active;
										$.set_value(input_3, $.get(profile).reasoning_value);
										input_3.disabled = $.get(profile).active;
									});

									$.append($$anchor, fragment_4);
								};

								var alternate = ($$anchor) => {
									var p_2 = root_12();

									$.append($$anchor, p_2);
								};

								$.if(node_10, ($$render) => {
									if ($.get(profile)) $$render(consequent_2); else $$render(alternate, false);
								});
							}

							$.reset(section_6);

							$.template_effect(() => {
								button_10.disabled = !app.ready;

								if (select_3_value !== (select_3_value = $.get(profile)?.id ?? '')) {
									(
										select_3.value = (select_3.__value = $.get(profile)?.id ?? '') ?? '',
										$.select_option(select_3, $.get(profile)?.id ?? '')
									);
								}
							});

							$.append($$anchor, section_6);
						};

						var alternate_2 = ($$anchor) => {
							var fragment_5 = $.comment();
							var node_11 = $.first_child(fragment_5);

							{
								var consequent_4 = ($$anchor) => {
									var fragment_6 = root_14();
									var section_7 = $.first_child(fragment_6);
									var div_25 = $.sibling($.child(section_7));
									var node_12 = $.sibling($.child(div_25));

									Icon(node_12, { name: 'lock', size: 17 });
									$.reset(div_25);
									$.next(2);
									$.reset(section_7);

									var section_8 = $.sibling(section_7);
									var div_26 = $.sibling($.child(section_8));
									var select_4 = $.sibling($.child(div_26));

									select_4.__change = (event) => app.settings({ logging: event.currentTarget.value });

									$.each(select_4, 20, () => ['ERROR', 'WARN', 'INFO', 'DEBUG'], $.index, ($$anchor, level) => {
										var option_12 = root_15();
										var text_6 = $.child(option_12, true);

										$.reset(option_12);

										var option_12_value = {};

										$.template_effect(() => {
											$.set_text(text_6, level);

											if (option_12_value !== (option_12_value = level)) {
												option_12.value = (option_12.__value = level) ?? '';
											}
										});

										$.append($$anchor, option_12);
									});

									$.reset(select_4);

									var select_4_value;

									$.init_select(select_4);
									$.reset(div_26);

									var div_27 = $.sibling(div_26);
									var button_14 = $.sibling($.child(div_27));

									button_14.__click = () => app.settings({ developer_mode: !app.preferences.developer_mode });
									$.reset(div_27);

									var div_28 = $.sibling(div_27);
									var button_15 = $.sibling($.child(div_28));

									button_15.__click = () => app.perform('logs.clear');
									$.reset(div_28);
									$.reset(section_8);

									$.template_effect(() => {
										if (select_4_value !== (select_4_value = app.preferences.logging)) {
											(
												select_4.value = (select_4.__value = app.preferences.logging) ?? '',
												$.select_option(select_4, app.preferences.logging)
											);
										}

										$.set_attribute(button_14, 'aria-checked', app.preferences.developer_mode);
										button_14.disabled = !app.ready;
										button_15.disabled = !app.events.length;
									});

									$.append($$anchor, fragment_6);
								};

								var alternate_1 = ($$anchor) => {
									var fragment_7 = root_16();
									var section_9 = $.first_child(fragment_7);
									var div_29 = $.sibling($.child(section_9));
									var div_30 = $.child(div_29);
									var p_3 = $.sibling($.child(div_30));
									var text_7 = $.child(p_3, true);

									$.reset(p_3);
									$.reset(div_30);

									var span = $.sibling(div_30);
									let classes_2;
									var span_1 = $.child(span);
									let classes_3;
									var text_8 = $.sibling(span_1, 1, true);

									$.reset(span);
									$.reset(div_29);

									var div_31 = $.sibling(div_29);
									var code = $.sibling($.child(div_31));
									var text_9 = $.child(code, true);

									$.reset(code);
									$.reset(div_31);

									var div_32 = $.sibling(div_31);
									var button_16 = $.sibling($.child(div_32));

									button_16.__click = restart;

									var node_13 = $.child(button_16);

									Icon(node_13, { name: 'refresh', size: 14 });

									var text_10 = $.sibling(node_13, 1, true);

									$.reset(button_16);
									$.reset(div_32);

									var div_33 = $.sibling(div_32);
									var button_17 = $.sibling($.child(div_33));

									button_17.__click = () => app.showPopup('shortcuts');
									$.reset(div_33);
									$.reset(section_9);

									var section_10 = $.sibling(section_9);
									var p_4 = $.sibling($.child(section_10));
									var text_11 = $.child(p_4, true);

									$.reset(p_4);

									var div_34 = $.sibling(p_4);
									var node_14 = $.child(div_34);

									Icon(node_14, { name: 'shield', size: 16 });
									$.next();
									$.reset(div_34);
									$.reset(section_10);

									$.template_effect(() => {
										$.set_text(text_7, app.host.code || 'The native backend owns routing, protocol translation, sessions, discovery, and the loopback server.');
										classes_2 = $.set_class(span, 1, 'tag', null, classes_2, { ready: app.host.state === 'READY' });
										classes_3 = $.set_class(span_1, 1, 'dot', null, classes_3, { online: app.host.state === 'READY' });
										$.set_text(text_8, app.host.state);
										$.set_text(text_9, app.snapshot?.version || 'Not connected');
										button_16.disabled = $.get(restarting);
										$.set_text(text_10, $.get(restarting) ? 'Restarting…' : 'Restart Zag');
										$.set_text(text_11, app.snapshot?.detector.reason || 'No qualified TNN artifact is loaded. Symbolic discovery remains authoritative.');
									});

									$.append($$anchor, fragment_7);
								};

								$.if(
									node_11,
									($$render) => {
										if ($.get(tab) === 'privacy') $$render(consequent_4); else $$render(alternate_1, false);
									},
									true
								);
							}

							$.append($$anchor, fragment_5);
						};

						$.if(
							node_7,
							($$render) => {
								if ($.get(tab) === 'profiles') $$render(consequent_3); else $$render(alternate_2, false);
							},
							true
						);
					}

					$.append($$anchor, fragment_3);
				};

				$.if(
					node_2,
					($$render) => {
						if ($.get(tab) === 'gateway') $$render(consequent_1); else $$render(alternate_3, false);
					},
					true
				);
			}

			$.append($$anchor, fragment_1);
		};

		$.if(node, ($$render) => {
			if ($.get(tab) === 'appearance') $$render(consequent); else $$render(alternate_4, false);
		});
	}

	$.reset(div_2);
	$.reset(div_1);
	$.reset(div);
	$.reset(section_1);
	$.append($$anchor, section_1);
	$.pop();
}

$.delegate(['click', 'change', 'input']);