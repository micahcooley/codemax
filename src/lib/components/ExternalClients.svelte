<script lang="ts">
 import {onDestroy} from 'svelte';import {app} from '../state/app.svelte';import * as bridge from '../api/bridge';import Icon from './Icon.svelte';
 type Client='opencode'|'claude'|'chat'|'responses'|'messages';
 let probing=$state(false),probeMessage=$state(''),probeFailed=$state(false);let timer:ReturnType<typeof setTimeout>;
 const client=$derived<Client>(app.preferences.harness||'opencode');
 const sh=(value:string)=>"'"+value.replaceAll("'","'\\''")+"'";
 const endpoint=$derived(`http://127.0.0.1:${app.snapshot?.api.port??7331}`);
 const choice=$derived(app.clientModel?app.exposedModels.find(m=>m.id===app.clientModel):app.exposedModels.find(m=>m.id===app.preferences.default_model)||app.exposedModels[0]);
 const model=$derived(choice?.id||'');
 const running=$derived(app.ready&&app.snapshot?.api.running===true);
 const formatNames:Record<Client,string>={opencode:'OpenCode',claude:'Claude Code',chat:'Chat API',responses:'Responses API',messages:'Messages API'};
 const config=$derived({$schema:'https://opencode.ai/config.json',model:`bridge/${model}`,provider:{bridge:{npm:'@ai-sdk/openai-compatible',name:'Codemax websites',options:{baseURL:`${endpoint}/v1`,apiKey:'{env:BRIDGE_API_KEY}'},models:Object.fromEntries(app.exposedModels.map(m=>[m.id,{name:`${m.provider.label} / ${m.display_name}`}]))}}});
 const filename=$derived(client==='opencode'?'opencode.json':client==='claude'?'Start Claude Code · Bash':'Streaming request · Bash');
 const snippet=$derived.by(()=>{
  if(!model)return '';
  if(client==='opencode')return JSON.stringify(config,null,2);
  if(client==='claude')return `read -rsp 'Codemax local key: ' ANTHROPIC_AUTH_TOKEN; echo\nexport ANTHROPIC_AUTH_TOKEN\nexport ANTHROPIC_BASE_URL='${endpoint}'\nexport ANTHROPIC_MODEL=${sh(model)}\nexport ANTHROPIC_DEFAULT_HAIKU_MODEL=${sh(model)}\nexport ANTHROPIC_DEFAULT_SONNET_MODEL=${sh(model)}\nexport ANTHROPIC_DEFAULT_OPUS_MODEL=${sh(model)}\nclaude`;
  const path=client==='chat'?'/v1/chat/completions':client==='responses'?'/v1/responses':'/v1/messages';
  const payload=client==='responses'?{model,input:'Explain how you will approach a code review.',stream:true}:client==='messages'?{model,max_tokens:1024,stream:true,messages:[{role:'user',content:'Explain how you will approach a code review.'}]}:{model,stream:true,messages:[{role:'user',content:'Explain how you will approach a code review.'}]};
  return `read -rsp 'Codemax local key: ' BRIDGE_API_KEY; echo\nexport BRIDGE_API_KEY\ncurl --no-buffer '${endpoint}${path}' \\\n  -H "Authorization: Bearer $BRIDGE_API_KEY" \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Bridge-Session: terminal-review' \\\n${client==='messages'?"  -H 'anthropic-version: 2023-06-01' \\\n":''}  --data ${sh(JSON.stringify(payload))}`;
 });
 const startCommand="read -rsp 'Codemax local key: ' BRIDGE_API_KEY; echo\nexport BRIDGE_API_KEY\nopencode";
 async function reveal(){if(app.secret){app.secret='';clearTimeout(timer);return;}const result=await app.perform<{token:string}>('key.reveal');if(result){app.secret=result.token;clearTimeout(timer);timer=setTimeout(()=>app.secret='',30000);}}
 async function copyKey(){const result=await app.perform<{token:string}>('key.reveal');if(result)await app.clipboard(result.token);}
 async function probe(){
  if(probing||!running)return;probing=true;probeMessage='';probeFailed=false;
  try{const result=await bridge.probe();if(!result.healthy)throw Error('GATEWAY_HEALTH_FAILED');probeMessage=`Local gateway reachable in ${result.round_trip_ms} ms. No website prompt was sent.`;}
  catch(error){probeFailed=true;probeMessage='The local connection check failed. Check the gateway settings and retry.';app.error=String(error);}finally{probing=false;}
 }
 function stop(){void app.ask('Stop the local gateway?','Connected client requests will be cancelled. Browser tabs and website logins will stay open.','Stop gateway',()=>app.perform('api.stop'));}
 // A port/host change invalidates the old health result; it is not a live probe.
 let checkedEndpoint='';$effect(()=>{const fingerprint=`${endpoint}:${running}`;if(checkedEndpoint!==fingerprint){checkedEndpoint=fingerprint;probeMessage='';probeFailed=false;}});
 onDestroy(()=>{clearTimeout(timer);app.secret='';});
