import '../../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../../runtime/svelte_internal_client.js';
import { chooseDirectory } from '../../api/bridge.js';
import Icon from '../Icon.svelte.js';
import { toolRecipes, recipeDefinition } from '../../tool-recipes.js';

var root = $.from_html(`<button><!><span><strong> </strong><small> </small></span><!></button>`);
var root_1 = $.from_html(`<label class="field"><span>Folder to share</span><input aria-label="Tool folder" placeholder="/home/you/projects/my-project" autocomplete="off" spellcheck="false"/><button class="secondary" type="button"> </button><span class="field-hint">Use a specific project folder rather than your home directory. This path is passed as one argument, never a shell command.</span></label>`);
var root_2 = $.from_html(`<label class="setting-line"><div><strong>Allow project changes</strong><p>Enable file writes, edits, moves and recoverable deletion. Each tool call still needs your approval.</p></div><input type="checkbox" aria-label="Enable project changes"/></label> <details class="advanced-client"><summary>Advanced · trusted command execution</summary><label class="setting-line"><div><strong>Enable shell commands</strong><p>Commands run as your user, not in an operating-system sandbox. They can read or change files outside this project and access the network. Only enable this for trusted tasks.</p></div><input type="checkbox" aria-label="Enable trusted commands"/></label></details>`, 1);
var root_3 = $.from_html(`<p class="form-error" role="alert"> </p>`);
var root_4 = $.from_html(`<div class="recipe-review"><h3> </h3><p class="field-hint"> </p> <!> <!> <details class="advanced-client"><summary>Executable and pinned version</summary><pre class="code"> </pre></details> <!> <div class="button-group"><button class="primary">Use this definition</button><button class="secondary">Cancel</button></div></div>`);
var root_5 = $.from_html(`<section class="tool-library" aria-label="Tool library"><p class="field-hint">Add only what you need. Local project tools are bundled. Other entries are optional external servers. Nothing runs until you approve its local process.</p> <div class="recipe-list"></div> <!></section>`);

