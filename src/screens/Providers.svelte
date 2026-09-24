<script lang="ts">
 import {app} from '../lib/state/app.svelte';import Icon from '../lib/components/Icon.svelte';import Favicon from '../lib/components/Favicon.svelte';import {number,providerText,modelStatus,modelReady} from '../lib/format';import {catalogLookup,formatTokens} from '../lib/model-catalog';
 const sites=$derived(app.detectedProviders);
 const current=$derived(sites.find(p=>p.id===app.providerSelection)||sites.find(p=>p.id===app.selectedProvider)||sites[0]);
 const ordinary=$derived(app.providers.filter(p=>!p.detected||p.dismissed));
 const draft=$derived(current?(app.providerDrafts[current.id]||{label:current.label,hint:current.context_hint,reasoning:current.reasoning_value}):{label:'',hint:0,reasoning:''});
 const dirty=$derived(!!current&&(draft.label!==current.label||draft.hint!==current.context_hint||draft.reasoning!==current.reasoning_value));
 function edit(patch:Partial<typeof draft>){if(current)app.providerDrafts={...app.providerDrafts,[current.id]:{...draft,...patch}};}
 function reset(){if(!current)return;const next={...app.providerDrafts};delete next[current.id];app.providerDrafts=next;}
 async function policy(patch:Record<string,unknown>){
  if(!current)return;const id=current.id;
  const apply=()=>app.perform('provider.update',{provider_id:id,...patch});
  if((patch.exposed===false||patch.scan_enabled===false||patch.dismissed===true)&&(current.active||app.activeTask?.provider_id===id)){
   await app.ask('Change this provider and stop active work?','This change cancels the current client request or website tool task. Website login data is kept.','Apply and stop work',apply);return;
  }
  await apply();
 }
 async function save(){
  if(!current||!draft.label.trim())return;const id=current.id;
  if(await app.perform('provider.update',{provider_id:id,label:draft.label.trim(),context_hint:Number(draft.hint),reasoning_value:draft.reasoning})!==undefined){
   const next={...app.providerDrafts};delete next[id];app.providerDrafts=next;app.notification='Provider overrides saved.';
  }
 }