</script>
<div class="connection-layout">
 <div class="connection-main">
 <section class="section"><div class="section-title"><h2>1. Choose your client</h2><span class="tag">Website quota</span></div>
  <div class="segmented" aria-label="Client format">{#each ['opencode','claude'] as id}<button class:active={client===id} aria-pressed={client===id} disabled={!app.ready||app.busy('settings.update')} onclick={()=>app.settings({harness:id as Client})}>{formatNames[id as Client]}</button>{/each}</div>
  <details class="advanced-client client-formats" open={['chat','responses','messages'].includes(client)}><summary>Other clients · protocol examples</summary><div class="segmented">{#each ['chat','responses','messages'] as id}<button class:active={client===id} aria-pressed={client===id} disabled={!app.ready||app.busy('settings.update')} onclick={()=>app.settings({harness:id as Client})}>{formatNames[id as Client]}</button>{/each}</div><p class="field-hint">Use a protocol your client supports. These are example requests, not one-click installers.</p></details>
  <label class="field"><span>Website model</span><select aria-label="Client model" value={app.clientModel||model} disabled={!app.ready||!app.exposedModels.length} onchange={e=>app.clientModel=e.currentTarget.value}>{#if !model}<option value="">Select an available model</option>{/if}{#each app.exposedModels as m(m.id)}<option value={m.id}>{m.provider.label} / {m.display_name}</option>{/each}</select></label>
  {#if app.clientModel&&!choice}<div class="note warning" role="status">Your previous selection is no longer available. Choose a model above; Codemax will not switch it silently.</div>{/if}
  {#if !app.exposedModels.length}<div class="note"><Icon name="globe" size={16}/><div>There are no ready, enabled models yet. <button class="text-button" onclick={()=>app.navigate('providers')}>Review providers</button> or <button class="text-button" onclick={()=>app.newTab()}>open a website</button>.</div></div>{/if}
 </section>
 <section class="section"><div class="section-title"><h2>2. Start the local connection</h2><span class="tag" class:ready={running}><span class="dot" class:online={running}></span>{!app.ready?'Disconnected':running?'Ready':'Stopped'}</span></div>
  <p>Your client talks to Codemax on this computer. Codemax sends requests through your signed-in website—not a paid provider API.</p>
  <div class="button-group" style="margin-top:15px">{#if running}<button class="secondary" onclick={probe} disabled={probing}>{probing?'Checking…':'Check connection'}</button><button class="text-button" onclick={stop} disabled={app.busy('api.stop')}>Stop gateway</button>{:else}<button class="primary" disabled={!app.ready||app.busy('api.start')} onclick={()=>app.perform('api.start')}>{app.busy('api.start')?'Starting…':'Start gateway'}</button>{/if}<button class="text-button" onclick={()=>app.settingsPage('gateway')}>Gateway settings</button></div>
  {#if probeMessage}<p class="connection-result" class:danger-text={probeFailed} role="status">{probeMessage} Website access and client interoperability are separate checks.</p>{/if}
 </section>
 <section class="section"><div class="section-title"><h2>3. Configure {formatNames[client]}</h2>{#if client==='opencode'}<button class="text-button" disabled={!app.ready||!model} onclick={()=>app.export('opencode.json',config)}><Icon name="download" size={14}/>Save config</button>{/if}</div>
 {#if model}
  <p class="connection-instruction">{client==='opencode'?'Save this in your project, or merge the provider entry into your existing opencode.json. Do not replace an existing configuration without reviewing it.':client==='claude'?'Run this in a Bash terminal, then paste the copied local key at the prompt. It only changes that terminal’s environment.':'Run this example in a Bash terminal and paste the copied local key at the prompt.'}</p>
  <div class="code-panel"><div class="code-heading"><Icon name={client==='opencode'?'folder':'terminal'} size={13}/><span>{filename}</span><button class="text-button" disabled={!app.ready} onclick={()=>app.clipboard(snippet)}><Icon name="copy" size={13}/>Copy</button></div><pre>{snippet}</pre></div>
  {#if client==='opencode'}<div class="code-panel launch-command"><div class="code-heading"><Icon name="terminal" size={13}/><span>Start OpenCode · Bash</span><button class="text-button" disabled={!app.ready} onclick={()=>app.clipboard(startCommand)}>Copy setup command</button></div><pre>{startCommand}</pre></div>{/if}
  <div class="button-group" style="margin-top:14px"><button class="secondary" disabled={!app.ready||app.busy('key.reveal')} onclick={copyKey}><Icon name="key" size={14}/>Copy local key</button><span class="field-hint">Paste at the terminal prompt. It will not be displayed or saved in the config.</span></div>
  {#if client==='claude'}<div class="note"><Icon name="alert" size={16}/><span>This non-Claude model connection is not vendor-supported. Actual compatibility depends on the website model and Claude Code’s protocol requirements.</span></div>{/if}
 {:else}<p class="muted">Configuration appears when a website model is ready. Nothing needs to be copied yet.</p>{/if}
 <details class="advanced-client"><summary>Manual connection details · endpoint and local access token</summary>
  <label class="field"><span>Local gateway endpoint</span><div class="readout"><code>{client==='claude'||client==='messages'?endpoint:`${endpoint}/v1`}</code><button class="icon-button" aria-label="Copy API endpoint" disabled={!app.ready} onclick={()=>app.clipboard(client==='claude'||client==='messages'?endpoint:`${endpoint}/v1`)}><Icon name="copy" size={14}/></button></div></label>
  <div class="field"><span>Local access token · not a provider credential</span><div class="readout"><code>{app.secret||'Hidden — reveal or copy explicitly'}</code><button class="icon-button" aria-label={app.secret?'Hide API key':'Reveal API key'} disabled={!app.ready} onclick={reveal}><Icon name={app.secret?'close':'eye'} size={15}/></button><button class="icon-button" aria-label="Copy API key" disabled={!app.ready} onclick={copyKey}><Icon name="copy" size={14}/></button></div><span class="field-hint">Revealed keys disappear after 30 seconds or when you leave this page.</span></div>
  <p class="field-hint">Use the same session identifier for continuation. Some clients cache their model catalog; refresh or update their config after changing exposed models.</p>
 </details></section>
 </div>
 <aside class="connection-help"><h3>What happens next</h3><p>Keep Codemax running. Select your website model in the client and send a request.</p><p>The website tab’s ring spins while working and stays still when idle.</p><button class="text-button" onclick={()=>app.navigate('sessions')}>View client sessions<Icon name="arrow" size={13}/></button><hr/><h3>Who runs tools?</h3><p>Your coding client runs tools using its own permissions. Codemax’s separate website tool tasks require MCP setup and your approval.</p><button class="text-button" onclick={()=>app.navigate('tools')}>Tools & permissions<Icon name="arrow" size={13}/></button><hr/><p class="field-hint">Website quotas still apply. No sign-in credentials are copied out of the browser.</p></aside>
</div>
