<script lang="ts">
 import {chooseDirectory} from '../../api/bridge';import Icon from '../Icon.svelte';import {toolRecipes,recipeDefinition} from '../../tool-recipes';
 let {onchoose,disabled=false}:{onchoose:(definition:{label:string;command:string;args:string[]})=>void;disabled?:boolean}=$props();
 let selection=$state(''),folder=$state(''),error=$state(''),picking=$state(false);
 async function pick(){const id=selection;picking=true;try{const value=await chooseDirectory();if(value&&selection===id)folder=value;}catch(e){error=String(e);}finally{picking=false;}}
 const selected=$derived(toolRecipes.find(r=>r.id===selection));
 function use(){try{onchoose(recipeDefinition(selection,folder));error='';selection='';folder='';}catch(e){error=String(e instanceof Error?e.message:e);}}
</script>
<section class="tool-library" aria-label="Tool library">
 <p class="field-hint">Add only what you need. These are optional external servers, not preinstalled tools. Nothing is downloaded or started until you approve its local process.</p>
 <div class="recipe-list">{#each toolRecipes as recipe(recipe.id)}
  <button class="recipe-row" class:selected={selection===recipe.id} aria-pressed={selection===recipe.id} disabled={disabled||picking} onclick={()=>{selection=recipe.id;folder='';error='';}}>
   <Icon name={recipe.icon} size={18}/><span><strong>{recipe.label}</strong><small>{recipe.description}</small></span><Icon name="arrow" size={14}/>
  </button>
 {/each}</div>
 {#if selected}<div class="recipe-review" aria-label={`Configure ${selected.label}`}>
  <h3>{selected.label}</h3><p class="field-hint">{selected.note}</p>
  {#if selected.folder}<label class="field"><span>Folder to share</span><input aria-label="Tool folder" bind:value={folder} placeholder="/home/you/projects/my-project" autocomplete="off" spellcheck="false"/><button class="secondary" type="button" disabled={disabled||picking} onclick={pick}>{picking?'Choosing…':'Choose folder…'}</button><span class="field-hint">Use a specific project folder rather than your home directory. This path is passed as one argument, never a shell command.</span></label>{/if}
  <details class="advanced-client"><summary>Executable and pinned version</summary><pre class="code">{selected.command}{'\n'}{JSON.stringify(selected.args,null,2)}</pre></details>
  {#if error}<p class="form-error" role="alert">{error}</p>{/if}
  <div class="button-group"><button class="primary" disabled={disabled||(selected.folder&&!folder.trim())} onclick={use}>Use this definition</button><button class="secondary" onclick={()=>selection=''}>Cancel</button></div>
 </div>{/if}
</section>