</script>
<section class="screen"><div class="screen-inner">
 <header class="screen-head"><div><div class="breadcrumb">Codemax / Websites</div><h1>Providers</h1><p>Websites recognized as AI chats. Choose which models your client can use.</p></div><button class="secondary" onclick={()=>app.newTab()}><Icon name="plus" size={15}/>Browse a website</button></header>
 {#if current}
 <div class="provider-settings" class:single-provider-pane={app.shelfVisible}>{#if !app.shelfVisible}<nav class="provider-selector" aria-label="Detected providers">
   {#each sites as site(site.id)}<button class="provider-choice" class:active={current.id===site.id} aria-current={current.id===site.id?'true':undefined} onclick={()=>app.providerSelection=site.id}><span class="site-letter"><Favicon origin={site.origin} label={site.label} size={18}/></span><span class="site-details"><strong title={site.label}>{site.label}</strong><small>{site.models.filter(m=>modelReady(m,site)).length} ready{#if !site.exposed||site.state!=='READY'} · {site.exposed?providerText(site):'Disabled'}{/if}</small></span></button>{/each}
 <p class="discovery-note"><Icon name="scan" size={13}/> Discovery follows your browsing. It does not send test prompts or spend quota.</p></nav>{:else}<label class="field provider-detail-picker"><span>Provider settings</span><select aria-label="Provider to configure" value={current.id} onchange={e=>app.providerSelection=Number(e.currentTarget.value)}>{#each sites as site(site.id)}<option value={site.id}>{site.label}</option>{/each}</select></label>{/if}
 <div>
 <section class="section"><div class="section-title"><div><h2>{current.label}</h2><p class="mono provider-origin">{current.origin}</p></div><button class="secondary" disabled={!app.ready} onclick={()=>app.openProvider(current.id)}><Icon name="globe" size={14}/>{current.open_tab?'Open tab':'Reopen website'}</button></div>
 <label class="setting-line"><div><strong>Available to my client</strong><p>Allow this website’s enabled models in the local registry.</p></div><input type="checkbox" aria-label="Expose provider to harness" checked={current.exposed} disabled={!app.ready||app.busy('provider.update')} onchange={e=>{const value=e.currentTarget.checked;e.currentTarget.checked=current.exposed;void policy({exposed:value});}}/></label>

 {#if !current.exposed}<p class="inline-status">Not shared with clients. Enable this provider to make its selected models available.</p>{:else if !current.scan_enabled}<p class="inline-status">Discovery paused. Resume it and reopen the website to refresh availability.</p>{:else if !current.open_tab}<p class="inline-status">This profile is saved. Reopen the website to check its current models and login.</p>{/if}
 </section>
 <section class="section"><div class="section-title"><h2>Models</h2><span class="tag">{current.models.filter(m=>modelReady(m,current)).length} ready / {current.models.length} found</span></div>
 {#each current.models as model(model.id)}<label class="setting-line"><div><strong>{model.display_name}</strong><p>{modelStatus(model,current)}{model.available?'':' · reopen the website to check'}</p></div><input type="checkbox" aria-label={`Expose ${model.display_name}`} checked={model.enabled} disabled={!app.ready||app.busy('model.update')} onchange={e=>{const value=e.currentTarget.checked;e.currentTarget.checked=model.enabled;void app.perform('model.update',{provider_id:current.id,model:model.id,enabled:value});}}/></label>{/each}
 {#if !current.models.length}<p>No model names are visible yet. Open the website’s model menu normally to let discovery observe them.</p>{/if}
 </section>
 <details class="advanced-client"><summary>Detected capabilities · model, reasoning, and context</summary>
   <table class="permission-table"><tbody><tr><td>Current model</td><td>{current.current_model||'Not exposed yet'}{#if current.model_locked}<span class="secondary-line">Locked by the website for this conversation; start a new chat to switch</span>{/if}</td></tr><tr><td>Reasoning levels</td><td>{current.reasoning_modes?.length?current.reasoning_modes.map(m=>m.label).join(' · '):current.mappings.reasoning?'Control observed; options unknown':'Unknown'}{#if current.reasoning_locked}<span class="secondary-line">Locked by the website for this conversation; start a new chat to change it</span>{/if}</td></tr>{#each current.models as model(model.id)}{@const docs=catalogLookup(model.id,model.display_name)}<tr><td>{model.display_name} · context</td><td>{current.context_hint?`${number(current.context_hint)} · user supplied`:model.context.nominal?`${number(model.context.nominal)} · website reported`:model.context.advertised_label?`${model.context.advertised_label} · exact count unknown`:docs?.contextTokens?`${formatTokens(docs.contextTokens)} · vendor docs ${docs.contextSource?.retrieved}`:'Unknown'}</td></tr><tr><td>{model.display_name} · reasoning</td><td>{model.reasoning?.control_observed?'Control observed on website':docs?.reasoning===true?`Supported per vendor docs · ${docs.reasoningNote}`:docs?.reasoning===false?'Not advertised by vendor':'Unknown'}</td></tr><tr><td>{model.display_name} · tokenizer</td><td>{model.tokenizer.name?`${model.tokenizer.name} · identity only`:'Unknown; usage remains estimated'}</td></tr>{/each}</tbody></table>
 <p class="field-hint">A model’s advertised context is not a measured website conversation budget. Unknown values remain unknown.</p><p class="discovery-note">{current.discovery_reason}</p>
 </details>
 <details class="advanced-client"><summary>Advanced · overrides, mapping, and lifecycle{dirty?' · unsaved changes':''}</summary>
  <label class="setting-line"><div><strong>Keep discovering this website</strong><p>Update detected controls and model choices while you browse.</p></div><input type="checkbox" aria-label="Scan provider automatically" checked={current.scan_enabled} disabled={!app.ready||app.busy('provider.update')} onchange={e=>{const value=e.currentTarget.checked;e.currentTarget.checked=current.scan_enabled;void policy({scan_enabled:value});}}/></label>
 <form onsubmit={e=>{e.preventDefault();void save();}}>
 <label class="field"><span>Display name</span><input aria-label="Provider display name" value={draft.label} oninput={e=>edit({label:e.currentTarget.value})} maxlength="240" required/></label>
 <label class="field"><span>Context budget override · user supplied</span><input aria-label="Provider context override" type="number" value={draft.hint} oninput={e=>edit({hint:Number(e.currentTarget.value)})} min="0" max="10000000" step="1" required/><span class="field-hint">0 leaves the limit unknown. This cannot increase the website’s actual limit.</span></label>
 <label class="field"><span>Preferred reasoning value</span><select aria-label="Provider reasoning override" value={draft.reasoning} onchange={e=>edit({reasoning:e.currentTarget.value})}><option value="">Leave website default</option>{#if draft.reasoning&&!(current.reasoning_modes||[]).some(m=>m.value===draft.reasoning)}<option value={draft.reasoning}>{draft.reasoning} · not currently observed</option>{/if}{#each current.reasoning_modes||[] as mode}<option value={mode.value}>{mode.label}</option>{/each}</select></label>
 <div class="button-group"><button class="primary" disabled={!app.ready||!!current.active||!dirty||!draft.label.trim()||app.busy('provider.update')}>{app.busy('provider.update')?'Saving…':'Save overrides'}</button><button type="button" class="secondary" disabled={!dirty} onclick={reset}>Reset changes</button></div>
 {#if current.active}<p class="field-hint">Stop the active request before saving overrides. Your edits are kept while you visit other pages.</p>{:else if dirty}<p class="inline-status">Unsaved changes · kept while this application is open.</p>{/if}
 </form>
 <div class="button-group" style="margin-top:16px"><button class="secondary" onclick={()=>{app.selectedProvider=current.id;app.navigate('detector');}}>Inspect mappings</button><button class="secondary" disabled={!app.ready||current.active||!current.open_tab} onclick={()=>app.perform('provider.rescan',{provider_id:current.id})}>Rescan</button></div>
 <label class="setting-line"><div><strong>Keep this website awake</strong><p>Exclude it from idle suspension. Active requests stay awake automatically.</p></div><input type="checkbox" aria-label="Keep provider awake" checked={current.pinned} disabled={!app.ready} onchange={e=>policy({pinned:e.currentTarget.checked})}/></label>
 <button class="text-button danger-text" disabled={!app.ready} style="margin-top:18px" onclick={()=>policy({dismissed:true,exposed:false})}>Treat as an ordinary website</button>
 </details></div></div>
 {:else}<div class="empty-state"><Icon name="globe" size={28}/><h2>Browse first. Providers follow.</h2><p>No websites have passed discovery yet. Open an AI chat website and sign in normally. Ordinary search pages are not added as providers.</p><button class="primary" onclick={()=>app.newTab()}>Open a browser tab<Icon name="arrow" size={14}/></button></div>{/if}
 {#if ordinary.length}<details class="advanced-client"><summary>Other browser profiles · {ordinary.length} not exposed</summary>{#each ordinary as site(site.id)}<div class="setting-line"><div><strong>{site.label}</strong><p>{site.dismissed?'Excluded from discovery':site.discovery_reason||'No positive provider evidence'} · {site.origin}</p></div><button class="text-button" disabled={!app.ready} onclick={()=>app.openProvider(site.id)}>Open</button>{#if site.dismissed}<button class="text-button" disabled={!app.ready} onclick={()=>app.perform('provider.update',{provider_id:site.id,dismissed:false,scan_enabled:true})}>Resume discovery</button>{/if}</div>{/each}</details>{/if}
</div></section>
