import type {Route,Snapshot,HostStatus,Provider,Mapping,Preferences} from '../types/bridge';
import * as bridge from '../api/bridge';
export type Popup='add'|'commands'|'rotate-key'|'clear-profile'|'remove-provider'|'close-provider'|'shortcuts'|'menu'|'tab-actions'|'confirm'|null;
export type SettingsSection='appearance'|'gateway'|'profiles'|'privacy'|'runtime';
type Confirmation={title:string;description:string;label:string;danger:boolean;action:()=>Promise<unknown>|unknown};
type ProviderDraft={label:string;hint:number;reasoning:string};
const initial:Preferences={harness:'opencode',theme:'dark',compact:false,restore_tabs:true,auto_start:false,idle_minutes:30,logging:'INFO',fallback_enabled:false,fallback_model:'',default_model:'',raw_capture:false,developer_mode:false};
class Application {
  route=$state<Route>('browser');snapshot=$state<Snapshot|null>(null);host=$state<HostStatus>({state:'STARTING',code:null});
  selectedProvider=$state<number|null>(null);popup=$state<Popup>(null);popupProvider=$state<number|null>(null);
  confirmation=$state<Confirmation|null>(null);confirming=$state(false);
  error=$state('');popupError=$state('');notification=$state('');pending=$state(0);inspectorWidth=$state(272);
  shelfVisible=$state(true);inspectorVisible=$state(false);inspectorTab=$state<'connection'|'browser'>('connection');
  focusAddress=$state(0);focusFind=$state(0);findVisible=$state(false);zoom=$state(100);zoomByProvider=$state<Record<number,number>>({});liveOrigins=$state<Record<number,string>>({});
  loading=$state<Record<number,boolean>>({});
  contextMenu=$state<{id:number;x:number;y:number}|null>(null);tabOrder=$state<number[]>([]);secret=$state('');
  settingsSection=$state<SettingsSection>('appearance');providerSelection=$state<number|null>(null);clientModel=$state('');
  // Drafts live only in this process. Never persist tasks, commands or secrets in localStorage.
  providerDrafts=$state<Record<number,ProviderDraft>>({});
  toolDraft=$state({adding:false,label:'',command:'',argv:'[]',task:'',chosen:'',automatic:true,turnBudget:100,workMinutes:30});
  modelFilters=$state({query:'',provider:'all',status:'all',sort:'provider' as 'provider'|'model',descending:false});
  sessionFilters=$state({query:'',status:'all'});
  pendingKeys=$state<string[]>([]);private requests=new Map<string,Promise<unknown>>();
  private activation=0;private routeHistory:Route[]=['browser'];private routeIndex=0;
  canGoBack=$state(false);canGoForward=$state(false);
  preferences=$derived(this.snapshot?.settings??initial);
  providers=$derived(this.snapshot?.providers??[]);
  tabs=$derived(this.providers.filter(p=>p.open_tab).sort((a,b)=>{
    const ai=this.tabOrder.indexOf(a.id),bi=this.tabOrder.indexOf(b.id);
    return (ai<0?1000+a.id:ai)-(bi<0?1000+b.id:bi);
  }));
  detectedProviders=$derived(this.providers.filter(p=>p.detected&&!p.dismissed));
  models=$derived(this.detectedProviders.flatMap(provider=>provider.models.map(model=>({...model,provider}))));
  exposedModels=$derived(this.models.filter(m=>m.enabled&&m.available&&m.provider.exposed&&m.provider.state==='READY'));
  provider=$derived<Provider|undefined>(this.providers.find(p=>p.id===this.selectedProvider));
  ready=$derived(this.host.state==='READY'&&!!this.snapshot);
  sessions=$derived(this.snapshot?.sessions??[]);
  events=$derived(this.snapshot?.events??[]);
  activeTask=$derived(this.snapshot?.mcp_run&&['GENERATING','PERMISSION_REQUIRED','EXECUTING_TOOL','RESULT_READY','PAUSED'].includes(this.snapshot.mcp_run.state)?this.snapshot.mcp_run:null);
  get origin():string{return this.selectedProvider===null?'':this.liveOrigins[this.selectedProvider]||this.provider?.origin||'';}
  get pageUrl():string{const p=this.provider;return p?(this.origin&&this.origin!==p.origin?this.origin:p.current_url||p.url):'';}
  busy(op:string):boolean{return this.pendingKeys.some(key=>key.startsWith(op+'|'));}
  async perform<T=unknown>(op:string,params:Record<string,unknown>={}):Promise<T|undefined>{
    if(!this.ready&&op!=='state.get'){this.error='BACKEND_UNAVAILABLE';return undefined;}
    const key=op+'|'+JSON.stringify(params);
    const existing=this.requests.get(key);if(existing)return existing as Promise<T|undefined>;
    this.pending++;this.pendingKeys=[...this.pendingKeys,key];
    const work=(async()=>{
      try{return await bridge.request<T>(op,params);}catch(error){this.error=error instanceof Error?error.message:String(error);if(this.popup)this.popupError=this.error;return undefined;}
      finally{this.pending--;this.requests.delete(key);this.pendingKeys=this.pendingKeys.filter(k=>k!==key);}
    })();
    this.requests.set(key,work);return work;
  }
  async showPopup(popup:Popup,providerId:number|null=this.selectedProvider):Promise<void>{
    try{await bridge.hideProviders();this.popupError='';this.popupProvider=providerId;this.popup=popup;this.contextMenu=null;}
    catch(error){this.error=String(error);}
  }
  async ask(title:string,description:string,label:string,action:Confirmation['action'],danger=true):Promise<void>{
    this.confirmation={title,description,label,action,danger};await this.showPopup('confirm');
  }
  async acceptConfirmation():Promise<void>{
    const item=this.confirmation;if(!item||this.confirming)return;
    this.confirming=true;
    try{const result=await item.action();if(result!==undefined&&this.confirmation===item){this.popup=null;this.confirmation=null;}}
    catch(error){this.error=String(error);}finally{this.confirming=false;}
  }
  private setRoute(route:Route):void{this.activation++;this.route=route;this.popup=null;this.contextMenu=null;this.secret='';this.findVisible=false;}
  navigate(route:Route):void{
    if(route!==this.route){this.routeHistory=this.routeHistory.slice(0,this.routeIndex+1);this.routeHistory.push(route);if(this.routeHistory.length>40)this.routeHistory.shift();this.routeIndex=this.routeHistory.length-1;}
    this.setRoute(route);this.canGoBack=this.routeIndex>0;this.canGoForward=this.routeIndex<this.routeHistory.length-1;
  }
  settingsPage(section:SettingsSection):void{this.settingsSection=section;this.navigate('settings');}
  async back():Promise<void>{
    if(this.route==='browser'){await this.control('back');return;}
    if(this.routeIndex>0){this.setRoute(this.routeHistory[--this.routeIndex]);this.canGoBack=this.routeIndex>0;this.canGoForward=true;}
    else this.navigate('browser');
  }
  async forward():Promise<void>{
    if(this.canGoForward){this.setRoute(this.routeHistory[++this.routeIndex]);this.canGoBack=true;this.canGoForward=this.routeIndex<this.routeHistory.length-1;}
    else if(this.route==='browser')await this.control('forward');
  }
  async openProvider(id:number):Promise<void>{
    const ticket=++this.activation;const opened=await this.perform('provider.open',{provider_id:id});if(opened===undefined||ticket!==this.activation)return;
    this.selectedProvider=id;this.navigate('browser');this.zoom=this.zoomByProvider[id]??100;
    await this.perform('workspace.focus',{provider_id:id});
  }
  async closeProvider(id:number,confirmed=false):Promise<void>{
    const p=this.providers.find(p=>p.id===id);if(!p)return;
    if((p.active||p.browser_busy||this.activeTask?.provider_id===id)&&!confirmed){await this.showPopup('close-provider',id);return;}
    const ticket=this.activation;const index=this.tabs.findIndex(p=>p.id===id);
    const next=index<0?undefined:(this.tabs[index+1]??this.tabs[index-1]);
    if(await this.perform('provider.close',{provider_id:id})!==undefined){
      this.loading={...this.loading,[id]:false};this.popup=null;
      if(this.selectedProvider===id){this.selectedProvider=next?.id??null;if(this.route==='browser'&&ticket===this.activation){if(next)await this.openProvider(next.id);else this.newTab();}}
    }
  }
  newTab():void{this.selectedProvider=null;this.navigate('browser');this.focusAddress++;if(this.ready)void this.perform('workspace.focus',{provider_id:0});}
  address(input:string):URL{
    const text=input.trim();if(!text)throw Error('EMPTY_ADDRESS');
    if(/^[a-z][a-z\d+.-]*:/i.test(text)&&!/^(?:localhost|(?:[a-z\d-]+\.)+[a-z]+):\d/i.test(text)){
      const url=new URL(text);if(!['https:','http:'].includes(url.protocol))throw Error('UNSAFE_ADDRESS');
      if(url.username||url.password)throw Error('ADDRESS_HAS_CREDENTIALS');return url;
    }
    if(!/\s/.test(text)&&(/^[\w.-]+\.[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(text)||/^localhost(?::\d+)?(?:[/?#]|$)/.test(text)||/^127\.0\.0\.1(?::\d+)?(?:[/?#]|$)/.test(text)))return new URL(`${/^(localhost|127\.0\.0\.1)(:|\/|$)/.test(text)?'http':'https'}://${text}`);
    return new URL(`https://www.google.com/search?q=${encodeURIComponent(text)}`);
  }
  async addWebsite(url:string,label=''):Promise<boolean>{
    let parsed:URL;try{parsed=this.address(url);}catch(error){this.error=error instanceof Error?error.message:'INVALID_PROVIDER_URL';return false;}
    const existing=this.providers.find(p=>p.origin===parsed.origin);
    if(existing){
      // One isolated profile per origin. Never discard the path the user entered.
      if((existing.current_url||existing.url)!==parsed.href){
        if(await this.perform('provider.navigate',{provider_id:existing.id,url:parsed.href})===undefined)return false;
        this.liveOrigins={...this.liveOrigins,[existing.id]:parsed.href};
      }
      await this.openProvider(existing.id);return true;
    }
    const result=await this.perform<{provider_id:number}>('provider.add',{url:parsed.href,label:label.trim()||parsed.hostname.replace(/^chat\./,'')});
    if(!result)return false;await this.openProvider(result.provider_id);return true;
  }
  async go(url:string):Promise<void>{
    let parsed:URL;try{parsed=this.address(url);}catch(error){this.error=error instanceof Error?error.message:'INVALID_PROVIDER_URL';return;}
    if(this.provider&&parsed.origin===this.provider.origin){
      if(await this.perform('provider.navigate',{provider_id:this.provider.id,url:parsed.href})!==undefined)this.liveOrigins={...this.liveOrigins,[this.provider.id]:parsed.href};
    }else await this.addWebsite(parsed.href);
  }
  async control(action:bridge.BrowserAction):Promise<void>{
    if(!this.provider||!this.ready)return;
    const id=this.provider.id;
    try{await bridge.browserControl(id,action);
      if(action.startsWith('zoom')){this.zoom=action==='zoom_reset'?100:Math.max(50,Math.min(200,this.zoom+(action==='zoom_in'?10:-10)));this.zoomByProvider={...this.zoomByProvider,[id]:this.zoom};}
      if(action==='popup_once')this.notification='One sign-in popup allowed for 60 seconds. Try the sign-in button again.';
      if(action==='download_once')this.notification='One download allowed for 60 seconds. Saved files will not run automatically.';
    }catch(error){this.error=String(error);}
  }
  showFind():void{this.findVisible=true;this.focusFind++;}
  async pick(role:Mapping):Promise<void>{if(!this.provider)return;this.navigate('browser');this.inspectorVisible=true;await this.perform('connector.pick',{provider_id:this.provider.id,mapping:role});}
  async settings(patch:Partial<Preferences>&{port?:number}):Promise<boolean>{
    if(await this.perform('settings.update',patch as Record<string,unknown>)===undefined)return false;
    this.notification='Settings saved.';return true;
  }
  async clipboard(text:string):Promise<void>{try{await bridge.copy(text);this.notification='Copied to clipboard.';}catch(error){this.error=String(error);}}
  async export(name:string,data:unknown):Promise<void>{try{if(await bridge.exportDocument(name,data))this.notification='Export saved.';}catch(error){this.error=String(error);}}
  async resume(id:string):Promise<void>{const result=await this.perform<{provider_id:number}>('session.resume',{session_id:id});if(result){this.selectedProvider=result.provider_id;this.navigate('browser');await this.perform('workspace.focus',{provider_id:result.provider_id});}}
  async cancel(id:string):Promise<void>{await this.perform('session.cancel',{session_id:id});}
  async showTabMenu(id:number,x:number,y:number):Promise<void>{try{await bridge.hideProviders();this.popupProvider=id;this.contextMenu={id,x,y};this.popup='tab-actions';}catch(error){this.error=String(error);}}
  moveTab(id:number,offset:-1|1):void{
    const ids=this.tabs.map(p=>p.id),index=ids.indexOf(id),next=index+offset;if(index<0||next<0||next>=ids.length)return;
    [ids[index],ids[next]]=[ids[next],ids[index]];this.tabOrder=ids;this.saveLayout();
  }
  toggleShelf():void{this.shelfVisible=!this.shelfVisible;this.saveLayout();}
  saveLayout():void{try{localStorage.setItem('bridge.layout.v2',JSON.stringify({inspector:this.inspectorWidth,right:this.inspectorVisible,order:this.tabOrder,shelf:this.shelfVisible}));}catch{/* Noncritical presentation preferences. */}}
  restoreLayout():void{
    try{
      const saved=localStorage.getItem('bridge.layout.v2');const value=JSON.parse(saved||localStorage.getItem('bridge.layout.v1')||'{}');
      if(!value||typeof value!=='object')return;
      if(Number.isFinite(value.inspector))this.inspectorWidth=Math.max(240,Math.min(380,value.inspector));
      this.inspectorVisible=!!saved&&value.right===true;
      this.shelfVisible=value.shelf!==false;
      if(Array.isArray(value.order))this.tabOrder=[...new Set<number>(value.order.filter((n:unknown):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>0))].slice(0,16);
    }catch{/* Invalid layout must not prevent browsing. */}
  }
}
export const app=new Application();
