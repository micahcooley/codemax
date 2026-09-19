<script lang="ts">
  import Icon from './Icon.svelte';
  import {app} from '../state/app.svelte';
  let {code, label='Configuration'}: {code:string; label?:string} = $props();
</script>
<div class="code-block"><div class="code-caption"><span>{label}</span><button class="text-button" onclick={() => app.clipboard(code)}><Icon name="copy" size={14}/>Copy</button></div><pre><code>{code}</code></pre></div>
