/** Presentation-only client config. Native code owns registration, auth and routing. */
export type ClientFormat='opencode'|'claude'|'chat'|'responses'|'messages';
export interface OpencodeModelEntry {id:string;providerLabel:string;displayName:string;}
export interface OpencodeConfig {$schema:string;model:string;provider:{codemax:{npm:string;name:string;options:{baseURL:string;apiKey:string};models:Record<string,{name:string}>}};}
/** Multi-model opencode.json. The default model must be one of the included
 * models; every included model becomes selectable inside OpenCode. */
export function buildOpencodeConfig(endpoint:string,defaultModelId:string,models:OpencodeModelEntry[]):OpencodeConfig{
 if(!/^http:\/\/127\.0\.0\.1:\d{4,5}$/.test(endpoint)||!defaultModelId||!models.length||!models.some(m=>m.id===defaultModelId))throw Error('INVALID_OPENCODE_CONFIG');
 for(const m of models){if(!m.id||!m.providerLabel||!m.displayName)throw Error('INVALID_OPENCODE_CONFIG');}
 return {$schema:'https://opencode.ai/config.json',model:`codemax/${defaultModelId}`,provider:{codemax:{npm:'@ai-sdk/openai-compatible',name:'Codemax websites',options:{baseURL:`${endpoint}/v1`,apiKey:'{env:CODEMAX_API_KEY}'},models:Object.fromEntries(models.map(m=>[m.id,{name:`${m.providerLabel} / ${m.displayName}`}]))}}};
}
export function shellQuote(value:string):string{return "'"+value.replaceAll("'","'\\''")+"'";}
export function privateLaunch(client:ClientFormat,endpoint:string,model:string,key:string,config:unknown):string{
 if(!/^http:\/\/127\.0\.0\.1:\d{4,5}$/.test(endpoint)||!model||!key||/[\r\n\0]/.test(key))throw Error('INVALID_LOCAL_CONNECTION');
 if(client==='opencode')return `env CODEMAX_API_KEY=${shellQuote(key)} OPENCODE_CONFIG_CONTENT=${shellQuote(JSON.stringify(config))} opencode`;
 if(client==='claude')return `env ANTHROPIC_AUTH_TOKEN=${shellQuote(key)} ANTHROPIC_BASE_URL=${shellQuote(endpoint)} ANTHROPIC_MODEL=${shellQuote(model)} ANTHROPIC_DEFAULT_HAIKU_MODEL=${shellQuote(model)} ANTHROPIC_DEFAULT_SONNET_MODEL=${shellQuote(model)} ANTHROPIC_DEFAULT_OPUS_MODEL=${shellQuote(model)} claude`;
 const path=client==='chat'?'/v1/chat/completions':client==='responses'?'/v1/responses':'/v1/messages';
 const body=client==='responses'?{model,input:'Hello',stream:true}:{model,messages:[{role:'user',content:'Hello'}],stream:true,...(client==='messages'?{max_tokens:1024}:{})};
 return `curl --no-buffer ${shellQuote(endpoint+path)} -H ${shellQuote('Authorization: Bearer '+key)} -H 'Content-Type: application/json'${client==='messages'?" -H 'anthropic-version: 2023-06-01'":''} --data ${shellQuote(JSON.stringify(body))}`;
}
