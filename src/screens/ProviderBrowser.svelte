<script lang="ts">
  import {app} from '../lib/state/app.svelte';
  import * as bridge from '../lib/api/bridge';
  import Icon from '../lib/components/Icon.svelte';
  import Badge from '../lib/components/Badge.svelte';
  import BrowserPane from '../lib/components/BrowserPane.svelte';
  let left = $state(true); let right = $state(true);
  async function control(action:'back'|'forward'|'reload') {
    if (!app.provider) return;
    try {await bridge.browserControl(app.provider.id,action);} catch (error) {app.error=String(error);}
  }
  function resize(event: PointerEvent, side:'left'|'right') {
    const start = event.clientX; const width = side === 'left' ? app.sidebarWidth : app.inspectorWidth;
    const move = (next: PointerEvent) => {const value = Math.max(180,Math.min(400,width + (next.clientX-start)*(side === 'left' ? 1 : -1))); if(side==='left') app.sidebarWidth=value; else app.inspectorWidth=value;};
    const end = () => {window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',end,{once:true});
  }
  function keyboardResize(event: KeyboardEvent, side:'left'|'right') {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return; event.preventDefault();
    const delta = (event.key==='ArrowRight'?16:-16)*(side==='left'?1:-1);
    if(side==='left') app.sidebarWidth=Math.max(180,Math.min(400,app.sidebarWidth+delta)); else app.inspectorWidth=Math.max(180,Math.min(400,app.inspectorWidth+delta));
  }
</script>
<section class="browser-workspace">
  <div class="browser-heading"><div><h1>Provider browser</h1><span>Separate profiles · explicit login · no credential capture</span></div><div class="button-group"><button class="icon-button" aria-label="Toggle provider sidebar" aria-pressed={left} onclick={() => left=!left}><Icon name="panel"/></button><button class="icon-button" aria-label="Toggle evidence inspector" aria-pressed={right} onclick={() => right=!right}><Icon name="scan"/></button><button class="primary" disabled={!app.ready} onclick={() => app.showPopup('add')}><Icon name="plus"/>Add website</button></div></div>
  <div class="browser-columns" style:grid-template-columns={`${left ? `${app.sidebarWidth}px 5px` : '0px 0px'} minmax(300px,1fr) ${right ? `5px ${app.inspectorWidth}px` : '0px 0px'}`}>
    <aside class:hidden={!left} class="provider-sidebar"><div class="sidebar-caption">PROVIDERS <span>{app.providers.length}</span></div>
      {#each app.providers as provider (provider.id)}<button class:active={app.selectedProvider===provider.id} class="provider-row" onclick={() => app.openProvider(provider.id)}><span class="provider-mark">{provider.label.slice(0,1).toUpperCase()}</span><span><strong>{provider.label}</strong><Badge state={provider.state}/></span></button>{/each}
      {#if !app.providers.length}<p class="sidebar-note">No providers yet. Add an HTTPS chat website to begin.</p>{/if}
      <div class="sidebar-bottom"><Icon name="shield" size={16}/><span>Cookies remain in the provider profile. No API-key extraction.</span></div>
    </aside>
    <div class:hidden={!left} class="resize-handle" role="separator" tabindex="0" aria-label="Provider sidebar width" aria-orientation="vertical" aria-valuenow={app.sidebarWidth} aria-valuemin="180" aria-valuemax="400" onpointerdown={event=>resize(event,'left')} onkeydown={event=>keyboardResize(event,'left')}></div>
    <div class="provider-center"><div class="browser-toolbar"><button class="icon-button" disabled={!app.provider} aria-label="Back" onclick={()=>control('back')}><Icon name="back" size={16}/></button><button class="icon-button" disabled={!app.provider} aria-label="Forward" onclick={()=>control('forward')}><Icon name="arrow" size={16}/></button><button class="icon-button" disabled={!app.provider} aria-label="Reload" onclick={()=>control('reload')}><Icon name="refresh" size={16}/></button><div class="address"><Icon name="shield" size={14}/><span>{app.provider?.url ?? 'No website selected'}</span></div></div><BrowserPane provider={app.provider}/></div>
    <div class:hidden={!right} class="resize-handle" role="separator" tabindex="0" aria-label="Evidence inspector width" aria-orientation="vertical" aria-valuenow={app.inspectorWidth} aria-valuemin="180" aria-valuemax="400" onpointerdown={event=>resize(event,'right')} onkeydown={event=>keyboardResize(event,'right')}></div>
    <aside class:hidden={!right} class="inspector"><div class="sidebar-caption">CONNECTION INSPECTOR</div>
      {#if app.provider}<h2>{app.provider.label}</h2><Badge state={app.provider.state}/><dl class="facts"><dt>Detector</dt><dd>Symbolic</dd><dt>Mapping version</dt><dd>{app.provider.mapping_version}</dd><dt>Models</dt><dd>{app.provider.models.length}</dd><dt>Context window</dt><dd>Unknown</dd><dt>Tokenizer</dt><dd>Estimated only</dd></dl>
        <h3>Observed controls</h3><div class="mapping-list">{#each Object.entries(app.provider.mappings) as [name,node]}<div><span>{name.replaceAll('_',' ')}</span><span class:available={node>0}>{node>0 ? `node ${node}` : 'not mapped'}</span></div>{/each}</div>
        {#if app.provider.last_error}<div class="inline-error">{app.provider.last_error}</div>{/if}
        <button class="wide secondary" disabled={!app.ready} onclick={()=>app.perform('provider.rescan',{provider_id:app.provider?.id})}><Icon name="scan" size={16}/>Rescan controls</button><button class="wide secondary" onclick={()=>app.route='detector'}>Open detector lab<Icon name="arrow" size={16}/></button>
        <button class="wide text-button" onclick={()=>app.perform('provider.close',{provider_id:app.provider?.id})}>Close browser view</button>
      {:else}<p class="sidebar-note">Select a provider to inspect its mappings and availability.</p>{/if}
    </aside>
  </div>
</section>
