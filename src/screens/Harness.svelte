<script lang="ts">
 import {app} from '../lib/state/app.svelte';import Icon from '../lib/components/Icon.svelte';import ExternalClients from '../lib/components/ExternalClients.svelte';
</script>
<section class="screen"><div class="screen-inner connect-screen">
<header class="screen-head"><div><div class="breadcrumb">Codemax / Harness</div><h1>Connect a client</h1><p>Choose a client and a website model. Copy one launch command; your signed-in website supplies the quota.</p></div><button class="secondary" onclick={()=>app.navigate('providers')}><Icon name="globe" size={15}/>Manage providers</button></header>
<ExternalClients/>
<p class="connection-footnote">Already connected? <button class="text-button" onclick={()=>app.navigate('sessions')}>View client sessions</button> · Your coding client manages its own tools and permissions.</p>
</div></section>
