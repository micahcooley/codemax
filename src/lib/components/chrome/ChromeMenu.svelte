<script lang="ts">
  import {onMount} from 'svelte';
  import {app} from '../../state/app.svelte';
  import {routes} from '../../types/bridge';
  import Icon from '../Icon.svelte';

  let dialog:HTMLDialogElement;
  let left=$state(8),top=$state(46);
  const provider=$derived(app.popup==='tab-actions'?app.providers.find(p=>p.id===app.popupProvider):undefined);
  const pages=routes.filter(r=>!['browser','settings'].includes(r.id));
  const position=$derived(provider?app.tabs.findIndex(p=>p.id===provider.id):-1);

  onMount(()=>{
    const previous=document.activeElement as HTMLElement|null;
    dialog.showModal();
    const place=()=>{
      const rect=dialog.getBoundingClientRect();
      left=Math.max(8,Math.min(app.contextMenu?.x??8,window.innerWidth-rect.width-8));
      top=Math.max(8,Math.min(app.contextMenu?.y??46,window.innerHeight-rect.height-8));
    };
    place();
    window.addEventListener('resize',place);
    dialog.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
    return()=>{window.removeEventListener('resize',place);if(previous?.isConnected)previous.focus();};
  });
  function dismiss(){app.popup=null;app.contextMenu=null;}
  function keys(event:KeyboardEvent){
    if(event.key==='Escape'){event.preventDefault();dismiss();return;}
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();
    const items=[...dialog.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')];
    const index=items.indexOf(document.activeElement as HTMLButtonElement);
    const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
    items[next]?.focus();
  }
  function togglePinned(){if(provider){void app.perform('provider.update',{provider_id:provider.id,pinned:!provider.pinned});dismiss();}}
  function move(offset:-1|1){if(provider){app.moveTab(provider.id,offset);dismiss();}}
</script>

<dialog class="chrome-menu" bind:this={dialog} style:left={`${left}px`} style:top={`${top}px`} aria-label={provider?`${provider.label} actions`:'Codemax menu'} onkeydown={keys} oncancel={dismiss} onclick={event=>{if(event.target===dialog)dismiss();}}>
  <div class="chrome-menu-heading"><strong>{provider?provider.label:'Codemax'}</strong><small>{provider?provider.origin:'Browse · discover · connect'}</small></div>
  <div role="menu" aria-label={provider?`${provider.label} actions`:'Codemax pages and actions'}>
    {#if provider}
      <button role="menuitem" onclick={()=>app.openProvider(provider.id)}><Icon name="globe" size={15}/><span>Open website</span></button>
      <button role="menuitem" onclick={togglePinned}><Icon name="pin" size={15}/><span>{provider.pinned?'Allow website to sleep':'Keep website awake'}</span></button>
      <button role="menuitem" disabled={position<=0} onclick={()=>move(-1)}><Icon name="back" size={15}/><span>Move tab left</span></button>
      <button role="menuitem" disabled={position<0||position>=app.tabs.length-1} onclick={()=>move(1)}><Icon name="arrow" size={15}/><span>Move tab right</span></button>
      <button role="menuitem" onclick={()=>{app.selectedProvider=provider.id;app.navigate('detector');}}><Icon name="scan" size={15}/><span>Inspect connector</span></button>
      <button role="menuitem" onclick={()=>app.closeProvider(provider.id)}><Icon name="close" size={15}/><span>Close tab</span><kbd>Ctrl W</kbd></button>
      <hr/>
      <button role="menuitem" onclick={()=>app.showPopup('clear-profile',provider.id)}><Icon name="refresh" size={15}/><span>Clear local profile</span></button>
      <button role="menuitem" class="danger-text" onclick={()=>app.showPopup('remove-provider',provider.id)}><Icon name="trash" size={15}/><span>Remove website</span></button>
    {:else}
      <button role="menuitem" onclick={()=>app.newTab()}><Icon name="plus" size={15}/><span>New tab</span><kbd>Ctrl T</kbd></button>
      <button role="menuitem" onclick={()=>{app.toggleShelf();dismiss();}}><Icon name="panel" size={15}/><span>{app.shelfVisible?'Hide provider sidebar':'Show provider sidebar'}</span></button>
      <button role="menuitem" onclick={()=>{app.navigate('browser');app.inspectorVisible=!app.inspectorVisible;app.saveLayout();}}><Icon name="scan" size={15}/><span>Connection inspector</span></button>
      <hr/>
      {#each pages as page(page.id)}
        <button role="menuitem" aria-label={page.title} class:active={app.route===page.id} onclick={()=>app.navigate(page.id)}><Icon name={page.icon} size={15}/><span>{page.title}</span>{#if page.id==='providers'}<small>{app.detectedProviders.length}</small>{:else if page.id==='models'}<small>{app.models.length}</small>{/if}</button>
      {/each}
      <hr/>
      <button role="menuitem" onclick={()=>app.navigate('settings')}><Icon name="settings" size={15}/><span>Settings</span></button>
      <button role="menuitem" onclick={()=>app.showPopup('commands')}><Icon name="command" size={15}/><span>Commands</span><kbd>Ctrl K</kbd></button>
      <button role="menuitem" onclick={()=>app.showPopup('shortcuts')}><Icon name="key" size={15}/><span>Keyboard shortcuts</span></button>
    {/if}
  </div>
</dialog>
