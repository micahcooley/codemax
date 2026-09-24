<script lang="ts">
 import {initials} from '../../lib/format';
 import {siteIcon} from '../../lib/site-icons';
 let {origin,label,size=16}:{origin:string;label:string;size?:number}=$props();
 let src=$derived(siteIcon(origin) ?? '');
</script>
{#if src}<img src={src} width={size} height={size} alt="" loading="lazy" draggable="false"/>{:else}<span class="favicon-fallback" aria-hidden="true">{initials(label).slice(0,1)}</span>{/if}
