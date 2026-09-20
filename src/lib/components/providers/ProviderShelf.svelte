<script lang="ts">
 import {app} from '../../state/app.svelte';
 import Icon from '../Icon.svelte';
 import TabActivity from '../TabActivity.svelte';
 import {initials,providerText} from '../../format';
 const sites=$derived(app.detectedProviders);
 function manage(id:number){app.providerSelection=id;app.navigate('providers');}
</script>
<aside class="provider-shelf" id="registered-providers" aria-label="Registered providers">
 <div class="shelf-heading"><span>Providers</span><button class="icon-button" aria-label="Provider settings" title="Manage registered providers" onclick={()=>app.navigate('providers')}><Icon name="settings" size={14}/></button></div>
 <nav class="shelf-list" aria-label="Registered website shortcuts">
  {#each sites as site(site.id)}
   <div class="shelf-row" class:current={app.route==='browser'?app.selectedProvider===site.id:app.route==='providers'&&(app.providerSelection??app.selectedProvider??sites[0]?.id)===site.id}>
    <button class="shelf-open" aria-label={`Open registered provider ${site.label}`} title={`${site.label} · ${site.origin}\n${!app.ready?'Last known state':!site.exposed?'Not shared with clients':providerText(site)}`} disabled={!app.ready} onclick={()=>app.openProvider(site.id)}>
     <span class="shelf-monogram" aria-hidden="true">{initials(site.label).slice(0,1)}</span><span class="shelf-name">{site.label}</span><TabActivity provider={site} loading={app.loading[site.id]===true} online={app.ready}/>
    </button>
    <button class="shelf-settings" aria-label={`Settings for ${site.label}`} title={`Settings for ${site.label}`} onclick={()=>manage(site.id)}><Icon name="more" size={14}/></button>
   </div>
  {/each}
  {#if !sites.length}<p class="shelf-empty">Visit an AI chat website.<br/>It appears here when recognized.</p>{/if}
 </nav>
 <div class="shelf-bottom"><button class="shelf-action" onclick={()=>app.newTab()}><Icon name="plus" size={15}/>Browse a website</button></div>
</aside>
