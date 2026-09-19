<script lang="ts">
  import {app} from '../lib/state/app.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import Badge from '../lib/components/Badge.svelte';
  import Empty from '../lib/components/Empty.svelte';
  let query=$state(''); let availableOnly=$state(false);
  const models=$derived(app.models.filter(model=>(!availableOnly||model.provider.state==='READY')&&`${model.id} ${model.display_name} ${model.provider.label}`.toLowerCase().includes(query.toLowerCase())));
</script>
<section class="screen"><div class="page-heading"><div><div class="eyebrow">CAPABILITY REGISTRY</div><h1>Models</h1><p>Names are observations, not proof of context size, reasoning support or tokenizer identity.</p></div><span class="count-pill">{app.models.length} registered</span></div>
  <div class="table-toolbar"><label class="search-field"><Icon name="search" size={17}/><input bind:value={query} placeholder="Search models or providers" aria-label="Search models"/></label><label class="checkbox-label"><input type="checkbox" bind:checked={availableOnly}/>Ready providers only</label></div>
  <div class="panel table-panel">{#if !models.length}<Empty title={app.models.length ? 'No matching models' : 'No models discovered'} description="Models appear after a provider exposes a selector or you explicitly register the currently selected model in the detector lab."/>
  {:else}<table><thead><tr><th>Model</th><th>Provider</th><th>Availability</th><th>Context</th><th>Tokenizer</th><th>Tools</th><th>Evidence</th></tr></thead><tbody>{#each models as model (model.id)}<tr><td><strong>{model.display_name}</strong><button class="copy-id mono" title="Copy model ID" onclick={()=>app.clipboard(model.id)}>{model.id}<Icon name="copy" size={12}/></button></td><td>{model.provider.label}</td><td><Badge state={model.provider.state}/></td><td class="muted">{model.context.effective ?? 'Unknown'}</td><td><span class="subtle-tag">Estimated</span></td><td>Emulated</td><td><span class="source-tag">{model.confidence.replaceAll('_',' ')}</span></td></tr>{/each}</tbody></table>{/if}</div>
  <div class="notice"><Icon name="shield"/><p>Tool support uses validated text framing, not provider-native tools. A reasoning selector can be observed without its mode being automatable. Vision and attachment transport are not enabled.</p></div>
</section>
