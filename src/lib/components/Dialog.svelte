<script lang="ts">
  import {onMount} from 'svelte';
  import type {Snippet} from 'svelte';
  import {app} from '../state/app.svelte';
  import Icon from './Icon.svelte';
  let {title, children}: {title:string; children:Snippet} = $props();
  let dialog: HTMLDialogElement;
  onMount(() => { const previous = document.activeElement as HTMLElement|null; dialog.showModal(); return () => previous?.focus(); });
</script>
<dialog bind:this={dialog} oncancel={() => app.popup = null} onclose={() => app.popup = null} aria-label={title}>
  <div class="dialog-title"><h2>{title}</h2><button class="icon-button" aria-label="Close dialog" onclick={() => app.popup = null}><Icon name="close"/></button></div>
  {@render children()}
</dialog>