export default function ToolLibrary($$anchor, $$props) {
	$.push($$props, true);

	let disabled = $.prop($$props, 'disabled', 3, false);
	let selection = $.state('');
	let folder = $.state('');
	let error = $.state('');
	let picking = $.state(false);
	let write = $.state(false);
	let commands = $.state(false);

	async function pick() {
		const id = $.get(selection);

		$.set(picking, true);

		try {
			const value = await chooseDirectory();

			if (value && $.get(selection) === id) $.set(folder, value, true);
		} catch(e) {
			$.set(error, String(e), true);
		} finally {
			$.set(picking, false);
		}
	}

	const selected = $.derived(() => toolRecipes.find((r) => r.id === $.get(selection)));

	function use() {
		try {
			$$props.onchoose(recipeDefinition($.get(selection), $.get(folder), { write: $.get(write), commands: $.get(commands) }));
			$.set(error, '');
			$.set(selection, '');
			$.set(folder, '');
		} catch(e) {
			$.set(error, String(e instanceof Error ? e.message : e), true);
		}
	}

	var section = root_5();
	var div = $.sibling($.child(section), 2);

	$.each(div, 21, () => toolRecipes, (recipe) => recipe.id, ($$anchor, recipe) => {
		var button = root();
		let classes;
		var node = $.child(button);

		Icon(node, {
			get name() {
				return $.get(recipe).icon;
			},
			size: 18
		});

		var span = $.sibling(node);
		var strong = $.child(span);
		var text = $.only_child(strong, true);
		var small = $.sibling(strong);
		var text_1 = $.only_child(small, true);

		$.reset(span);

		var node_1 = $.sibling(span);

		Icon(node_1, { name: 'arrow', size: 14 });
		$.reset(button);

		$.template_effect(() => {
			classes = $.set_class(button, 1, 'recipe-row', null, classes, { selected: $.get(selection) === $.get(recipe).id });
			$.set_attribute(button, 'aria-pressed', $.get(selection) === $.get(recipe).id);
			button.disabled = disabled() || $.get(picking);
			$.set_text(text, $.get(recipe).label);
			$.set_text(text_1, $.get(recipe).description);
		});

		$.delegated('click', button, () => {
			$.set(selection, $.get(recipe).id, true);
			$.set(folder, '');
			$.set(error, '');
			$.set(write, false);
			$.set(commands, false);
		});

		$.append($$anchor, button);
	});

	$.reset(div);

	var node_2 = $.sibling(div, 2);

	{
		var consequent_3 = ($$anchor) => {
			var div_1 = root_4();
			var h3 = $.child(div_1);
			var text_2 = $.only_child(h3, true);
			var p = $.sibling(h3);
			var text_3 = $.only_child(p, true);
			var node_3 = $.sibling(p, 2);

			{
				var consequent = ($$anchor) => {
					var label = root_1();
					var input = $.sibling($.child(label));

					$.remove_input_defaults(input);

					var button_1 = $.sibling(input);
					var text_4 = $.only_child(button_1, true);

					$.next();
					$.reset(label);

					$.template_effect(() => {
						button_1.disabled = disabled() || $.get(picking);
						$.set_text(text_4, $.get(picking) ? 'Choosing…' : 'Choose folder…');
					});

					$.bind_value(input, () => $.get(folder), ($$value) => $.set(folder, $$value));
					$.delegated('click', button_1, pick);
					$.append($$anchor, label);
				};

				$.if(node_3, ($$render) => {
					if ($.get(selected).folder) $$render(consequent);
				});
			}

			var node_4 = $.sibling(node_3, 2);

			{
				var consequent_1 = ($$anchor) => {
					var fragment = root_2();
					var label_1 = $.first_child(fragment);
					var input_1 = $.sibling($.child(label_1));

					$.remove_input_defaults(input_1);
					$.reset(label_1);

					var details = $.sibling(label_1, 2);
					var label_2 = $.sibling($.child(details));
					var input_2 = $.sibling($.child(label_2));

					$.remove_input_defaults(input_2);
					$.reset(label_2);
					$.reset(details);
					$.bind_checked(input_1, () => $.get(write), ($$value) => $.set(write, $$value));
					$.bind_checked(input_2, () => $.get(commands), ($$value) => $.set(commands, $$value));
					$.append($$anchor, fragment);
				};

				$.if(node_4, ($$render) => {
					if ($.get(selected).bundled) $$render(consequent_1);
				});
			}

			var details_1 = $.sibling(node_4, 2);
			var pre = $.sibling($.child(details_1));
			var text_5 = $.only_child(pre);

			$.reset(details_1);

			var node_5 = $.sibling(details_1, 2);

			{
				var consequent_2 = ($$anchor) => {
					var p_1 = root_3();
					var text_6 = $.only_child(p_1, true);

					$.template_effect(() => $.set_text(text_6, $.get(error)));
					$.append($$anchor, p_1);
				};

				$.if(node_5, ($$render) => {
					if ($.get(error)) $$render(consequent_2);
				});
			}

			var div_2 = $.sibling(node_5, 2);
			var button_2 = $.child(div_2);
			var button_3 = $.sibling(button_2);

			$.reset(div_2);
			$.reset(div_1);

			$.template_effect(
				($0, $1) => {
					$.set_attribute(div_1, 'aria-label', `Configure ${$.get(selected).label}`);
					$.set_text(text_2, $.get(selected).label);
					$.set_text(text_3, $.get(selected).note);

					$.set_text(text_5, `${$.get(selected).command ?? ''}
${$0 ?? ''}`);

					button_2.disabled = $1;
				},
				[
					() => JSON.stringify($.get(selected).args, null, 2),
					() => disabled() || $.get(selected).folder && !$.get(folder).trim()
				]
			);

			$.delegated('click', button_2, use);
			$.delegated('click', button_3, () => $.set(selection, ''));
			$.append($$anchor, div_1);
		};

		$.if(node_2, ($$render) => {
			if ($.get(selected)) $$render(consequent_3);
		});
	}

	$.reset(section);
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click']);