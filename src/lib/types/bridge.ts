export type ProviderState = 'UNCONFIGURED' | 'LOADING' | 'LOGIN_REQUIRED' | 'DISCOVERING' | 'READY' | 'RATE_LIMITED' | 'BROKEN_MAPPING' | 'REDISCOVERING';
export type Route = 'home' | 'browser' | 'models' | 'harness' | 'sessions' | 'detector' | 'settings';
export interface Model {
  id: string; display_name: string; confidence: 'OBSERVED' | 'USER_SUPPLIED';
  context: { nominal: number | null; effective: number | null; source: string };
  tokenizer: { mode: 'estimated'; name: string | null };
  tools: 'emulated'; vision: boolean | null;
  reasoning: { supported: boolean | null; control_observed: boolean } | null;
}
export interface Provider {
  id: number; label: string; origin: string; url: string; state: ProviderState;
  mapping_version: number; last_error: string; models: Model[];
  mappings: Record<'prompt'|'send'|'response'|'stop'|'new_chat'|'model'|'reasoning', number>;
}
export interface Session {
  id: string; provider: number; model: string; turn_count: number;
  status: 'IDLE'|'ACTIVE'|'PROVIDER_LOST'|'RATE_LIMITED'|'EXPIRED';
  context: { estimated_used: number; source: string; nominal: number | null; reported_used: number | null };
}
export interface Snapshot {
  protocol: 1; backend: 'zag'; version: string;
  api: {host: '127.0.0.1'; port: number; running: boolean; desired_port: number; key_present: boolean};
  providers: Provider[]; sessions: Session[];
  detector: {engine: 'symbolic'; tnn_artifact_loaded: boolean; hybrid_qualified: boolean; reason: string};
  settings: {fallback: 'disabled'; logging: string; raw_capture: false; developer_mode: boolean};
  metrics: {completed_requests: number; failed_requests: number};
  qualification: {release: false; live_provider_verified: false; harness_verified: false; native_build_evidence: string};
}
export interface HostStatus {state: 'STARTING'|'READY'|'LOST'|'FAILED'|'STOPPED'|'BROWSER_ONLY'; code: string | null}
export interface Control {
  id: number; tag: string; role: string; label: string; visible: boolean; editable: boolean;
  disabled: boolean; live: string; busy: boolean; assistant: boolean;
  options: Array<{label: string; value: string; selected: boolean; disabled: boolean}>;
}
export interface Evidence {type: 'observation'; origin: string; document_id: string; controls: Control[]; password_fields_present: boolean}
export const routes: Array<{id: Route; title: string; icon: string; description: string}> = [
  {id:'home',title:'Overview',icon:'grid',description:'Runtime and connection health'},
  {id:'browser',title:'Provider browser',icon:'globe',description:'Sign in and inspect a website'},
  {id:'models',title:'Models',icon:'layers',description:'Observed model capabilities'},
  {id:'harness',title:'Harness setup',icon:'terminal',description:'Local endpoint and client examples'},
  {id:'sessions',title:'Sessions',icon:'history',description:'Conversation continuity and cancellation'},
  {id:'detector',title:'Detector lab',icon:'scan',description:'Evidence and confirmed connector mappings'},
  {id:'settings',title:'Settings',icon:'settings',description:'Local access, privacy and runtime'},
];
