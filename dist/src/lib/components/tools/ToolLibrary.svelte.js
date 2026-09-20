import '../../../../runtime/svelte_internal_disclose-version.js';
import * as $ from '../../../../runtime/svelte_internal_client.js';
import { chooseDirectory } from '../../api/bridge.js';
import Icon from '../Icon.svelte.js';
import { toolRecipes, recipeDefinition } from '../../tool-recipes.js';

var root_1 = $.from_html(`<button><!><span><strong> </strong><small> </small></span><!></button>`);
var root_3 = $.from_html(`<label class="field"><span>Folder to share</span><input aria-label="Tool folder" placeholder="/home/you/projects/my-project" autocomplete="off" spellcheck="false"/><button class="secondary" type="button"> </button><span class="field-hint">Use a specific project folder rather than your home directory. This path is passed as one argument, never a shell command.</span></label>`);
var root_4 = $.from_html(`<p class="form-error" role="alert"> </p>`);
var root_2 = $.from_html(`<div class="recipe-review"><h3> </h3><p class="field-hint"> </p> <!> <details class="advanced-client"><summary>Executable and pinned version</summary><pre class="code"> </pre></details> <!> <div class="button-group"><button class="primary">Use this definition</button><button class="secondary">Cancel</button></div></div>`);
var root = $.from_html(`<section class="tool-library" aria-label="Tool library"><p class="field-hint">Add only what you need. These are optional external servers, not preinstalled tools. Nothing is downloaded or started until you approve its local process.</p> <div class="recipe-list"></div> <!></section>`);

export default function ToolLibrary($$anchor, $$props) {
	$.push($$props, true);

	let disabled = $.prop($$props, 'disabled', 3, false);
	let selection = $.state('');
	let folder = $.state('');
	let error = $.state('');
	let picking = $.state(false);

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
			$$props.onchoose(recipeDefinition($.get(selection), $.get(folder)));
			$.set(error, '');
			$.set(selection, '');
			$.set(folder, '');
		} catch(e) {
			$.set(error, String(e instanceof Error ? e.message : e), true);
		}
	}

	var section = root();
	var div = $.sibling($.child(section), 2);

	$.each(div, 21, () => toolRecipes, (recipe) => recipe.id, ($$anchor, recipe) => {
		var button = root_1();
		let classes;

		button.__click = () => {
			$.set(selection, $.get(recipe).id, true);
			$.set(folder, '');
			$.set(error, '');
		};

		var node = $.child(button);

		Icon(node, {
			get name() {
				return $.get(recipe).icon;
			},
			size: 18
		});

		var span = $.sibling(node);
		var strong = $.child(span);
		var text = $.child(strong, true);

		$.reset(strong);

		var small = $.sibling(strong);
		var text_1 = $.child(small, true);

		$.reset(small);
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

		$.append($$anchor, button);
	});

	$.reset(div);

	var node_2 = $.sibling(div, 2);

	{
		var consequent_2 = ($$anchor) => {
			var div_1 = root_2();
			var h3 = $.child(div_1);
			var text_2 = $.child(h3, true);

			$.reset(h3);

			var p = $.sibling(h3);
			var text_3 = $.child(p, true);

			$.reset(p);

			var node_3 = $.sibling(p, 2);

			{
				var consequent = ($$anchor) => {
					var label = root_3();
					var input = $.sibling($.child(label));

					$.remove_input_defaults(input);

					var button_1 = $.sibling(input);

					button_1.__click = pick;

					var text_4 = $.child(button_1, true);

					$.reset(button_1);
					$.next();
					$.reset(label);

					$.template_effect(() => {
						button_1.disabled = disabled() || $.get(picking);
						$.set_text(text_4, $.get(picking) ? 'Choosing…' : 'Choose folder…');
					});

					$.bind_value(input, () => $.get(folder), ($$value) => $.set(folder, $$value));
					$.append($$anchor, label);
				};

				$.if(node_3, ($$render) => {
					if ($.get(selected).folder) $$render(consequent);
				});
			}

			var details = $.sibling(node_3, 2);
			var pre = $.sibling($.child(details));
			var text_5 = $.child(pre);

			$.reset(pre);
			$.reset(details);

			var node_4 = $.sibling(details, 2);

			{
				var consequent_1 = ($$anchor) => {
					var p_1 = root_4();
					var text_6 = $.child(p_1, true);

					$.reset(p_1);
					$.template_effect(() => $.set_text(text_6, $.get(error)));
					$.append($$anchor, p_1);
				};

				$.if(node_4, ($$render) => {
					if ($.get(error)) $$render(consequent_1);
				});
			}

			var div_2 = $.sibling(node_4, 2);
			var button_2 = $.child(div_2);

			button_2.__click = use;

			var button_3 = $.sibling(button_2);

			button_3.__click = () => $.set(selection, '');
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

			$.append($$anchor, div_1);
		};

		$.if(node_2, ($$render) => {
			if ($.get(selected)) $$render(consequent_2);
		});
	}

	$.reset(section);
	$.append($$anchor, section);
	$.pop();
}

$.delegate(['click']);