<script lang="ts">
  let {state}: {state:string} = $props();
</script>
<span class="badge" data-state={state}><span class="status-dot"></span>{state.toLowerCase().replaceAll('_', ' ')}</span>
