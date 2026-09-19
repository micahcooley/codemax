<script lang="ts">
 import type {Provider} from '../types/bridge';
 let {provider,loading=false,online=true}:{provider:Provider;loading?:boolean;online?:boolean}=$props();
 const warning=$derived(['LOGIN_REQUIRED','RATE_LIMITED','BROKEN_MAPPING'].includes(provider.state));
 const working=$derived(online&&provider.open_tab&&!warning&&(provider.active||provider.browser_busy||loading||['LOADING','REDISCOVERING'].includes(provider.state)));
 const label=$derived(!online?'Offline':warning?(provider.state==='LOGIN_REQUIRED'?'Sign-in required':provider.state==='RATE_LIMITED'?'Website limit reached':'Connection needs attention'):provider.active||provider.browser_busy?'Generating':loading||provider.state==='LOADING'?'Loading':working?'Discovering controls':['DISCOVERING','CANDIDATE'].includes(provider.state)?'Observing controls':provider.open_tab?'Idle':'Sleeping');
</script>
<span class="tab-activity" class:working class:warning title={label} role="img" aria-label={`${provider.label}: ${label}`} data-state={working?'working':warning?'attention':'idle'}><span class="activity-ring"></span>{#if warning}<span class="activity-mark">!</span>{/if}</span>
