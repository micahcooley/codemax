<script lang="ts">
  import {app} from '../lib/state/app.svelte';
  import type {Evidence} from '../lib/types/bridge';
  import Icon from '../lib/components/Icon.svelte';
  import Empty from '../lib/components/Empty.svelte';
  let evidence=$state<Evidence|null>(null); let mapping=$state('prompt'); let node=$state(0); let label=$state(''); let fetching=$state(false);
  async function refresh() {
    if (!app.provider) return; fetching=true;
    const result=await app.perform<Evidence|null>('detector.evidence',{provider_id:app.provider.id}); evidence=result??null; fetching=false;
  }
  async function record() {
    if (!evidence || !app.provider || node<=0) return;
    await app.perform('connector.record',{provider_id:app.provider.id,document_id:evidence.document_id,node,mapping});
    await refresh();
  }
  $effect(()=>{void app.selectedProvider; evidence=null; node=0;});
</script>
<section class="screen"><div class="page-heading"><div><div class="eyebrow">INSPECT · CONFIRM · REVALIDATE</div><h1>Detector lab</h1><p>Bounded semantic evidence. User-confirmed recipes. No opaque selector guessing.</p></div><span class="subtle-tag">Symbolic baseline</span></div>
  <div class="two-columns"><article class="panel padded"><h2>Active detector</h2><dl class="facts"><dt>Production engine</dt><dd>Symbolic</dd><dt>TNN artifact</dt><dd>Not admitted</dd><dt>Hybrid activation</dt><dd>Blocked</dd><dt>Learning from private data</dt><dd>Disabled</dd></dl><p class="muted">A shadow-prediction schema is included for research integration. No trained detector, measured accuracy or qualified hybrid execution is claimed.</p></article><article class="panel padded"><h2>Provider evidence</h2><label class="field">Provider<select bind:value={app.selectedProvider}><option value={null}>Choose a provider</option>{#each app.providers as p (p.id)}<option value={p.id}>{p.label}</option>{/each}</select></label><button class="secondary" disabled={!app.provider||!app.ready||fetching} onclick={refresh}><Icon name="scan" size={16}/>{fetching?'Reading evidence…':'Read current evidence'}</button><p class="muted">Only structural labels, roles and option metadata are returned. Input values, cookies and network payloads are excluded.</p></article></div>
  <article class="panel"><div class="panel-heading"><h2>Observation snapshot</h2>{#if evidence}<span class="mono muted">{evidence.controls.length} controls</span>{/if}</div>
    {#if !evidence}<Empty title="No evidence loaded" description="Choose a provider and read its current observation. A website must be open and instrumented." icon="scan"/>
    {:else}<div class="evidence-meta"><span>{evidence.origin}</span><span class="mono">document {evidence.document_id.slice(0,12)}…</span>{#if evidence.password_fields_present}<span class="warning-text">Login form present; sensitive fields excluded</span>{/if}</div><div class="evidence-table"><table><thead><tr><th>Node</th><th>Semantic role</th><th>Label</th><th>State</th><th>Options</th></tr></thead><tbody>{#each evidence.controls as c (c.id)}<tr class:selected={node===c.id}><td><label><input type="radio" bind:group={node} value={c.id} aria-label={`Select node ${c.id}`}/> <span class="mono">{c.id}</span></label></td><td>{c.tag}{c.role?` / ${c.role}`:''}</td><td>{c.label||'Unlabelled'}</td><td>{!c.visible?'Hidden':c.disabled?'Disabled':c.editable?'Editable':'Visible'}</td><td>{c.options.length||'—'}</td></tr>{/each}</tbody></table></div>
      <div class="recorder-controls"><label class="field">Map selected node to<select bind:value={mapping}>{#each ['prompt','send','response','stop','new_chat'] as role}<option value={role}>{role.replaceAll('_',' ')}</option>{/each}</select></label><button class="primary" disabled={!node||!app.ready} onclick={record}>Confirm mapping</button><small>Matches tag, role and label. Ambiguous or stale controls fail closed.</small></div>{/if}
  </article>
  <article class="panel padded"><h2>Register a manually selected model</h2><p>Use this only when the website does not expose a readable model selector. The label is marked <strong>USER SUPPLIED</strong>; it is not treated as verified model identity.</p><div class="inline-form"><input bind:value={label} maxlength="240" placeholder="Label for the model you selected on the website" aria-label="Manually selected model label"/><button class="secondary" disabled={!app.provider||!app.ready||!label.trim()} onclick={()=>app.perform('connector.manual_model',{provider_id:app.provider?.id,label:label.trim()})}>Register label</button></div></article>
</section>
