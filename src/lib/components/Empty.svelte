<script lang="ts">
  import Icon from './Icon.svelte';
  let {title, description, icon='layers'}: {title:string; description:string; icon?:string} = $props();
</script>
<div class="empty"><div class="empty-icon"><Icon name={icon} size={28}/></div><h2>{title}</h2><p>{description}</p></div>
