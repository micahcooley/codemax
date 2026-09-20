export function shellQuote(value) { return "'" + value.replaceAll("'", "'\\''") + "'"; }
export function privateLaunch(client, endpoint, model, key, config) {
    if (!/^http:\/\/127\.0\.0\.1:\d{4,5}$/.test(endpoint) || !model || !key || /[\r\n\0]/.test(key))
        throw Error('INVALID_LOCAL_CONNECTION');
    if (client === 'opencode')
        return `env BRIDGE_API_KEY=${shellQuote(key)} OPENCODE_CONFIG_CONTENT=${shellQuote(JSON.stringify(config))} opencode`;
    if (client === 'claude')
        return `env ANTHROPIC_AUTH_TOKEN=${shellQuote(key)} ANTHROPIC_BASE_URL=${shellQuote(endpoint)} ANTHROPIC_MODEL=${shellQuote(model)} ANTHROPIC_DEFAULT_HAIKU_MODEL=${shellQuote(model)} ANTHROPIC_DEFAULT_SONNET_MODEL=${shellQuote(model)} ANTHROPIC_DEFAULT_OPUS_MODEL=${shellQuote(model)} claude`;
    const path = client === 'chat' ? '/v1/chat/completions' : client === 'responses' ? '/v1/responses' : '/v1/messages';
    const body = client === 'responses' ? { model, input: 'Hello', stream: true } : { model, messages: [{ role: 'user', content: 'Hello' }], stream: true, ...(client === 'messages' ? { max_tokens: 1024 } : {}) };
    return `curl --no-buffer ${shellQuote(endpoint + path)} -H ${shellQuote('Authorization: Bearer ' + key)} -H 'Content-Type: application/json'${client === 'messages' ? " -H 'anthropic-version: 2023-06-01'" : ''} --data ${shellQuote(JSON.stringify(body))}`;
}
