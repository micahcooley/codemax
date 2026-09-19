<script lang="ts">
  import {app} from '../lib/state/app.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import Badge from '../lib/components/Badge.svelte';
  import Empty from '../lib/components/Empty.svelte';
  const readyProviders = $derived(app.providers.filter(p => p.state === 'READY').length);
</script>
<section class="screen">
  <div class="page-heading"><div><div class="eyebrow">LOCAL MODEL WORKSPACE</div><h1>Overview</h1><p>Your websites. One local endpoint. Explicit capability evidence.</p></div><button class="primary" disabled={!app.ready} onclick={() => app.showPopup('add')}><Icon name="plus"/>Add provider</button></div>
  <div class="metric-grid">
    <article class="metric"><div><Icon name="bolt"/><span>Local API</span></div><strong>{app.snapshot?.api.running ? 'Listening' : 'Not connected'}</strong><small class="mono">{app.snapshot ? `127.0.0.1:${app.snapshot.api.port}` : 'Waiting for Zag handshake'}</small></article>
    <article class="metric"><div><Icon name="globe"/><span>Ready providers</span></div><strong>{readyProviders}<span class="muted"> / {app.providers.length}</span></strong><small>Signed-in, mapped and available</small></article>
    <article class="metric"><div><Icon name="layers"/><span>Registered models</span></div><strong>{app.models.length}</strong><small>Observed or explicitly supplied</small></article>
    <article class="metric"><div><Icon name="history"/><span>Active sessions</span></div><strong>{app.snapshot?.sessions.filter(s => s.status === 'ACTIVE').length ?? 0}</strong><small>No automatic provider fallback</small></article>
  </div>
  <div class="notice warning"><Icon name="shield"/><div><strong>Source alpha — not a qualified release</strong><p>The native build, live website compatibility and coding-harness tool cycle have not been verified. The included fixture tests do not establish those capabilities.</p></div></div>
  <div class="two-columns">
    <article class="panel"><div class="panel-heading"><h2>Providers</h2><button class="text-button" onclick={() => app.route = 'browser'}>Open browser<Icon name="arrow" size={14}/></button></div>
      {#if !app.providers.length}<Empty title="No websites connected" description="Start with a chat website you are authorized to use. Passwords stay in the browser profile." icon="globe"/>
      {:else}<div class="row-list">{#each app.providers as provider (provider.id)}<button class="list-row" onclick={() => app.openProvider(provider.id)}><div class="provider-mark">{provider.label.slice(0,1).toUpperCase()}</div><span class="grow"><strong>{provider.label}</strong><small>{provider.origin}</small></span><Badge state={provider.state}/></button>{/each}</div>{/if}
    </article>
    <article class="panel"><div class="panel-heading"><h2>Connection path</h2><span class="subtle-tag">Local-first</span></div><div class="setup-steps">
      <div><span class="step">01</span><section><h3>Open a provider</h3><p>Use the native browser and sign in manually. There is no credential-import or account-rotation flow.</p></section></div>
      <div><span class="step">02</span><section><h3>Inspect the evidence</h3><p>Confirm discovered controls and models. Use the recorder when a semantic mapping needs correction.</p></section></div>
      <div><span class="step">03</span><section><h3>Connect a client</h3><p>Copy the local URL and reveal the API key explicitly. Unknown capabilities stay unknown.</p></section></div>
    </div><button class="wide secondary" onclick={() => app.route = 'harness'}>Open harness setup<Icon name="arrow" size={16}/></button></article>
  </div>
</section>
