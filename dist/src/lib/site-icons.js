/** Vendored website icons. Every file under public/site-icons was fetched once
 * from the site itself or a brand-icon source at authoring time; the running
 * app performs no icon fetching, so icons work offline and leak nothing.
 * Hosts without a file fall back to the letter mark. */
const files = {
    'chat.z.ai': 'zai.svg',
    'chat.qwen.ai': 'qwen.svg',
    'chat.qwenlm.ai': 'qwen.svg',
    'chat.deepseek.com': 'deepseek.svg',
    'chatgpt.com': 'chatgpt.webp',
    'chat.openai.com': 'chatgpt.webp',
    'claude.ai': 'claude.svg',
    'gemini.google.com': 'gemini.png',
    'grok.com': 'grok.ico',
    'kimi.moonshot.cn': 'kimi.ico',
    'kimi.ai': 'kimi.ico',
    'chat.mistral.ai': 'mistral.png',
    'agent.minimax.io': 'minimax.svg',
    'chat.minimax.io': 'minimax.svg',
    'chat.stepfun.com': 'stepfun.jpg',
    'copilot.microsoft.com': 'copilot.svg',
    'meta.ai': 'meta.svg',
    'www.meta.ai': 'meta.svg',
    'perplexity.ai': 'perplexity.svg',
    'www.perplexity.ai': 'perplexity.svg',
    'github.com': 'github-copilot.svg',
};
function hostOf(value) {
    try {
        const url = new URL(value.includes('://') ? value : `https://${value}`);
        return url.hostname.toLowerCase();
    }
    catch {
        return value.toLowerCase();
    }
}
/** Local icon path for a website origin/host, or null for the letter mark. */
export function siteIcon(originOrHost) {
    const host = hostOf(originOrHost);
    const file = files[host] ?? (host.startsWith('www.') ? files[host.slice(4)] : undefined);
    return file ? `/site-icons/${file}` : null;
}
