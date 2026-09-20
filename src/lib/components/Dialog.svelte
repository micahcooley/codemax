<script lang="ts">
  import {onMount,tick} from 'svelte';
  import type {Snippet} from 'svelte';
  import {app} from '../state/app.svelte';
  import Icon from './Icon.svelte';
  let {title,children}:{title:string;children:Snippet}=$props();
  let dialog:HTMLDialogElement;
  onMount(()=>{
    const previous=document.activeElement as HTMLElement|null;
    dialog.showModal();
    void tick().then(()=>{
      // Cancel is the safe first target in confirmations; forms focus the first field.
      const target=dialog.querySelector<HTMLElement>('[data-initial-focus],input:not(:disabled),textarea:not(:disabled)');
      target?.focus();
    });
    return()=>{if(previous?.isConnected)previous.focus();else document.querySelector<HTMLElement>('.title-tabs [aria-selected="true"]')?.focus();};
  });
</script>
<dialog bind:this={dialog} oncancel={event=>{event.preventDefault();if(!app.confirming)app.popup=null;}} aria-label={title}>
  <div class="dialog-title"><h2>{title}</h2><button class="icon-button" aria-label="Close dialog" disabled={app.confirming} onclick={()=>app.popup=null}><Icon name="close"/></button></div>
  {@render children()}
</dialog>
