<script lang="ts">
  import TabActivity from '../TabActivity.svelte';import {app} from '../../state/app.svelte';import {routes} from '../../types/bridge';
  import {initials,providerText} from '../../format';import Icon from '../Icon.svelte';
  const navigation=$derived(routes.filter(r=>!['browser','settings'].includes(r.id)));
  function context(event:MouseEvent,id:number){event.preventDefault();app.contextMenu={id,y:Math.max(92,Math.min(event.clientY,window.innerHeight-265))};}
</script>
<aside class="workspace-sidebar" class:collapsed={!app.sidebarVisible} aria-label="Workspace sidebar">
  <div class="workspace-title"><span class="workspace-logo"><Icon name="folder" size={15}/></span><span><strong>Personal workspace</strong><small>Websites, connected locally</small></span></div>
  <div class="sidebar-section"><span class="label">Your websites</span><span class="spacer"></span><span class="count">{app.providers.length}</span></div>
  <div class="site-list">
    {#each [...app.providers].sort((a,b)=>Number(b.pinned)-Number(a.pinned)||a.id-b.id) as provider(provider.id)}
      <button class="site-row" class:selected={app.selectedProvider===provider.id&&app.route==='browser'} title={`${provider.label} · ${providerText(provider)}`} onclick={()=>app.openProvider(provider.id)} oncontextmenu={event=>context(event,provider.id)}>
        <span class="site-letter">{initials(provider.label)}</span><span class="site-details"><strong>{provider.label}</strong><small>{provider.active?'Generating a response':providerText(provider)}</small></span>
        <TabActivity {provider} loading={app.loading[provider.id]===true} online={app.ready}/>
        {#if provider.pinned&&app.sidebarVisible}<Icon name="pin" size={11}/>{/if}
      </button>
    {/each}
    <button class="site-add" aria-label="Add website" disabled={!app.ready} onclick={()=>app.showPopup('add')}><Icon name="plus" size={17}/><span>Add website</span></button>
  </div>
  <nav class="workspace-nav" aria-label="Workspace tools">{#each navigation as route(route.id)}<button class:active={app.route===route.id} aria-current={app.route===route.id?'page':undefined} title={route.title} onclick={()=>app.navigate(route.id)}><Icon name={route.icon} size={16}/><span>{route.title}</span>{#if route.id==='models'}<small>{app.models.length}</small>{:else if route.id==='sessions'&&app.sessions.some(s=>s.status==='ACTIVE')}<span class="dot busy"></span>{/if}</button>{/each}</nav>
  <div class="sidebar-bottom"><button class:active={app.route==='settings'} title="Settings" onclick={()=>app.navigate('settings')}><Icon name="settings" size={16}/><span>Settings</span></button><button title="Command palette" onclick={()=>app.showPopup('commands')}><Icon name="command" size={15}/><span>Commands</span>{#if app.sidebarVisible}<kbd>Ctrl K</kbd>{/if}</button><div class="local-note"><Icon name="shield" size={12}/><span>Private profiles. Local gateway.</span></div></div>
</aside>
{#if app.contextMenu}
  {@const provider=app.providers.find(p=>p.id===app.contextMenu?.id)}
  {#if provider}<div class="context-menu" style:left="8px" style:top={`${app.contextMenu.y}px`} role="menu" aria-label={`${provider.label} actions`}>
    <button role="menuitem" onclick={()=>app.openProvider(provider.id)}><Icon name="globe" size={14}/>Open website</button>
    <button role="menuitem" onclick={()=>{void app.perform('provider.update',{provider_id:provider.id,pinned:!provider.pinned});app.contextMenu=null;}}><Icon name="pin" size={14}/>{provider.pinned?'Unpin website':'Keep website awake'}</button>
    <button role="menuitem" onclick={()=>{app.selectedProvider=provider.id;app.navigate('detector');}}><Icon name="scan" size={14}/>Inspect connector</button>
    <button role="menuitem" onclick={()=>{app.contextMenu=null;void app.closeProvider(provider.id);}}><Icon name="close" size={14}/>Close tab</button><hr/>
    <button role="menuitem" onclick={()=>app.showPopup('clear-profile',provider.id)}><Icon name="refresh" size={14}/>Clear local profile</button>
    <button role="menuitem" class="danger-text" onclick={()=>app.showPopup('remove-provider',provider.id)}><Icon name="trash" size={14}/>Remove website</button>
  </div>{/if}
{/if}
