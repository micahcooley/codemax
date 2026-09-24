<script lang="ts">
  import {onMount} from 'svelte';
  import {app} from '../state/app.svelte';
  import * as bridge from '../api/bridge';
  import Icon from './Icon.svelte';
  import type {Provider} from '../types/bridge';
  let {provider}:{provider:Provider}=$props();
  let element:HTMLDivElement;let mounted=$state(false);let frame=0;let disposed=false;
  function measure(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
    if(disposed||!element)return;const r=element.getBoundingClientRect();
    // Snap to the device-pixel grid so Retina (DPR 2) live-resizes don't spam
    // the native host with sub-pixel rects. Every measurement is sent: popups
    // and route changes also hide the surface out-of-band (hideProviders),
    // so skipping "unchanged" rects here can stick on a stale send. The
    // native host owns no-op suppression (it tracks placed/shown per view).
    const dpr=window.devicePixelRatio||1;const snap=(v:number)=>Math.round(v*dpr)/dpr;
    void bridge.position({provider_id:provider.id,x:snap(r.x),y:snap(r.y),width:snap(r.width),height:snap(r.height),
      visible:app.route==='browser'&&app.popup===null&&app.ready&&r.width>1&&r.height>1})
      .catch(error=>{app.error=String(error);});
  });}
  onMount(()=>{mounted=true;const observer=new ResizeObserver(measure);observer.observe(element);
    window.addEventListener('resize',measure);measure();
    return()=>{disposed=true;observer.disconnect();window.removeEventListener('resize',measure);cancelAnimationFrame(frame);void bridge.hideProviders().catch(()=>{});};
  });
  $effect(()=>{void provider;void app.popup;void app.ready;void app.error;void app.notification;void app.findVisible;void app.liveOrigins;if(mounted)measure();});
</script>
<div class="browser-surface" bind:this={element} data-native-surface={provider.id}>
  <div class="browser-awaiting">
    {#if !app.ready}<Icon name="globe" size={27}/><h2>Reconnect the browser</h2><p>The native host or Zag gateway is not connected. Your website profile is preserved.</p><button class="secondary" onclick={()=>app.settingsPage('runtime')}>Open runtime settings</button>
    {:else if app.popup}<Icon name="globe" size={27}/><h2>{provider.label} is still open</h2><p>Close the menu to return to the website. Its session stays connected.</p>
    {:else}<div class="spinner"></div><h2>Opening {provider.label}</h2><p>The website opens here in its own persistent, native browser view.</p><button class="text-button" onclick={()=>app.openProvider(provider.id)}><Icon name="refresh" size={14}/>Reopen website</button>{/if}
  </div>
</div>
