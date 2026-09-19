<script lang="ts">
  import {onMount} from 'svelte';
  import * as bridge from './lib/api/bridge';
  import {app} from './lib/state/app.svelte';
  import {routes, type Route} from './lib/types/bridge';
  import Icon from './lib/components/Icon.svelte';
  import Dialog from './lib/components/Dialog.svelte';
  import Home from './screens/Home.svelte';
  import ProviderBrowser from './screens/ProviderBrowser.svelte';
  import Models from './screens/Models.svelte';
  import Harness from './screens/Harness.svelte';
  import Sessions from './screens/Sessions.svelte';
  import Detector from './screens/Detector.svelte';
  import Settings from './screens/Settings.svelte';
  let url = $state(''); let label = $state(''); let query = $state('');
  const current = $derived(routes.find(route => route.id === app.route)!);
  const commands = $derived(routes.filter(route => `${route.title} ${route.description}`.toLowerCase().includes(query.toLowerCase())));
  const online = $derived(app.ready && app.snapshot?.api.running);
  let clearTarget = $state<number|null>(null);
  $effect(() => {if (app.popup === 'clear-profile') clearTarget = app.selectedProvider;});
  $effect(() => {if (app.popup !== 'commands') query = '';});
  $effect(() => {if (app.route !== 'browser') void bridge.hideProviders().catch(error => app.error = String(error));});
  onMount(() => {
    let disposed = false; let unsubscribe = () => {};
    void bridge.observe(state => {
      app.snapshot = state;
      if (app.selectedProvider === null && state.providers.length) app.selectedProvider = state.providers[0].id;
    }, state => {
      app.host = state;
      if (state.state !== 'READY') {app.snapshot = null; void bridge.hideProviders().catch(() => {});}
    }, error => app.error = error).then(stop => {if(disposed) stop(); else unsubscribe = stop;}).catch(error => app.error = String(error));
    return () => {disposed = true; unsubscribe();};
  });
  function keyboard(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); void app.showPopup(app.popup === 'commands' ? null : 'commands');
    }
    if (event.key === 'Escape') {app.notification = ''; app.error = '';}
  }
  function navigate(route: Route) {app.route = route; app.popup = null;}
  async function addProvider(event: SubmitEvent) {
    event.preventDefault();
    const result = await app.perform<{provider_id:number}>('provider.add', {url:url.trim(), label:label.trim()});
    if (result) {url='';label='';app.popup=null;await app.openProvider(result.provider_id);}
  }
  async function rotateKey() {
    const result = await app.perform('key.regenerate', {confirmed:true});
    if (result !== undefined) {app.popup=null;app.notification='Local API key regenerated. Existing clients have been disconnected.';}
  }
  async function clearProfile() {
    if (clearTarget === null) return;
    const result = await app.perform('provider.clear_profile', {provider_id:clearTarget, confirmed:true});
    if (result !== undefined) {app.popup=null;app.notification='Profile-clear request submitted. Browser errors are shown here; reopening requires a new login.';}
  }
