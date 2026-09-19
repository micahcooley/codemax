<script lang="ts">
 import {app} from '../lib/state/app.svelte';
 import * as bridge from '../lib/api/bridge';
 import Icon from '../lib/components/Icon.svelte';
 import FileProbe from '../lib/components/FileProbe.svelte';
 import type {McpServer} from '../lib/types/bridge';
 let adding=$state(false),label=$state(''),command=$state(''),argv=$state('[]'),task=$state(''),chosen=$state(''),automatic=$state(true),forRun=$state(false);
 let consent=$state<McpServer|null>(null),trust=$state(false);
 let imported=$state<Array<{label:string;command:string;args:string[]}>>([]),importChoice=$state(0);
 const servers=$derived(app.snapshot?.mcp_servers??[]),run=$derived(app.snapshot?.mcp_run);
 const running=$derived(!!run&&['GENERATING','PERMISSION_REQUIRED','EXECUTING_TOOL','RESULT_READY'].includes(run.state));
 const model=$derived(app.exposedModels.find(m=>m.id===chosen)||app.exposedModels.find(m=>m.provider.id===app.selectedProvider)||app.exposedModels[0]);
 const tools=$derived(servers.flatMap(server=>server.tools.map(tool=>({...tool,server}))));
 const enabled=$derived(tools.filter(t=>t.enabled&&t.server.state==='READY'));
 const pending=$derived(tools.find(t=>t.alias===run?.tool));
 async function add(){
  try{const args=JSON.parse(argv);if(!Array.isArray(args)||args.some(a=>typeof a!=='string'))throw Error('Arguments must be a JSON array of strings.');
   const result=await app.perform<{server_id:number}>('mcp.server.add',{label:label.trim(),command:command.trim(),args});if(result){adding=false;label='';command='';argv='[]';app.notification='Saved. Review and allow the local process before connecting.';}
  }catch(e){app.error=String(e);}
 }
 async function importServers(){
  try{const file=await bridge.importDocument();if(!file)return;const source=(file.mcpServers??file) as Record<string,unknown>;
   imported=Object.entries(source).flatMap(([name,v])=>{const x=v as {command?:unknown;args?:unknown;env?:unknown};return x&&typeof x.command==='string'&&Array.isArray(x.args)&&x.args.every(a=>typeof a==='string')?[{label:name,command:x.command,args:x.args as string[]}]:[];});
   if(!imported.length)throw Error('This file has no stdio command-and-arguments definitions. Remote URLs and environment secrets are not imported.');
   importChoice=0;useImported();adding=true;
  }catch(e){app.error=String(e);}
 }
 function useImported(){const item=imported[importChoice];if(item){label=item.label;command=item.command;argv=JSON.stringify(item.args,null,2);}}
 async function connect(){if(!consent||!trust)return;await app.perform('mcp.server.connect',{server_id:consent.id,confirmed:true});consent=null;trust=false;}
 async function start(){if(!model)return;forRun=false;await app.perform('mcp.run.start',{provider_id:model.provider.id,model:model.id,task,auto_continue:automatic});}
 async function approve(){if(run)await app.perform('mcp.run.approve',{run_id:run.id,call_id:run.call_id,confirmed:true,allow_run:forRun});}
 async function cancel(){if(run)await app.perform('mcp.run.cancel',{run_id:run.id});}
