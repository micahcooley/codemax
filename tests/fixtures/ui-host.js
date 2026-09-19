/* UI integration-test double for the documented Tauri command surface.
 * NOT an implementation of the Zag backend. Never imported by production UI.
 * The screenshot website is an in-memory fixture, not a real provider login.
 */
(()=>{
 const now=Math.floor(Date.now()/1000),clone=x=>JSON.parse(JSON.stringify(x));
 const model=(id,name)=>({id,display_name:name,enabled:true,available:true,context:{nominal:null,effective:null,source:'UNKNOWN'},tokenizer:{mode:'estimated',name:null},vision:null,tools:'emulated',reasoning:{supported:null,control_observed:true},confidence:'OBSERVED'});
 const provider=(id,label,origin,state,models=[])=>({detected:state==='READY',exposed:true,scan_enabled:true,dismissed:false,discovery_score:state==='READY'?9:0,discovery_reason:state==='READY'?'UI fixture: independent composer, model and conversation evidence':'No provider evidence; browsing only',current_model:state==='READY'?'mock-reasoner':'',reasoning_modes:state==='READY'?[{value:'normal',label:'Normal'},{value:'thinking',label:'Thinking'}]:[],id,label,origin,url:origin+'/',current_url:origin+'/',state,open_tab:true,pinned:false,active:false,browser_busy:false,last_seen:now,mapping_version:state==='READY'?12:0,last_error:'',context_hint:0,reasoning_value:'',models,mappings:{prompt:8,send:12,response:5,stop:13,new_chat:2,model:3,reasoning:10,attachment:9}});
 const snapshot={mcp_servers:[],mcp_run:{id:'',state:'IDLE',provider_id:0,model:'',turns:0,calls:0,auto_continue:true,error:'',answer:'',call_id:'',tool:'',arguments:'',last_result:''},file_probe:{id:'',state:'IDLE',provider_id:0,model:'',path:'',scope:'one_synthetic_file_read_only',granted:false,read_count:0,denied_count:0,error:'',proof_verified:false,file_removed:true,writes:false,shell:false,remote_filesystem:false},protocol:1,backend:'zag',version:'0.1.0',api:{host:'127.0.0.1',port:7331,desired_port:7331,running:true,key_present:true},providers:[
  {...provider(1,'Local test provider','http://127.0.0.1:7340','READY',[model('p1/mock-small','Mock Small'),model('p1/mock-reasoner','Mock Reasoner'),model('p1/mock-coder','Mock Coder')]),current_url:'http://127.0.0.1:7340/conversation/fixture-01',pinned:true},
  provider(2,'Qwen','https://chat.qwen.ai','UNCONFIGURED'),provider(3,'Z.ai','https://chat.z.ai','UNCONFIGURED')
 ],sessions:[{id:'fixture-review-01',provider:1,model:'p1/mock-reasoner',title:'Session recovery review',url:'http://127.0.0.1:7340/conversation/fixture-01',turn_count:22,created_at:now-2400,last_used:now-94,last_response_id:'resp-fixture-22',status:'IDLE',context:{estimated_used:18420,source:'ESTIMATED_BYTE_UPPER_BOUND',nominal:null,reported_used:null}}],settings:{harness:'opencode',theme:'dark',compact:false,restore_tabs:true,auto_start:false,idle_minutes:30,logging:'INFO',fallback_enabled:false,fallback_model:'',default_model:'p1/mock-reasoner',raw_capture:false,developer_mode:false},events:[{id:4,time:now-94,provider_id:1,level:'INFO',kind:'request.completed',detail:'UI fixture: session metadata presentation'},{id:3,time:now-135,provider_id:1,level:'INFO',kind:'connector.recorded',detail:'UI fixture: response control selected'},{id:2,time:now-165,provider_id:1,level:'INFO',kind:'provider.ready',detail:'UI fixture: generic controls observed'},{id:1,time:now-190,provider_id:0,level:'INFO',kind:'backend.started',detail:'UI test host, not a native backend process'}],detector:{engine:'symbolic',tnn_artifact_loaded:false,hybrid_qualified:false,reason:'No production-qualified TNN detector artifact is loaded.'},metrics:{completed_requests:22,failed_requests:0},developer_mode:false};
 const callbacks=new Map(),listeners=new Map();let next=1,nextProvider=4;const calls=[];let bounds={visible:false};
 const emit=(event,payload)=>{for(const [id,item]of listeners)if(item.event===event)callbacks.get(item.handler)?.({event,id,payload:clone(payload)});};
 const push=()=>emit('bridge:snapshot',snapshot);
 const get=id=>{const p=snapshot.providers.find(p=>p.id===id);if(!p)throw Error('PROVIDER_NOT_FOUND');return p;};
 const event=()=>({type:'observation',origin:'http://127.0.0.1:7340',document_id:'fixture-document-1',password_fields_present:false,controls:[{id:8,tag:'textarea',role:'',label:'Message',visible:true,editable:true,disabled:false,live:'',busy:false,assistant:false,file_input:false,value:'',popup:'',options:[]},{id:12,tag:'button',role:'',label:'Send message',visible:true,editable:false,disabled:false,live:'',busy:false,assistant:false,file_input:false,value:'',popup:'',options:[]},{id:5,tag:'div',role:'log',label:'Assistant responses',visible:true,editable:false,disabled:false,live:'polite',busy:false,assistant:true,file_input:false,value:'',popup:'',options:[]}]});
 function draw(){let iframe=document.getElementById('__fixture_provider');if(!iframe){iframe=document.createElement('iframe');iframe.id='__fixture_provider';iframe.title='Native webview test double — local fixture';iframe.srcdoc=window.__fixtureWebsite;Object.assign(iframe.style,{position:'fixed',border:'0',zIndex:'4'});document.body.append(iframe);}iframe.style.display=bounds.visible&&bounds.provider_id===1?'block':'none';Object.assign(iframe.style,{left:bounds.x+'px',top:bounds.y+'px',width:bounds.width+'px',height:bounds.height+'px'});}
 async function request(op,params){calls.push({op,params:clone(params)});let result=null;
  switch(op){case'state.get':return clone(snapshot);case'workspace.focus':break;
  // State-presentation double only: no file is created or read by this fixture.
  case'filesystem.prepare':{const p=get(params.provider_id);if(!p.models.some(m=>m.id===params.model))throw Error('MODEL_UNAVAILABLE');snapshot.file_probe={...snapshot.file_probe,id:'ui-probe-'+(++next),state:'PERMISSION_REQUIRED',provider_id:p.id,model:params.model,path:'/UI-TEST-ONLY/filesystem-probe/bridge-probe.txt',granted:false,read_count:0,denied_count:0,error:'',proof_verified:false,file_removed:false};break;}
  case'filesystem.allow':{const p=snapshot.file_probe;if(p.state!=='PERMISSION_REQUIRED'||p.id!==params.test_id||params.confirmed!==true)throw Error('FILE_PERMISSION_REQUIRED');p.granted=true;p.state='WAITING_FOR_TOOL';get(p.provider_id).active=true;break;}
  case'filesystem.revoke':{const p=snapshot.file_probe;if(p.id!==params.test_id)throw Error('FILE_TEST_MISMATCH');p.state='REVOKED';p.granted=false;p.file_removed=true;get(p.provider_id).active=false;break;}

  // These cases are UI presentation doubles only, not execution evidence.
  case'mcp.server.add':{const id=snapshot.mcp_servers.length+1;snapshot.mcp_servers.push({id,label:params.label,command:params.command,args:params.args,state:'DISCONNECTED',error:'',protocol:'',tools:[]});result={server_id:id};break;}
  case'mcp.server.connect':{if(params.confirmed!==true)throw Error('MCP_PROCESS_CONSENT_REQUIRED');const s=snapshot.mcp_servers.find(s=>s.id===params.server_id);Object.assign(s,{state:'READY',protocol:'2025-11-25',tools:[{name:'read_note',alias:'mcp_'+s.id+'_0',description:'Explicit UI fixture. Reads no real files.',schema:{type:'object',properties:{path:{type:'string'}},required:['path']},enabled:false}]});break;}
  case'mcp.server.disconnect':{const s=snapshot.mcp_servers.find(s=>s.id===params.server_id);s.state='DISCONNECTED';s.tools=[];break;}
  case'mcp.server.remove':snapshot.mcp_servers=snapshot.mcp_servers.filter(s=>s.id!==params.server_id);break;
  case'mcp.tool.update':{const tool=snapshot.mcp_servers.flatMap(s=>s.tools).find(t=>t.alias===params.tool);if(!tool)throw Error('MCP_TOOL_NOT_FOUND');tool.enabled=params.enabled;break;}
  case'mcp.run.start':{const t=snapshot.mcp_servers.flatMap(s=>s.tools).find(t=>t.enabled);if(!t)throw Error('NO_ENABLED_TOOLS');snapshot.mcp_run={...snapshot.mcp_run,id:'ui-run-1',state:'PERMISSION_REQUIRED',provider_id:params.provider_id,model:params.model,auto_continue:params.auto_continue,turns:1,calls:0,error:'',answer:'',call_id:'ui-call-1',tool:t.alias,arguments:JSON.stringify({path:'test-fixture.txt'}),last_result:''};break;}
  case'mcp.run.approve':{const t=snapshot.mcp_run;if(params.run_id!==t.id||params.call_id!==t.call_id||!params.confirmed)throw Error('MCP_PERMISSION_STALE');t.state='EXECUTING_TOOL';t.calls++;break;}
  case'mcp.run.cancel':snapshot.mcp_run.state='CANCELLED';snapshot.mcp_run.error='USER_CANCELLED';break;
  case'mcp.run.continue':snapshot.mcp_run.state='GENERATING';snapshot.mcp_run.turns++;break;
  case'provider.open':{const p=get(params.provider_id);p.open_tab=true;if(p.id===1)p.state='READY';break;}
  case'provider.close':{get(params.provider_id).open_tab=false;break;}
  case'provider.add':{const url=new URL(params.url);const p=provider(nextProvider++,params.label,url.origin,'LOADING');snapshot.providers.push(p);result={provider_id:p.id};break;}
  case'provider.navigate':{get(params.provider_id).current_url=params.url;break;}
  case'provider.home':{const p=get(params.provider_id);p.current_url=p.url;break;}
  case'provider.rescan':{get(params.provider_id).mapping_version++;break;}
  case'provider.update':{const p=get(params.provider_id);for(const k of['label','pinned','context_hint','reasoning_value','exposed','scan_enabled','dismissed'])if(k in params)p[k]=params[k];break;}
  case'model.update':{const p=get(params.provider_id);const m=p.models.find(m=>m.id===params.model);if(!m)throw Error('MODEL_UNAVAILABLE');m.enabled=params.enabled;break;}
  case'provider.clear_profile':{const p=get(params.provider_id);p.state='UNCONFIGURED';p.open_tab=false;p.models=[];break;}
  case'provider.remove':{snapshot.providers=snapshot.providers.filter(p=>p.id!==params.provider_id);break;}
  case'settings.update':{if('port'in params){if(params.port<1024||params.port>65535)throw Error('INVALID_PORT');snapshot.api.port=params.port;snapshot.api.desired_port=params.port;}else{Object.assign(snapshot.settings,params);snapshot.developer_mode=snapshot.settings.developer_mode;}break;}
  case'api.start':snapshot.api.running=true;break;case'api.stop':snapshot.api.running=false;break;
  case'key.reveal':return{token:'sk-local-ui-fixture-not-a-real-key'};case'key.regenerate':break;
  case'detector.evidence':return event();case'connector.pick':emit('bridge:notice',{message:'UI fixture received picker action.'});break;
  case'connector.record':case'connector.reset':get(params.provider_id).mapping_version++;break;
  case'connector.export':return{schema:1,origin:get(params.provider_id).origin,recipes:[],manual_model:''};
  case'connector.import':get(params.provider_id).mapping_version++;break;
  case'connector.manual_model':get(params.provider_id).models.push(model(`p${params.provider_id}/fixed`,params.label));break;
  case'session.rename':{const s=snapshot.sessions.find(s=>s.id===params.session_id);s.title=params.title;break;}
  case'session.cancel':case'session.end':{const s=snapshot.sessions.find(s=>s.id===params.session_id);s.status='EXPIRED';break;}
  case'session.resume':{const s=snapshot.sessions.find(s=>s.id===params.session_id);s.status='IDLE';result={provider_id:s.provider};break;}
  case'logs.clear':snapshot.events=[];break;case'logs.export':return clone(snapshot.events);
  default:throw Error('UNIMPLEMENTED_TEST_FIXTURE_OPERATION: '+op);
  }push();return result;
 }
 const runtime={transformCallback(fn){const id=next++;callbacks.set(id,fn);return id;},unregisterCallback(id){callbacks.delete(id);},async invoke(command,args={}){
  calls.push({command,args:clone(args)});
  switch(command){case'plugin:event|listen':{const id=next++;listeners.set(id,args);return id;}case'plugin:event|unlisten':listeners.delete(args.eventId);return;
   case'host_status':return{state:'READY',code:null};case'bridge_request':return request(args.op,args.params);
   case'browser_bounds':bounds=args.bounds;draw();return;
   case'browser_control':case'browser_find':return;
   case'window_control':return{maximized:args.action==='maximize'};
   case'document_export':window.__lastExport={name:args.name,content:args.content};return true;
   case'document_import':if(window.__importDocument)return clone(window.__importDocument);return{schema:1,origin:'http://127.0.0.1:7340',recipes:[],manual_model:''};
   case'gateway_probe':return{healthy:true,round_trip_ms:3};
   case'backend_restart':emit('bridge:host',{state:'STARTING',code:null});setTimeout(()=>{emit('bridge:host',{state:'READY',code:null});push();},40);return;
   default:throw Error('UNIMPLEMENTED_TEST_HOST_COMMAND: '+command);
  }
 }};
 Object.defineProperty(navigator,'clipboard',{value:{async writeText(text){window.__clipboard=text;}}});
 const store=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}});
 window.__TAURI_INTERNALS__=runtime;window.__TAURI_EVENT_PLUGIN_INTERNALS__={unregisterListener(_event,id){listeners.delete(id);}};
 window.__uiFixture={snapshot,calls,push,emit,debug:()=>({listeners:[...listeners],callbackIds:[...callbacks.keys()]}),get bounds(){return bounds;}};
})();