</script>
<svelte:window onkeydown={keyboard}/>
<div class="app-shell" data-density={app.density}>
  <header class="app-header"><a class="brand" href="#overview" onclick={event=>{event.preventDefault();navigate('home');}} aria-label="Desktop AI Bridge overview"><span class="brand-mark"><Icon name="layers" size={21}/></span><span>BRIDGE<span class="brand-caption">AI WEB WORKSPACE</span></span></a><div class="header-location"><span>Workspace</span><span class="slash">/</span><strong>{current.title}</strong></div><div class="header-actions"><button class="command-trigger" onclick={()=>app.showPopup('commands')}><Icon name="search" size={15}/><span>Find a command</span><kbd>⌘ / Ctrl K</kbd></button><span class="runtime-indicator" class:online><span></span>{online?'Local API listening':app.host.state==='STARTING'?'Starting Zag':'Backend offline'}</span><button class="icon-button" aria-label="Open settings" onclick={()=>navigate('settings')}><Icon name="settings" size={18}/></button></div></header>
  <nav class="nav-rail" aria-label="Workspace navigation">{#each routes as route (route.id)}<button class:active={app.route===route.id} aria-current={app.route===route.id?'page':undefined} title={route.description} onclick={()=>navigate(route.id)}><Icon name={route.icon} size={19}/><span>{route.title}</span>{#if route.id==='models' && app.models.length}<small>{app.models.length}</small>{/if}</button>{/each}<div class="nav-bottom"><Icon name="shield" size={16}/><span>Local by design<br/><small>Source alpha · Linux x86_64</small></span></div></nav>
  <main class:browser-route={app.route==='browser'}>
    {#if app.host.state==='BROWSER_ONLY'}<div class="host-banner"><Icon name="terminal" size={17}/><span><strong>Native host required.</strong> This browser view is the presentation layer only. It does not simulate a connected Zag backend.</span></div>
    {:else if app.host.state==='FAILED' || app.host.state==='LOST'}<div class="host-banner error-banner"><Icon name="alert" size={17}/><span><strong>Backend {app.host.state.toLowerCase()}.</strong> {app.host.code??'The sidecar has not completed its handshake.'}</span><button class="text-button" onclick={()=>navigate('settings')}>Runtime settings</button></div>{/if}
    {#if app.error}<div class="error-toast" role="alert"><Icon name="alert" size={17}/><span>{app.error}</span><button class="icon-button" aria-label="Dismiss error" onclick={()=>app.error=''}><Icon name="close" size={16}/></button></div>{/if}
    {#if app.notification}<div class="notification" role="status"><Icon name="check" size={17}/><span>{app.notification}</span><button class="icon-button" aria-label="Dismiss notification" onclick={()=>app.notification=''}><Icon name="close" size={16}/></button></div>{/if}
    {#if app.route==='home'}<Home/>{:else if app.route==='browser'}<ProviderBrowser/>{:else if app.route==='models'}<Models/>{:else if app.route==='harness'}<Harness/>{:else if app.route==='sessions'}<Sessions/>{:else if app.route==='detector'}<Detector/>{:else}<Settings/>{/if}
  </main>
  <footer class="statusbar"><span class="status-left"><span class="runtime-dot" class:online></span><span class="mono">{app.snapshot?`127.0.0.1:${app.snapshot.api.port}`:'Zag not connected'}</span><span class="status-divider"></span><span>{app.models.length} models</span><span class="status-divider"></span><span>{app.snapshot?.sessions.length??0} sessions</span></span><span>{app.pending?'Applying command…':'Symbolic detector'}<span class="status-divider"></span><span class="muted">0.1.0-alpha.1 · unqualified</span></span></footer>
</div>
{#if app.popup==='add'}<Dialog title="Add a provider"><form onsubmit={addProvider}><p class="dialog-description">Open a website you are authorized to use. Login stays in its native browser profile. Discovery may require manual confirmation.</p><label class="field">Display name<input bind:value={label} required maxlength="120" placeholder="My AI provider" autocomplete="off"/></label><label class="field">Website URL<input bind:value={url} type="url" required maxlength="2048" placeholder="https://chat.example.com" autocomplete="off" spellcheck="false"/></label><div class="notice"><Icon name="shield" size={17}/><p>Use the website’s public chat URL, not an authentication callback or a URL containing a token. HTTPS is required outside the development fixture.</p></div><div class="dialog-actions"><button type="button" class="secondary" onclick={()=>app.popup=null}>Cancel</button><button class="primary" disabled={!app.ready||app.pending>0||!url.trim()||!label.trim()}>Open provider<Icon name="arrow" size={16}/></button></div></form></Dialog>
{:else if app.popup==='commands'}<Dialog title="Command palette"><label class="command-search"><Icon name="search" size={18}/><input aria-label="Search commands" bind:value={query} placeholder="Jump to a screen…" autocomplete="off"/></label><div class="command-results">{#each commands as command (command.id)}<button onclick={()=>navigate(command.id)}><Icon name={command.icon}/><span><strong>{command.title}</strong><small>{command.description}</small></span><Icon name="arrow" size={16}/></button>{/each}{#if !commands.length}<p class="muted">No matching commands.</p>{/if}</div></Dialog>
{:else if app.popup==='rotate-key'}<Dialog title="Regenerate local API key?"><p class="dialog-description">This invalidates the current key and disconnects existing inference clients. Update your client configuration with the new key. Provider account credentials are not changed.</p><div class="dialog-actions"><button class="secondary" onclick={()=>app.popup=null}>Cancel</button><button class="primary danger" disabled={app.pending>0} onclick={rotateKey}>Regenerate key</button></div></Dialog>
{:else if app.popup==='clear-profile'}<Dialog title="Clear this provider’s local profile?"><p class="dialog-description">This closes the selected browser and deletes its local cookies and website storage. You will need to sign in again. Other provider profiles and remote account data are not deleted.</p><div class="dialog-actions"><button class="secondary" onclick={()=>app.popup=null}>Cancel</button><button class="primary danger" disabled={app.pending>0||clearTarget===null} onclick={clearProfile}>Clear local profile</button></div></Dialog>{/if}