</script>
<section class="screen"><div class="screen-inner">
 <header class="screen-head"><div><div class="breadcrumb">Codemax / Local tool client</div><h1>Tools & MCP</h1><p>Let a website model work with tools you trust. Codemax inserts the instructions, handles approved calls, and returns results to the same conversation.</p></div><button class="secondary" disabled={running} onclick={()=>adding=!adding}><Icon name="plus" size={15}/>Add tool server</button></header>
 <div class="setup-strip"><div><span>1</span><strong>Connect trusted tools</strong><small>Use an existing MCP configuration.</small></div><div><span>2</span><strong>Start a website task</strong><small>The browser supplies the model.</small></div><div><span>3</span><strong>Approve what runs</strong><small>Results continue the conversation.</small></div></div>
 {#if adding}<section class="section"><div class="section-title"><h2>Add an MCP server</h2><button class="text-button" onclick={importServers}>Import configuration</button></div>
 {#if imported.length}<label class="field"><span>Imported definition</span><select bind:value={importChoice} onchange={useImported}>{#each imported as definition,i}<option value={i}>{definition.label}</option>{/each}</select><span class="field-hint">Command and arguments only. No credentials or environment values are copied.</span></label>{/if}
 <label class="field"><span>Name</span><input aria-label="MCP server name" bind:value={label} maxlength="120"/></label>
 <label class="field"><span>Executable</span><input class="mono" aria-label="MCP executable" bind:value={command} maxlength="2000"/><span class="field-hint">An installed command such as npx, uvx, or an absolute executable path. Arguments stay separate; Codemax does not interpret a shell command.</span></label>
 <label class="field"><span>Arguments · JSON array</span><textarea class="mono" aria-label="MCP arguments" rows="3" bind:value={argv}></textarea></label>
 <div class="button-group"><button class="primary" disabled={!label.trim()||!command.trim()||running} onclick={add}>Save server</button><button class="secondary" onclick={()=>adding=false}>Cancel</button></div></section>{/if}
 {#if consent}<section class="section permission-box" aria-label="Local process permission"><div class="section-title"><h2>Allow this local process?</h2><Icon name="shield" size={18}/></div><p><strong>{consent.label}</strong> runs on your computer with your user account’s access. A package runner may download code. Tool-call approval does not sandbox the server itself.</p><pre class="code">{consent.command}{'\n'}{JSON.stringify(consent.args,null,2)}</pre><label class="setting-line"><span>I trust this executable and its arguments.</span><input type="checkbox" aria-label="Trust MCP executable" bind:checked={trust}/></label><div class="button-group"><button class="primary" disabled={!trust} onclick={connect}>Allow process and connect</button><button class="secondary" onclick={()=>{consent=null;trust=false;}}>Do not run</button></div></section>{/if}
 <section class="section"><div class="section-title"><h2>Tool servers</h2><span class="tag">{servers.length} configured</span></div>
 {#if !servers.length}<div class="discovery-note"><Icon name="terminal" size={16}/><div>No tool servers connected. Add one or import an existing MCP configuration. The model gateway works independently and does not require an MCP server.</div></div>{/if}
 {#each servers as server(server.id)}<div class="tool-server"><div class="section-title"><div><strong>{server.label}</strong><p class="field-hint">{server.state.toLowerCase().replaceAll('_',' ')}{server.protocol?` · MCP ${server.protocol}`:''} · stdio</p></div><div class="button-group">{#if ['DISCONNECTED','ERROR'].includes(server.state)}<button class="secondary" disabled={running} onclick={()=>{consent=server;trust=false;}}>Connect</button>{:else}<button class="secondary" disabled={running} onclick={()=>app.perform('mcp.server.disconnect',{server_id:server.id})}>Disconnect</button>{/if}</div></div>
 {#if server.error}<p class="error-banner" role="alert">{server.error}</p>{/if}
 {#each server.tools as tool(tool.alias)}<label class="setting-line"><div><strong>{tool.name}</strong><p>{tool.description}</p></div><input type="checkbox" aria-label={`Enable MCP tool ${tool.name}`} checked={tool.enabled} disabled={running} onchange={e=>app.perform('mcp.tool.update',{tool:tool.alias,enabled:e.currentTarget.checked})}/></label>{/each}
 <details class="advanced-client"><summary>Advanced · executable and tool schemas</summary><pre class="code">{server.command}{'\n'}{JSON.stringify(server.args,null,2)}</pre>{#each server.tools as tool(tool.alias)}<details><summary>{tool.name}</summary><pre class="code">{JSON.stringify(tool.schema,null,2)}</pre></details>{/each}<p class="field-hint">Tool descriptions and schemas come from the server. Read-only hints are not permissions. Catalog changes and reconnects revoke enabled choices and active task grants.</p><button class="text-button danger-text" disabled={running} onclick={()=>app.perform('mcp.server.remove',{server_id:server.id,confirmed:true})}>Remove server</button></details></div>{/each}
 </section>
 <section class="section"><div class="section-title"><h2>Start a task</h2><span class="tag">Website quota · no provider key</span></div>
 <label class="field"><span>Website model</span><select aria-label="MCP website model" bind:value={chosen} disabled={running}><option value="">{model?`${model.display_name} · ${model.provider.label}`:'No exposed model ready'}</option>{#each app.exposedModels as item(item.id)}<option value={item.id}>{item.display_name} · {item.provider.label}</option>{/each}</select></label>
 <label class="field"><span>What should the model do?</span><textarea aria-label="MCP task" bind:value={task} maxlength="8191" rows="3" disabled={running}></textarea><span class="field-hint">Your task, enabled tool schemas, and approved tool results are sent to this website. Web search requires an enabled search-capable tool server; Codemax does not invent search results.</span></label>
 <label class="setting-line"><div><strong>Automatically continue after approved tools</strong><p>Insert results and send the next turn in the same website conversation. Execution still requires approval.</p></div><input type="checkbox" aria-label="Automatically continue tool results" bind:checked={automatic} disabled={running}/></label>
 <div class="button-group">{#if running}<button class="secondary danger-text" onclick={cancel}>Stop task and revoke permissions</button>{:else}<button class="primary" disabled={!model||!task.trim()||!enabled.length||!app.ready} onclick={start}><Icon name="arrow" size={15}/>Start in website</button>{/if}{#if model}<button class="text-button" onclick={()=>app.openProvider(model.provider.id)}>Show website</button>{/if}</div>
 <p class="field-hint" style="margin-top:14px">One task at a time, up to 20 model turns and 10 minutes. Tasks begin in a new conversation so an unrelated website chat cannot supply tool instructions.</p>
 </section>
 {#if run&&run.state!=='IDLE'}<section class="section" aria-label="MCP task activity"><div class="section-title"><h2>Task activity</h2><span class="tag">{run.state.toLowerCase().replaceAll('_',' ')} · {run.turns} turns · {run.calls} calls</span></div>
 {#if run.error}<p class="error-banner" role="alert">{run.error}</p>{/if}
 {#if run.state==='PERMISSION_REQUIRED'}<div class="tool-call"><div class="section-title"><h3>Approve this tool call</h3><Icon name="shield" size={17}/></div><p><strong>{pending?.name||run.tool}</strong> · {pending?.server.label||'server unavailable'}</p><pre class="code">{run.arguments}</pre><p class="field-hint">The result will be shared with {app.providers.find(p=>p.id===run.provider_id)?.label||'the selected website'}. Review file paths, commands, and destinations before allowing.</p>
 <details class="advanced-client"><summary>Advanced · automatic execution for this task</summary><label class="setting-line"><div><strong>Allow this tool for the rest of this task</strong><p>Allows future calls to this exact tool with different arguments. This is not a path-limited filesystem grant. It ends with this task, connection change, or cancellation.</p></div><input type="checkbox" aria-label="Allow MCP tool for task" bind:checked={forRun}/></label></details>
 <div class="button-group"><button class="primary" onclick={approve}>{forRun?'Allow tool for this task':'Allow once'}</button><button class="secondary" onclick={cancel}>Deny and stop</button></div></div>{/if}
 {#if run.state==='RESULT_READY'}<p>The approved tool finished. Its result is ready to send back to the model.</p><button class="primary" onclick={()=>app.perform('mcp.run.continue',{run_id:run.id})}>Insert result and send</button>{/if}
 {#if run.answer}<pre class="tool-answer">{run.answer}</pre>{/if}
 {#if run.last_result}<details class="advanced-client"><summary>Last tool result · untrusted data</summary><pre class="code">{run.last_result}</pre></details>{/if}</section>{/if}
 <details class="advanced-client"><summary>Advanced · synthetic file permission diagnostic</summary><FileProbe/></details>
</div></section>
