<script lang="ts">
  import {app} from '../lib/state/app.svelte';
  import Badge from '../lib/components/Badge.svelte';
  import Empty from '../lib/components/Empty.svelte';
  import Icon from '../lib/components/Icon.svelte';
  let activeOnly=$state(false);
  const sessions=$derived((app.snapshot?.sessions??[]).filter(s=>!activeOnly||s.status==='ACTIVE'));
</script>
<section class="screen"><div class="page-heading"><div><div class="eyebrow">CONVERSATION STATE</div><h1>Sessions</h1><p>One browser conversation per provider. No hidden replay, provider switching or quota rotation.</p></div><label class="checkbox-label"><input type="checkbox" bind:checked={activeOnly}/>Active only</label></div>
  <div class="panel table-panel">{#if !sessions.length}<Empty title="No sessions to display" description="Sessions are created when an authenticated client submits a request to a mapped model." icon="history"/>
  {:else}<table><thead><tr><th>Session / model</th><th>Status</th><th>Turns</th><th>Context estimate</th><th>Actions</th></tr></thead><tbody>{#each sessions as session (session.id)}<tr><td><button class="copy-id mono" onclick={()=>app.clipboard(session.id)}>{session.id.slice(0,18)}…<Icon name="copy" size={12}/></button><small>{session.model}</small></td><td><Badge state={session.status}/></td><td>{session.turn_count}</td><td>{session.context.estimated_used.toLocaleString()}<small>UTF-8 bytes · not provider token usage</small></td><td><div class="button-group"><button class="secondary" disabled={session.status!=='ACTIVE'||!app.ready} onclick={()=>app.perform('session.cancel',{session_id:session.id})}><Icon name="stop" size={14}/>Cancel</button><button class="text-button" disabled={session.status==='EXPIRED'||!app.ready} onclick={()=>app.perform('session.end',{session_id:session.id})}>End session</button></div></td></tr>{/each}</tbody></table>{/if}</div>
  <div class="notice"><Icon name="shield"/><p>Only session metadata is persisted by the Zag gateway. Browser conversations may remain in the website profile. After a backend restart, continuity is not assumed: previous sessions become <strong>provider lost</strong>.</p></div>
</section>
