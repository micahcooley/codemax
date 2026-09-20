<script lang="ts">
 import {app} from '../lib/state/app.svelte';import Icon from '../lib/components/Icon.svelte';import ExternalClients from '../lib/components/ExternalClients.svelte';
</script>
<section class="screen"><div class="screen-inner">
<header class="screen-head"><div><div class="breadcrumb">Codemax / Harness</div><h1>Connect a client</h1><p>Choose your coding client, start the local connection, and copy its configuration. Your signed-in websites supply the models.</p></div><button class="secondary" onclick={()=>app.navigate('providers')}><Icon name="globe" size={15}/>Manage providers</button></header>
<ExternalClients/>
<details class="advanced-client"><summary>Advanced · MCP versus model connections</summary><p>MCP connects tools to an assistant. A model-provider connection lets a harness use the website model as its model. Codemax keeps both paths separate; adding an MCP server alone does not replace a harness’s model.</p><p style="margin-top:12px">The registry updates live. A harness that caches or requires an explicit model list may need a refresh, restart, or an updated configuration export. Codemax does not secretly overwrite client configuration files.</p><button class="secondary" style="margin-top:16px" onclick={()=>app.navigate('tools')}>Manage website tools<Icon name="arrow" size={14}/></button></details>
</div></section>
