export type ProviderState = 'UNCONFIGURED'|'LOADING'|'LOGIN_REQUIRED'|'DISCOVERING'|'READY'|'RATE_LIMITED'|'BROKEN_MAPPING'|'REDISCOVERING'|'BROWSING'|'CANDIDATE';
export type Route = 'home'|'browser'|'models'|'harness'|'sessions'|'detector'|'settings'|'providers'|'tools';
export type Mapping = 'prompt'|'send'|'response'|'stop'|'new_chat'|'model'|'reasoning'|'attachment'|'ephemeral';
export interface Model {
  id:string; display_name:string; enabled:boolean; available:boolean; confidence:'OBSERVED'|'USER_SUPPLIED';
  context:{nominal:number|null;effective:number|null;source:string;advertised_label?:string|null};
  tokenizer:{mode:string;name:string|null}; tools:'emulated'; vision:boolean|null;
  reasoning:{supported:boolean|null;control_observed:boolean;modes?:Array<{value:string;label:string}>}|null;
}
export interface Provider {
  detected:boolean;exposed:boolean;scan_enabled:boolean;dismissed:boolean;discovery_score:number;discovery_reason:string;current_model:string;reasoning_modes:Array<{value:string;label:string}>;
  id:number; label:string; origin:string; url:string; current_url:string; state:ProviderState;
  open_tab:boolean; pinned:boolean; active:boolean; browser_busy?:boolean; last_seen:number; mapping_version:number;
  last_error:string; models:Model[]; mappings:Record<Mapping,number>;
  model_locked:boolean; reasoning_locked:boolean;
  context_hint:number; reasoning_value:string;
}
export interface Session {
  id:string; provider:number; model:string; title:string; url:string; turn_count:number;
  created_at:number; last_used:number; last_response_id:string;
  status:'IDLE'|'ACTIVE'|'PROVIDER_LOST'|'RATE_LIMITED'|'EXPIRED'|'RESTORING';
  context:{estimated_used:number;source:string;nominal:number|null;reported_used:number|null};
}
export interface Preferences {
  harness:'opencode'|'claude'|'chat'|'responses'|'messages'|'koryphaios';theme:'dark'|'light'|'system';compact:boolean;restore_tabs:boolean;auto_start:boolean;idle_minutes:number;
  logging:'ERROR'|'WARN'|'INFO'|'DEBUG'; fallback_enabled:boolean;fallback_model:string;default_model:string;ephemeral_chats:boolean;
  raw_capture:false;developer_mode:boolean;
}
export interface LogEntry {id:number;time:number;provider_id:number;level:string;kind:string;detail:string}
export interface McpServer {progress_message?:string;id:number;label:string;command:string;args:string[];state:'DISCONNECTED'|'CONNECTING'|'DISCOVERING'|'READY'|'CALLING'|'ERROR';error:string;protocol:string;tools:Array<{name:string;alias:string;description:string;enabled:boolean;schema:Record<string,unknown>}>}
export interface McpRun {turn_limit?:number;work_remaining_seconds?:number;can_resume?:boolean;id:string;state:'IDLE'|'GENERATING'|'PERMISSION_REQUIRED'|'EXECUTING_TOOL'|'RESULT_READY'|'PAUSED'|'COMPLETED'|'FAILED'|'CANCELLED';provider_id:number;model:string;turns:number;calls:number;auto_continue:boolean;error:string;answer:string;call_id:string;tool:string;arguments:string;last_result:string}
export interface Snapshot {
  mcp_servers?:McpServer[];mcp_run?:McpRun;
  protocol:1;backend:'zag';version:string;
  api:{host:'127.0.0.1';port:number;running:boolean;desired_port:number;key_present:boolean};
  providers:Provider[];sessions:Session[];settings:Preferences;developer_mode:boolean;events:LogEntry[];
  detector:{engine:'symbolic';tnn_artifact_loaded:boolean;hybrid_qualified:boolean;reason:string};
  metrics:{completed_requests:number;failed_requests:number};
}
export interface HostStatus {state:'STARTING'|'READY'|'LOST'|'FAILED'|'STOPPED'|'BROWSER_ONLY';code:string|null}
export interface Control {
  id:number;tag:string;role:string;label:string;visible:boolean;editable:boolean;disabled:boolean;
  live:string;busy:boolean;assistant:boolean;file_input:boolean;value:string;popup:string;locked?:boolean;
  options:Array<{label:string;value:string;selected:boolean;disabled:boolean}>;
}
export interface Evidence {type:'observation';origin:string;document_id:string;controls:Control[];password_fields_present:boolean}
export const routes:Array<{id:Route;title:string;icon:string;description:string}> = [
  {id:'browser',title:'Browser',icon:'globe',description:'Your provider websites'},
  {id:'providers',title:'Providers',icon:'globe',description:'Detected websites and exposed capabilities'},
  {id:'tools',title:'Tools & MCP',icon:'terminal',description:'Permissioned tools inside your website conversations'},
  {id:'models',title:'Models',icon:'layers',description:'Discovered models and capabilities'},
  {id:'sessions',title:'Sessions',icon:'history',description:'Conversations and request continuity'},
  {id:'harness',title:'Connect a client',icon:'terminal',description:'Website access, local file permissions and client connections'},
  {id:'detector',title:'Detector',icon:'scan',description:'Inspect and record website controls'},
  {id:'home',title:'Activity',icon:'activity',description:'Gateway health and recent events'},
  {id:'settings',title:'Settings',icon:'settings',description:'Appearance, profiles and privacy'},
];
export const mappingNames:Record<Mapping,string>={prompt:'Prompt input',send:'Send message',response:'Response region',stop:'Stop generation',new_chat:'New conversation',model:'Model selector',reasoning:'Reasoning control',attachment:'File attachment',ephemeral:'Temporary chat'};
