<script lang="ts">
 import {onMount} from 'svelte';import * as bridge from './lib/api/bridge';import {app} from './lib/state/app.svelte';
 import {routes,type Route} from './lib/types/bridge';import {initials,errorText} from './lib/format';
 import TabActivity from './lib/components/TabActivity.svelte';import Icon from './lib/components/Icon.svelte';import Dialog from './lib/components/Dialog.svelte';import Sidebar from './lib/components/chrome/Sidebar.svelte';
 import Providers from './screens/Providers.svelte';import Tools from './screens/Tools.svelte';
 import Home from './screens/Home.svelte';import ProviderBrowser from './screens/ProviderBrowser.svelte';import Models from './screens/Models.svelte';import Harness from './screens/Harness.svelte';import Sessions from './screens/Sessions.svelte';import Detector from './screens/Detector.svelte';import Settings from './screens/Settings.svelte';
 let address=$state(''),addressEditing=$state(false),addressInput:HTMLInputElement;
 let addUrl=$state(''),addLabel=$state(''),query=$state(''),commandIndex=$state(0),findQuery=$state('');
 let dragTab:number|null=null;let darkSystem=$state(true);let maximized=$state(false);
 const online=$derived(app.ready&&app.snapshot?.api.running);
 const commands=$derived([
  ...routes.map(r=>({id:r.id,title:r.title,description:r.description,icon:r.icon,action:()=>app.navigate(r.id)})),
  {id:'new',title:'New website tab',description:'Open another website in an isolated profile',icon:'plus',action:()=>{app.popup=null;app.newTab();}},
  {id:'add',title:'Add a website',description:'Enter any supported AI chat URL',icon:'globe',action:()=>void app.showPopup('add')},
  {id:'inspector',title:'Toggle connection inspector',description:'Show or hide page controls and model details',icon:'scan',action:()=>{app.popup=null;app.inspectorVisible=!app.inspectorVisible;app.saveLayout();}},
  {id:'shortcuts',title:'Keyboard shortcuts',description:'Navigate without leaving the keyboard',icon:'command',action:()=>void app.showPopup('shortcuts')},
  ...app.providers.map(p=>({id:`provider-${p.id}`,title:p.label,description:p.origin,icon:'globe',action:()=>{app.popup=null;void app.openProvider(p.id);}}))
 ].filter(c=>`${c.title} ${c.description}`.toLowerCase().includes(query.toLowerCase())));
 const target=$derived(app.providers.find(p=>p.id===app.popupProvider));
 $effect(()=>{if(!addressEditing){const p=app.provider;address=p?(app.origin&&app.origin!==p.origin?app.origin:(p.current_url||p.url)):'';}});
 $effect(()=>{if(app.focusAddress>0&&addressInput){addressInput.focus();addressInput.select();}});
 $effect(()=>{if(app.route!=='browser')void bridge.hideProviders().catch(error=>app.error=String(error));});
 $effect(()=>{document.documentElement.dataset.theme=app.preferences.theme==='system'?(darkSystem?'dark':'light'):app.preferences.theme;});
 $effect(()=>{if(app.popup!=='commands'){query='';commandIndex=0;}else{void query;commandIndex=0;}});
 onMount(()=>{
  app.restoreLayout();const media=matchMedia('(prefers-color-scheme:dark)');darkSystem=media.matches;
  const changed=(e:MediaQueryListEvent)=>{darkSystem=e.matches;};media.addEventListener('change',changed);
  let disposed=false;let unsubscribe=()=>{};
  void bridge.observe({
   snapshot:state=>{app.snapshot=state;if(app.selectedProvider!==null&&!state.providers.some(p=>p.id===app.selectedProvider))app.selectedProvider=null;},
   host:state=>{app.host=state;if(state.state!=='READY'){app.snapshot=null;app.loading={};void bridge.hideProviders().catch(()=>{});}},
   error:message=>app.error=message,notice:message=>app.notification=message,
   shortcut:key=>{if(key==='address')app.focusAddress++;else void app.showPopup('commands');},
   browser:(id,origin,loading)=>{app.liveOrigins={...app.liveOrigins,[id]:origin};app.loading={...app.loading,[id]:loading};}
  }).then(stop=>{if(disposed)stop();else unsubscribe=stop;}).catch(error=>app.error=String(error));
  return()=>{disposed=true;unsubscribe();media.removeEventListener('change',changed);app.secret='';};
 });
 async function windowAction(action:string){try{const state=await bridge.windowControl(action);maximized=state.maximized;}catch(error){app.error=String(error);}}
 function keyboard(event:KeyboardEvent){
  const mod=event.ctrlKey||event.metaKey,key=event.key.toLowerCase();
  if(app.popup==='commands'&&['ArrowDown','ArrowUp','Enter'].includes(event.key)){
   event.preventDefault();if(event.key==='Enter')commands[commandIndex]?.action();else commandIndex=(commandIndex+(event.key==='ArrowDown'?1:-1)+Math.max(commands.length,1))%Math.max(commands.length,1);return;
  }
  if(mod&&key==='k'){event.preventDefault();void app.showPopup(app.popup==='commands'?null:'commands');}
  else if(mod&&key==='l'){event.preventDefault();app.focusAddress++;}
  else if(mod&&key==='t'){event.preventDefault();app.newTab();}
  else if(mod&&key==='w'){event.preventDefault();if(app.provider)void app.closeProvider(app.provider.id);}
  else if(mod&&key==='f'&&app.route==='browser'&&app.provider){event.preventDefault();app.findVisible=!app.findVisible;}
  else if(mod&&/^[1-9]$/.test(key)){event.preventDefault();const tab=key==='9'?app.tabs.at(-1):app.tabs[Number(key)-1];if(tab)void app.openProvider(tab.id);}
  else if(mod&&['+','=','-','0'].includes(key)&&app.route==='browser'){event.preventDefault();void app.control(key==='0'?'zoom_reset':key==='-'?'zoom_out':'zoom_in');}
  else if(event.altKey&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();void app.control(event.key==='ArrowLeft'?'back':'forward');}
  else if(event.key==='Escape'){app.contextMenu=null;app.findVisible=false;app.notification='';app.popup=null;}
 }
 function resizeSidebar(event:PointerEvent){const el=event.currentTarget as HTMLElement;el.setPointerCapture(event.pointerId);const start=event.clientX,width=app.sidebarWidth;
  const move=(e:PointerEvent)=>{app.sidebarWidth=Math.max(180,Math.min(320,width+e.clientX-start));};
  const end=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',end);el.removeEventListener('pointercancel',end);app.saveLayout();};
  el.addEventListener('pointermove',move);el.addEventListener('pointerup',end,{once:true});el.addEventListener('pointercancel',end,{once:true});
 }
 function sidebarKey(e:KeyboardEvent){if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();app.sidebarWidth=Math.max(180,Math.min(320,app.sidebarWidth+(e.key==='ArrowRight'?16:-16)));app.saveLayout();}}
 function reorder(event:DragEvent,id:number){event.preventDefault();if(dragTab===null||dragTab===id)return;const ids=app.tabs.map(p=>p.id).filter(i=>i!==dragTab);ids.splice(ids.indexOf(id),0,dragTab);app.tabOrder=ids;dragTab=null;app.saveLayout();}
 async function add(event:SubmitEvent){event.preventDefault();if(await app.addWebsite(addUrl,addLabel)){addUrl='';addLabel='';}}
 async function confirm(){
  if(app.popup==='rotate-key'){if(await app.perform('key.regenerate',{confirmed:true})!==undefined){app.secret='';app.popup=null;app.notification='New local API key created. Existing clients were disconnected.';}}
  else if(target){const id=target.id;if(app.popup==='close-provider')await app.closeProvider(id,true);
   else{const remove=app.popup==='remove-provider';if(await app.perform(remove?'provider.remove':'provider.clear_profile',{provider_id:id,confirmed:true})!==undefined){app.popup=null;if(app.selectedProvider===id)app.selectedProvider=null;app.notification=remove?'Website removed from this workspace.':'Local website storage cleared. Sign in again when you reopen it.';}}}
 }
 async function find(backwards=false){if(!app.provider)return;try{await bridge.find(app.provider.id,findQuery,backwards);}catch(error){app.error=String(error);}}
