<script lang="ts">
 import {app} from '../lib/state/app.svelte';import Icon from '../lib/components/Icon.svelte';
 import ExternalClients from '../lib/components/ExternalClients.svelte';
 let selected=$state('');
 const model=$derived(app.models.find(m=>m.id===selected)||app.models.find(m=>m.display_name.toLowerCase().replaceAll(' ','-')==='glm-5.3-flash')||app.models.find(m=>m.id===app.preferences.default_model)||app.models[0]);
 const probe=$derived(app.snapshot?.file_probe);
 const busy=$derived(probe?.state==='WAITING_FOR_TOOL'||probe?.state==='WAITING_FOR_REPLY');
 const needsPermission=$derived(probe?.state==='PERMISSION_REQUIRED');
 const canPrepare=$derived(app.ready&&!!model&&model.provider.state==='READY'&&!model.provider.active&&!model.provider.browser_busy&&!busy);
 const boundModel=$derived(app.models.find(m=>m.id===probe?.model));
 async function prepare(){if(model)await app.perform('filesystem.prepare',{provider_id:model.provider.id,model:model.id});}
 async function allow(){if(probe)await app.perform('filesystem.allow',{test_id:probe.id,confirmed:true});}
 async function revoke(){if(probe)await app.perform('filesystem.revoke',{test_id:probe.id});}
