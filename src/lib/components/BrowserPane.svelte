<script lang="ts">
  import {onMount} from 'svelte';
  import {app} from '../state/app.svelte';
  import * as bridge from '../api/bridge';
  import type {Provider} from '../types/bridge';
  import Empty from './Empty.svelte';
  let {provider}: {provider:Provider|undefined} = $props();
  let element: HTMLDivElement; let mounted = $state(false);
  let animation = 0; let disposed = false;
  function measure() {
    cancelAnimationFrame(animation);
    animation = requestAnimationFrame(() => {
      if (disposed || !element) return;
      const rect = element.getBoundingClientRect();
      void bridge.position({provider_id:provider?.id ?? null,x:rect.x,y:rect.y,width:rect.width,height:rect.height,
        visible:!!provider && app.route === 'browser' && app.popup === null && app.ready})
        .catch(error => {app.error = String(error);});
    });
  }
  onMount(() => {
    mounted = true; const observer = new ResizeObserver(measure); observer.observe(element);
    window.addEventListener('resize', measure); measure();
    return () => {disposed = true; observer.disconnect(); window.removeEventListener('resize', measure); cancelAnimationFrame(animation); void bridge.hideProviders().catch(() => {});};
  });
  $effect(() => { void provider; void app.popup; void app.ready; if (mounted) measure(); });
</script>
<div class="browser-surface" bind:this={element}>
  {#if !provider}<Empty title="Choose a provider" description="Add a website, then sign in manually in its isolated native browser profile." icon="globe"/>
  {:else if !app.ready}<Empty title="Native host is not connected" description="The website view is available only inside the Tauri application with the Zag sidecar running." icon="globe"/>
  {:else}<div class="native-placeholder"><span class="status-dot"></span>Native provider view · {provider.origin}<small>A closed or failed view can be reopened from the provider list.</small></div>{/if}
</div>