</script>
<svelte:window onkeydown={keyboard} onclick={event=>{if(!(event.target as HTMLElement).closest('.context-menu'))app.contextMenu=null;}}/>
<div class="app-shell" class:compact={app.preferences.compact} style={`--sidebar:${app.sidebarVisible?app.sidebarWidth:54}px;--inspector:${app.inspectorWidth}px`}>
 <header class="titlebar">
  <div class="title-brand" onpointerdown={event=>{if(event.button===0&&!((event.target as HTMLElement).closest('button')))void windowAction('drag');}} role="presentation"><span class="brand-glyph"><Icon name="layers" size={22}/></span>{#if app.sidebarVisible}<span class="brand-name">CODEMAX</span><span class="spacer"></span><span class="label" style="font-size:8px;letter-spacing:1px">WORKSPACE</span>{/if}</div>
  <div class="title-tabs" aria-label="Website tabs" role="tablist">
   {#each app.tabs as tab(tab.id)}<div class="browser-tab" class:active={app.selectedProvider===tab.id&&app.route==='browser'} draggable="true" ondragstart={event=>{dragTab=tab.id;event.dataTransfer?.setData('text/plain',String(tab.id));}} ondragover={event=>event.preventDefault()} ondrop={event=>reorder(event,tab.id)} role="presentation">
    <button class="tab-open" role="tab" aria-selected={app.selectedProvider===tab.id&&app.route==='browser'} title={tab.origin} onclick={()=>app.openProvider(tab.id)}><span class="tab-initial">{initials(tab.label).slice(0,1)}</span><span class="truncate">{tab.label}</span><TabActivity provider={tab} loading={app.loading[tab.id]===true} online={app.ready}/></button><button class="tab-close" aria-label={`Close ${tab.label} tab`} onclick={()=>app.closeProvider(tab.id)}><Icon name="close" size={11}/></button>
   </div>{/each}
   {#if app.selectedProvider===null&&app.route==='browser'}<div class="browser-tab active"><span class="tab-initial"><Icon name="globe" size={13}/></span><span>New tab</span></div>{:else if app.route!=='browser'}<div class="browser-tab active"><span class="tab-initial"><Icon name={routes.find(r=>r.id===app.route)?.icon||'grid'} size={13}/></span><span class="truncate">{routes.find(r=>r.id===app.route)?.title}</span><button class="tab-close" style="margin-left:auto" aria-label="Return to browser" onclick={()=>app.navigate('browser')}><Icon name="close" size={11}/></button></div>{/if}
   <button class="icon-button new-tab" aria-label="New tab" title="New tab · Ctrl T" onclick={()=>app.newTab()}><Icon name="plus" size={15}/></button>
  </div>
  <div class="drag-zone" role="presentation" onpointerdown={event=>{if(event.button===0)void windowAction('drag');}} ondblclick={()=>windowAction('maximize')}></div>
  <div class="window-controls"><button aria-label="Minimize window" onclick={()=>windowAction('minimize')}><Icon name="minimize" size={14}/></button><button aria-label={maximized?'Restore window':'Maximize window'} onclick={()=>windowAction('maximize')}><Icon name="maximize" size={12}/></button><button aria-label="Close application" onclick={()=>windowAction('close')}><Icon name="close" size={15}/></button></div>
 </header>
 <div class="toolbar"><div class="navigation-buttons"><button class="icon-button" title="Toggle sidebar" aria-label="Toggle sidebar" aria-pressed={app.sidebarVisible} onclick={()=>{app.sidebarVisible=!app.sidebarVisible;app.saveLayout();}}><Icon name="panel" size={16}/></button><span class="divider"></span><button class="icon-button" aria-label="Back" disabled={!app.provider||app.route!=='browser'} onclick={()=>app.control('back')}><Icon name="back" size={16}/></button><button class="icon-button" aria-label="Forward" disabled={!app.provider||app.route!=='browser'} onclick={()=>app.control('forward')}><Icon name="arrow" size={16}/></button><button class="icon-button" aria-label="Reload website" disabled={!app.provider||app.route!=='browser'} onclick={()=>app.control('reload')}><Icon name="refresh" size={15}/></button></div>
  <form class="address-form" onsubmit={event=>{event.preventDefault();addressEditing=false;addressInput.blur();app.navigate('browser');void app.go(address);}}><Icon name={app.provider?'lock':'search'} size={13}/><input bind:this={addressInput} bind:value={address} onfocus={()=>addressEditing=true} onblur={()=>addressEditing=false} aria-label="Address bar" spellcheck="false" autocomplete="off" placeholder="Enter a website address" maxlength="2048"/><kbd>Ctrl L</kbd>{#if app.provider}<button class="icon-button" style="width:23px;height:23px;min-width:23px;min-height:23px" type="button" aria-label="Copy website URL" onclick={()=>app.clipboard(address)}><Icon name="copy" size={12}/></button>{/if}</form>
  <button class="api-pill" class:online onclick={()=>app.navigate('harness')} title="Local gateway and client setup"><span class="dot" class:online></span><span>Local API</span><span class="api-detail mono">{app.snapshot?.api.port??7331}</span></button><div class="toolbar-tail"><button class="icon-button" title="Connection inspector" aria-label="Toggle connection inspector" aria-pressed={app.inspectorVisible} onclick={()=>{app.inspectorVisible=!app.inspectorVisible;app.saveLayout();}}><Icon name="scan" size={17}/></button><button class="icon-button" title="Browser controls" aria-label="Browser controls" onclick={()=>{app.inspectorVisible=true;app.inspectorTab=app.inspectorTab==='browser'?'connection':'browser';app.navigate('browser');}}><Icon name="more" size={18}/></button></div>
 </div>
 {#if app.findVisible&&app.provider&&app.route==='browser'}<form class="findbar" onsubmit={event=>{event.preventDefault();void find();}}><Icon name="search" size={15}/><input aria-label="Find on page" bind:value={findQuery} placeholder="Find on this page" maxlength="256"/><small>Enter to find next</small><button type="button" class="icon-button" aria-label="Previous match" onclick={()=>find(true)}><Icon name="back" size={13}/></button><button class="icon-button" aria-label="Next match"><Icon name="arrow" size={13}/></button><button type="button" class="icon-button" aria-label="Close find" onclick={()=>app.findVisible=false}><Icon name="close" size={13}/></button></form>{/if}
 <div class="workspace"><Sidebar/>{#if app.sidebarVisible}<div class="resize-handle" role="slider" tabindex="0" aria-label="Sidebar width" aria-orientation="vertical" aria-valuenow={app.sidebarWidth} aria-valuemin="180" aria-valuemax="320" onpointerdown={resizeSidebar} onkeydown={sidebarKey}></div>{:else}<div style="width:1px;background:var(--line)"></div>{/if}
  <main class="workspace-content">
   {#if app.host.state!=='READY'}<div class="layout-notice" class:error={['FAILED','LOST'].includes(app.host.state)}><Icon name={app.host.state==='STARTING'?'bolt':'alert'} size={15}/><span>{app.host.state==='STARTING'?'Starting the native Zag gateway…':errorText(app.host.code||'NATIVE_HOST_REQUIRED')}</span><button class="text-button" onclick={()=>app.navigate('settings')}>Runtime settings</button></div>{/if}
   {#if app.error}<div class="layout-notice error" role="alert"><Icon name="alert" size={15}/><span>{errorText(app.error)}</span><button class="icon-button" aria-label="Dismiss error" onclick={()=>app.error=''}><Icon name="close" size={13}/></button></div>{/if}
   {#if app.notification}<div class="layout-notice" role="status"><Icon name="check" size={15}/><span>{app.notification}</span><button class="icon-button" aria-label="Dismiss notification" onclick={()=>app.notification=''}><Icon name="close" size={13}/></button></div>{/if}
   {#if app.route==='browser'}<ProviderBrowser/>{:else if app.route==='providers'}<Providers/>{:else if app.route==='tools'}<Tools/>{:else if app.route==='models'}<Models/>{:else if app.route==='sessions'}<Sessions/>{:else if app.route==='harness'}<Harness/>{:else if app.route==='detector'}<Detector/>{:else if app.route==='settings'}<Settings/>{:else}<Home/>{/if}
  </main>
 </div>
 <footer class="statusbar"><span class="dot" class:online></span><button class="mono" onclick={()=>app.navigate('harness')}>{app.snapshot?`127.0.0.1:${app.snapshot.api.port}`:'Gateway offline'}</button><span class="divider"></span><span>{app.models.length} models</span><span class="divider"></span><button onclick={()=>app.navigate('sessions')}>{app.sessions.filter(s=>s.status==='ACTIVE').length} active sessions</button><span class="spacer"></span><span>{app.pending?'Applying changes…':app.provider?.active?'Forwarding stream':'Symbolic discovery'}</span><span class="divider"></span><Icon name="shield" size={11}/><span>Local only</span></footer>
</div>
{#if app.popup==='add'}<Dialog title="Add a website"><form onsubmit={add}><p class="dialog-description">Open the public chat page, then sign in on the website. Its browser profile is kept separate from your other providers.</p><label class="field">Website address<input bind:value={addUrl} required maxlength="2048" placeholder="https://chat.example.com" autocomplete="url" spellcheck="false"/></label><label class="field">Name in your workspace <span class="faint">Optional</span><input bind:value={addLabel} maxlength="120" placeholder="Use the website’s name" autocomplete="off"/></label><div class="dialog-notice"><Icon name="shield" size={15}/><span>Use an HTTPS chat URL, not a sign-in callback or a link containing credentials. Website quotas still apply.</span></div><div class="dialog-actions"><button type="button" class="secondary" onclick={()=>app.popup=null}>Cancel</button><button class="primary" disabled={!app.ready||!addUrl.trim()||app.pending>0}>Open website<Icon name="arrow" size={14}/></button></div></form></Dialog>
{:else if app.popup==='commands'}<Dialog title="Go anywhere"><label class="command-search"><Icon name="search" size={18}/><input aria-label="Search commands" bind:value={query} placeholder="Search pages, websites, and actions…" autocomplete="off"/></label><div class="command-results">{#each commands as command,index(command.id)}<button class:selected={index===commandIndex} onclick={command.action}><Icon name={command.icon} size={17}/><span><strong>{command.title}</strong><small>{command.description}</small></span>{#if index===commandIndex}<kbd>↵</kbd>{/if}</button>{/each}{#if !commands.length}<p class="muted" style="padding:20px 5px">No matching commands.</p>{/if}</div><div class="command-footer">↑ ↓ to navigate <span style="margin-left:15px">Enter to open</span><span style="float:right">Esc to close</span></div></Dialog>
{:else if app.popup==='shortcuts'}<Dialog title="Keyboard shortcuts">{#each [['Address bar','Ctrl L'],['Commands','Ctrl K'],['New website tab','Ctrl T'],['Close website tab','Ctrl W'],['Switch tabs','Ctrl 1–9'],['Find on website','Ctrl F'],['Back / forward','Alt ← / →'],['Zoom in / out','Ctrl + / −'],['Reset zoom','Ctrl 0']] as [label,key]}<div class="shortcut-row"><span>{label}</span><kbd>{key}</kbd></div>{/each}<p class="field-hint" style="margin-top:18px">Address and command shortcuts also work while a provider page has focus. Other shortcuts may be handled by the website.</p></Dialog>
{:else if app.popup}<Dialog title={app.popup==='rotate-key'?'Create a new local API key?':app.popup==='close-provider'?'Stop generation and close this tab?':app.popup==='remove-provider'?`Remove ${target?.label||'this website'}?`:`Clear ${target?.label||'this website'}’s profile?`}><p class="dialog-description">{app.popup==='rotate-key'?'The current key will stop working and connected requests will be cancelled. Copy the new key into your clients. This does not change your website accounts.':app.popup==='close-provider'?'This website is currently generating a response. Closing it cancels that request. Its login profile is preserved.':app.popup==='remove-provider'?'This removes the website, connector, and local browser storage from your workspace. Related sessions will be ended. Your remote account is not deleted.':'This deletes this website’s local cookies and storage and closes its tab. You will need to sign in again. Other website profiles are not affected.'}</p><div class="dialog-actions"><button class="secondary" onclick={()=>app.popup=null}>Cancel</button><button class="primary danger" disabled={app.pending>0} onclick={confirm}>{app.popup==='rotate-key'?'Regenerate key':app.popup==='remove-provider'?'Remove website':app.popup==='close-provider'?'Stop and close':'Clear local profile'}</button></div></Dialog>{/if}