</script>
<section class="screen"><div class="screen-inner">
 <header class="screen-head"><div><div class="breadcrumb">Workspace / Website clients</div><h1>Connect a client</h1><p>Use your website session and its quota. No provider API key. No paid API connection.</p></div><button class="secondary" disabled={!app.ready} onclick={()=>app.addWebsite('https://chat.z.ai/','Z.ai')}><Icon name="globe" size={15}/>Open Z.ai</button></header>
 <div class="split"><div>
  <div class="website-client-head"><span class="source-mark"><Icon name="globe" size={22}/></span><div><h2>Website access</h2><p>Messages run in the website tab you can see. Login and limits belong to that website.</p></div></div>
  <section class="section"><label class="field"><span>Website model</span><select aria-label="Website test model" bind:value={selected} disabled={!app.models.length||busy||needsPermission}><option value="">{model?`${model.provider.label} / ${model.display_name}`:'Open a website to discover models'}</option>{#each app.models as m(m.id)}<option value={m.id}>{m.provider.label} / {m.display_name}</option>{/each}</select></label>
   {#if model}<div class="note"><Icon name="shield" size={15}/><span><strong>{model.provider.label}</strong> · {model.provider.origin}<br/>Only the exact selected website model is used. Tests do not fall back to another model.</span></div>{/if}
   <p class="field-hint" style="margin-top:12px">For Z.ai, open the model menu and select GLM-5.3-Flash. If discovery needs help, record the controls in Detector. Model names are not silently substituted.</p>
   <div class="button-group" style="margin-top:16px"><button class="secondary" disabled={!model} onclick={()=>model&&app.openProvider(model.provider.id)}><Icon name="globe" size={14}/>View website tab</button><button class="text-button" onclick={()=>app.navigate('detector')}>Inspect controls<Icon name="arrow" size={13}/></button></div>
  </section>
  <section class="section" aria-label="Local filesystem test"><div class="section-title"><h2>Test the local tool connection</h2><span class="tag">Read-only · one file</span></div>
   <p>Bridge creates a harmless file with a random value on this machine. The model must request <code>read_file</code>; the local client checks your permission, reads it, and returns the result. The final answer must match the value.</p>
   <p class="field-hint" style="margin-top:10px">The website never gets a filesystem API. This test uses two normal website turns and does not touch your project files. End an existing client session on this website before testing.</p>
   {#if !probe||['IDLE','PASSED','FAILED','REVOKED'].includes(probe.state)}<button class="primary" style="margin-top:20px" disabled={!canPrepare||app.pending>0} onclick={prepare}><Icon name="folder" size={15}/>{probe?.state==='PASSED'?'Prepare another file test':'Prepare file test'}</button>{/if}
   {#if probe&&probe.state!=='IDLE'}
    <div class="note" style="margin-top:20px"><Icon name="shield" size={17}/><div><strong>{needsPermission?'Allow this exact read?':probe.state==='PASSED'?'File contents verified':probe.state==='FAILED'?'Test did not pass':probe.state==='REVOKED'?'Permission revoked':'Permissioned test in progress'}</strong><span class="probe-path">{probe.path}</span><span>{boundModel?.provider.label||'Website'} / {boundModel?.display_name||probe.model}</span></div></div>
    {#if needsPermission}<p class="field-hint" style="margin-top:12px">Allowing sends this synthetic file’s contents to the selected website. The grant permits one read, expires after five minutes, and is revoked after use or restart. No write or command permission is included.</p><div class="button-group" style="margin-top:16px"><button class="primary" disabled={app.pending>0} onclick={allow}><Icon name="shield" size={14}/>Allow one read and run</button><button class="secondary" onclick={revoke}>Deny</button></div>
    {:else}<div aria-live="polite" style="margin-top:14px"><div class="proof-step done"><Icon name="check" size={14}/>Synthetic file created locally</div><div class="proof-step" class:done={probe.read_count===1}>{#if probe.state==='WAITING_FOR_TOOL'}<span class="spinner"></span>{:else}<Icon name={probe.read_count===1?'check':'circle'} size={14}/>{/if}Model tool request → permission check → file read</div><div class="proof-step" class:done={probe.proof_verified}>{#if probe.state==='WAITING_FOR_REPLY'}<span class="spinner"></span>{:else}<Icon name={probe.proof_verified?'check':'circle'} size={14}/>{/if}Tool result → website response → exact-value verification</div></div>
     {#if probe.error}<div class="note" role="status"><Icon name="alert" size={15}/><span>{probe.error.replaceAll('_',' ')}. A model claiming it read a file does not count as a pass.</span></div>{/if}
     {#if busy}<button class="secondary" style="margin-top:14px" onclick={revoke}><Icon name="stop" size={14}/>Cancel and revoke</button>{:else}<p class="field-hint" style="margin-top:12px">{probe.read_count} permitted reads · {probe.denied_count} denied attempts. Permission is inactive. {probe.file_removed?'The synthetic file is removed.':'Synthetic file cleanup could not be confirmed.'}</p>{/if}
    {/if}
   {/if}
  </section>
 </div><aside>
  <section class="section"><div class="section-title"><h2>Permission boundary</h2><Icon name="shield" size={15}/></div><table class="permission-table"><tbody><tr><td>Website → local files</td><td>Denied</td></tr><tr><td>Local probe file</td><td>{probe?.granted?'One read allowed':'Ask first'}</td></tr><tr><td>Project / home directory</td><td>Not granted</td></tr><tr><td>File writes / deletion</td><td>Denied</td></tr><tr><td>Shell commands</td><td>Denied</td></tr><tr><td>Access after restart</td><td>Revoked</td></tr></tbody></table><p class="field-hint" style="margin-top:16px">This policy controls the built-in test client. External coding tools enforce their own project, file, and command permissions; Bridge does not override them.</p></section>
  <section class="section"><h3>Read the tab ring</h3><div class="proof-step"><span class="tab-activity working" aria-hidden="true"><span class="activity-ring"></span></span>Spinning: loading, discovering, or generating</div><div class="proof-step"><span class="tab-activity" aria-hidden="true"><span class="activity-ring"></span></span>Stationary: idle or sleeping</div><p class="field-hint" style="margin-top:10px">Hover for the exact state. Sign-in, rate limits, and errors stop the ring. Reduced-motion mode keeps the busy ring still and uses its label.</p></section>
  <section class="section"><h3>Two different connections</h3><p style="margin-top:12px"><strong>Website:</strong> your normal chat session and website quota.</p><p style="margin-top:12px"><strong>Coding client:</strong> a local tool talking to Bridge. The optional loopback address and token below protect that local connection, not a provider API.</p></section>
 </aside></div>
 <details class="advanced-client"><summary>External coding tools · advanced local connection</summary><p class="field-hint" style="margin-bottom:22px">Only needed to configure an external harness. These values target this app on your own machine; requests still run through the website and use website quota.</p><ExternalClients/></details>
</div></section>
