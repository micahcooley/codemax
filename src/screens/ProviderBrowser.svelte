<script lang="ts">
 import {app} from '../lib/state/app.svelte';import Icon from '../lib/components/Icon.svelte';import BrowserPane from '../lib/components/BrowserPane.svelte';import Inspector from '../lib/components/chrome/Inspector.svelte';
 let url=$state('');
 const shortcuts=[{name:'Z.ai',url:'https://chat.z.ai',mark:'Z'},{name:'Qwen',url:'https://chat.qwen.ai',mark:'Q'},{name:'DeepSeek',url:'https://chat.deepseek.com',mark:'D'}];
 function resize(event:PointerEvent){const el=event.currentTarget as HTMLElement;el.setPointerCapture(event.pointerId);const start=event.clientX,width=app.inspectorWidth;
  const move=(e:PointerEvent)=>{app.inspectorWidth=Math.max(240,Math.min(380,width+start-e.clientX));};
  const end=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',end);el.removeEventListener('pointercancel',end);app.saveLayout();};
  el.addEventListener('pointermove',move);el.addEventListener('pointerup',end,{once:true});el.addEventListener('pointercancel',end,{once:true});}
 function resizeKey(event:KeyboardEvent){if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();app.inspectorWidth=Math.max(240,Math.min(380,app.inspectorWidth+(event.key==='ArrowLeft'?16:-16)));app.saveLayout();}
</script>
<section class="browser-layout" aria-label="Website browser">
 <div class="provider-center">
 {#if app.provider}<BrowserPane provider={app.provider}/>{:else}
  <div class="empty-website"><div class="new-site-content"><div class="new-site-mark"><Icon name="globe" size={26}/><span class="label">Your browser. Your models.</span></div><h1>Open a website.<br/>Connect what’s already yours.</h1><p>Browse normally. Sign in to the AI websites you use. Codemax detects their models and makes only confirmed providers available to your harness.</p><form class="new-site-form" onsubmit={event=>{event.preventDefault();void app.addWebsite(url);}}><Icon name="search" size={18}/><input aria-label="Website to open" bind:value={url} placeholder="Search or enter a website" autocomplete="url" spellcheck="false" maxlength="2048" required/><button class="primary" disabled={!app.ready||!url.trim()} aria-label="Open website"><Icon name="arrow" size={17}/></button></form><div class="site-shortcuts">{#each shortcuts as site}<button disabled={!app.ready} onclick={()=>app.addWebsite(site.url,site.name)}><span class="workspace-logo">{site.mark}</span><span><strong>{site.name}</strong><small>Open website</small></span></button>{/each}</div><div class="start-footer"><Icon name="shield" size={16}/><span>Sign in on the website itself. Passwords, cookies, and authentication tokens stay in the provider’s isolated browser profile.</span></div></div></div>
 {/if}</div>
 {#if app.inspectorVisible}<div class="resize-handle" role="slider" tabindex="0" aria-label="Inspector width" aria-orientation="vertical" aria-valuenow={app.inspectorWidth} aria-valuemin="240" aria-valuemax="380" onpointerdown={resize} onkeydown={resizeKey}></div><Inspector/>{/if}
</section>
