import type {Route,Snapshot,HostStatus,Provider,Mapping,Preferences} from '../types/bridge';
import * as bridge from '../api/bridge';
export type Popup='add'|'commands'|'rotate-key'|'clear-profile'|'remove-provider'|'close-provider'|'shortcuts'|null;
const initial:Preferences={theme:'dark',compact:false,restore_tabs:true,auto_start:false,idle_minutes:30,logging:'INFO',fallback_enabled:false,fallback_model:'',default_model:'',raw_capture:false,developer_mode:false};
class Application {
  route=$state<Route>('browser');snapshot=$state<Snapshot|null>(null);host=$state<HostStatus>({state:'STARTING',code:null});
  selectedProvider=$state<number|null>(null);popup=$state<Popup>(null);popupProvider=$state<number|null>(null);
  error=$state('');notification=$state('');pending=$state(0);sidebarWidth=$state(212);inspectorWidth=$state(272);
  sidebarVisible=$state(true);inspectorVisible=$state(true);inspectorTab=$state<'connection'|'browser'>('connection');
  focusAddress=$state(0);findVisible=$state(false);zoom=$state(100);liveOrigins=$state<Record<number,string>>({});
  loading=$state<Record<number,boolean>>({});
  contextMenu=$state<{id:number;y:number}|null>(null);tabOrder=$state<number[]>([]);secret=$state('');
  preferences=$derived(this.snapshot?.settings??initial);
  providers=$derived(this.snapshot?.providers??[]);
  tabs=$derived(this.providers.filter(p=>p.open_tab).sort((a,b)=>{
    const ai=this.tabOrder.indexOf(a.id),bi=this.tabOrder.indexOf(b.id);
    return (ai<0?1000+a.id:ai)-(bi<0?1000+b.id:bi);
  }));
  models=$derived(this.providers.flatMap(provider=>provider.models.map(model=>({...model,provider}))));
  provider=$derived<Provider|undefined>(this.providers.find(p=>p.id===this.selectedProvider));
  ready=$derived(this.host.state==='READY'&&!!this.snapshot);
  sessions=$derived(this.snapshot?.sessions??[]);
  events=$derived(this.snapshot?.events??[]);
  get origin():string{return this.selectedProvider===null?'':this.liveOrigins[this.selectedProvider]||this.provider?.origin||'';}
  async perform<T=unknown>(op:string,params:Record<string,unknown>={}):Promise<T|undefined>{
    this.pending++;this.error='';
    try{return await bridge.request<T>(op,params);}catch(error){this.error=error instanceof Error?error.message:String(error);return undefined;}finally{this.pending--;}
  }
  async showPopup(popup:Popup,providerId:number|null=this.selectedProvider):Promise<void>{
    try{await bridge.hideProviders();this.popupProvider=providerId;this.popup=popup;this.contextMenu=null;}
    catch(error){this.error=String(error);}
  }
  navigate(route:Route):void{this.route=route;this.popup=null;this.contextMenu=null;this.secret='';}
  async openProvider(id:number):Promise<void>{
    this.selectedProvider=id;this.route='browser';this.contextMenu=null;this.zoom=100;
    await this.perform('provider.open',{provider_id:id});await this.perform('workspace.focus',{provider_id:id});
  }
  async closeProvider(id:number,confirmed=false):Promise<void>{
    const p=this.providers.find(p=>p.id===id);if(!p)return;
    if(p.active&&!confirmed){await this.showPopup('close-provider',id);return;}
    const next=this.tabs.find(p=>p.id!==id);
    if(await this.perform('provider.close',{provider_id:id})!==undefined){
      this.loading={...this.loading,[id]:false};this.popup=null;if(this.selectedProvider===id){this.selectedProvider=next?.id??null;if(next)await this.openProvider(next.id);}
    }
  }
  newTab():void{this.selectedProvider=null;this.route='browser';this.findVisible=false;this.focusAddress++;void this.perform('workspace.focus',{provider_id:0});}
  async addWebsite(url:string,label=''):Promise<boolean>{
    let parsed:URL;try{parsed=new URL(url.includes('://')?url:`https://${url}`);}catch{this.error='INVALID_PROVIDER_URL';return false;}
    const existing=this.providers.find(p=>p.origin===parsed.origin);
    if(existing){this.popup=null;await this.openProvider(existing.id);return true;}
    const result=await this.perform<{provider_id:number}>('provider.add',{url:parsed.href,label:label.trim()||parsed.hostname.replace(/^chat\./,'')});
    if(!result)return false;this.popup=null;await this.openProvider(result.provider_id);return true;
  }
  async go(url:string):Promise<void>{
    let parsed:URL;try{parsed=new URL(url.includes('://')?url:`https://${url}`);}catch{this.error='INVALID_PROVIDER_URL';return;}
    if(this.provider&&parsed.origin===this.provider.origin){await this.perform('provider.navigate',{provider_id:this.provider.id,url:parsed.href});}
    else await this.addWebsite(parsed.href);
  }
  async control(action:bridge.BrowserAction):Promise<void>{
    if(!this.provider)return;
    try{await bridge.browserControl(this.provider.id,action);
      if(action.startsWith('zoom'))this.zoom=action==='zoom_reset'?100:Math.max(50,Math.min(200,this.zoom+(action==='zoom_in'?10:-10)));
      if(action==='popup_once')this.notification='One sign-in popup allowed for 60 seconds. Open the website’s sign-in button now.';
      if(action==='download_once')this.notification='One download allowed for 60 seconds. It will be saved in Downloads; it will not run.';
    }catch(error){this.error=String(error);}
  }
  async pick(role:Mapping):Promise<void>{
    if(!this.provider)return;this.route='browser';this.popup=null;this.inspectorVisible=true;
    await this.perform('connector.pick',{provider_id:this.provider.id,mapping:role});
  }
  async settings(patch:Partial<Preferences>&{port?:number}):Promise<void>{await this.perform('settings.update',patch as Record<string,unknown>);}
  async clipboard(text:string):Promise<void>{try{await bridge.copy(text);this.notification='Copied to clipboard.';}catch(error){this.error=String(error);}}
  async export(name:string,data:unknown):Promise<void>{try{if(await bridge.exportDocument(name,data))this.notification='Export saved.';}catch(error){this.error=String(error);}}
  async resume(id:string):Promise<void>{const result=await this.perform<{provider_id:number}>('session.resume',{session_id:id});if(result){this.selectedProvider=result.provider_id;this.route='browser';}}
  async cancel(id:string):Promise<void>{await this.perform('session.cancel',{session_id:id});}
  saveLayout():void{try{localStorage.setItem('bridge.layout.v1',JSON.stringify({sidebar:this.sidebarWidth,inspector:this.inspectorWidth,left:this.sidebarVisible,right:this.inspectorVisible,order:this.tabOrder}));}catch{}}
  restoreLayout():void{try{const value=JSON.parse(localStorage.getItem('bridge.layout.v1')||'{}');
    if(Number.isFinite(value.sidebar))this.sidebarWidth=Math.max(180,Math.min(320,value.sidebar));
    if(Number.isFinite(value.inspector))this.inspectorWidth=Math.max(240,Math.min(380,value.inspector));
    if(typeof value.left==='boolean')this.sidebarVisible=value.left;if(typeof value.right==='boolean')this.inspectorVisible=value.right;
    if(Array.isArray(value.order))this.tabOrder=value.order.filter((n:unknown)=>Number.isInteger(n)).slice(0,16);
  }catch{}}
}
export const app=new Application();
