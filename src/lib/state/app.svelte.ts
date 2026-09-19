import type {Route, Snapshot, HostStatus, Provider} from '../types/bridge';
import * as bridge from '../api/bridge';
class Application {
  route = $state<Route>('home');
  snapshot = $state<Snapshot|null>(null);
  host = $state<HostStatus>({state:'STARTING',code:null});
  selectedProvider = $state<number|null>(null);
  popup = $state<'add'|'commands'|'rotate-key'|'clear-profile'|null>(null);
  error = $state('');
  notification = $state('');
  pending = $state(0);
  density = $state<'comfortable'|'compact'>('comfortable');
  sidebarWidth = $state(232);
  inspectorWidth = $state(292);
  providers = $derived(this.snapshot?.providers ?? []);
  models = $derived(this.providers.flatMap(provider => provider.models.map(model => ({...model,provider}))));
  provider = $derived<Provider|undefined>(this.providers.find(provider => provider.id === this.selectedProvider));
  ready = $derived(this.host.state === 'READY' && !!this.snapshot);
  async perform<T>(op: string, params: Record<string, unknown> = {}): Promise<T|undefined> {
    this.pending++; this.error = '';
    try { return await bridge.request<T>(op, params); }
    catch (error) { this.error = error instanceof Error ? error.message : String(error); return undefined; }
    finally { this.pending--; }
  }
  async showPopup(popup: typeof this.popup): Promise<void> {
    try { await bridge.hideProviders(); } catch (error) { this.error = String(error); return; }
    this.popup = popup;
  }
  async openProvider(id: number): Promise<void> {
    this.selectedProvider = id; this.route = 'browser';
    await this.perform('provider.open', {provider_id:id});
  }
  async clipboard(text: string): Promise<void> {
    try { await bridge.copy(text); this.notification = 'Copied to clipboard.'; }
    catch (error) { this.error = String(error); }
  }
}
export const app = new Application();
