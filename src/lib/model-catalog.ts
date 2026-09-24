/** Curated vendor documentation for website models.
 *
 * Every figure below was read from the vendor's own documentation (URL +
 * retrieval date on each entry) on 2026-09-23. Figures are VENDOR-ADVERTISED
 * API context windows, not measured website conversation budgets: a website
 * may truncate earlier, and unknown stays unknown (null) rather than guessed.
 * Reasoning flags record whether the vendor documents a reasoning mode, not
 * website control values, which only observation can supply.
 *
 * Matching is boundary-aware longest-pattern-first, so dated snapshots
 * (gpt-5-2025-08-07) resolve to their family while distinct variants
 * (gpt-5-mini, grok-4-heavy) resolve to their own entries.
 */
export interface CatalogSource {url: string; retrieved: string}
export interface CatalogEntry {
  patterns: string[];
  display: string;
  contextTokens: number | null;
  contextSource: CatalogSource | null;
  reasoning: boolean | null;
  reasoningNote: string | null;
  reasoningSource: CatalogSource | null;
  /** Plan ids on the model's home site (e.g. ["plus","pro"]); null = untiered or unverified. */
  plans: string[] | null;
  plansSource: CatalogSource | null;
  planNote: string | null;
}
const OPENAI_GPT5: CatalogSource = {url: 'https://developers.openai.com/api/docs/models/gpt-5', retrieved: '2026-09-23'};
const OPENAI_GPT5_MINI: CatalogSource = {url: 'https://developers.openai.com/api/docs/models/gpt-5-mini', retrieved: '2026-09-23'};
const ANTHROPIC_CTX: CatalogSource = {url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows', retrieved: '2026-09-23'};
const GOOGLE_25_PRO: CatalogSource = {url: 'https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro', retrieved: '2026-09-23'};
const GOOGLE_25_FLASH: CatalogSource = {url: 'https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash', retrieved: '2026-09-23'};
const XAI_MODELS: CatalogSource = {url: 'https://docs.x.ai/docs/models', retrieved: '2026-09-23'};
const ALIBABA_QWEN3_MAX: CatalogSource = {url: 'https://help.aliyun.com/en/model-studio/model-qwen3-max', retrieved: '2026-09-23'};
const ALIBABA_QWEN3_235B: CatalogSource = {url: 'https://help.aliyun.com/en/model-studio/qwen3-235b-a22b', retrieved: '2026-09-23'};
const MOONSHOT_K2: CatalogSource = {url: 'https://platform.moonshot.ai/docs/guide/kimi-k2-quickstart', retrieved: '2026-09-23'};
const ZHIPU_MODELS: CatalogSource = {url: 'https://open.bigmodel.cn/dev/howuse/model', retrieved: '2026-09-23'};
const DEEPSEEK_DOCS: CatalogSource = {url: 'https://api-docs.deepseek.com/', retrieved: '2026-09-23'};
const DEEPSEEK_R1: CatalogSource = {url: 'https://github.com/deepseek-ai/DeepSeek-R1', retrieved: '2026-09-23'};
const MISTRAL_LARGE3: CatalogSource = {url: 'https://docs.mistral.ai/models/mistral-large-3-25-12', retrieved: '2026-09-23'};
const MISTRAL_MEDIUM3: CatalogSource = {url: 'https://docs.mistral.ai/models/mistral-medium-3-25-05', retrieved: '2026-09-23'};
const MINIMAX_TABLE: CatalogSource = {url: 'https://platform.minimax.io/docs/guides/text-generation', retrieved: '2026-09-23'};
const PERPLEXITY_SONAR: CatalogSource = {url: 'https://docs.perplexity.ai/docs/sonar/models/sonar', retrieved: '2026-09-23'};
const META_LLAMA4: CatalogSource = {url: 'http://llama.com/docs/model-cards-and-prompt-formats/llama4', retrieved: '2026-09-23'};
const OPENAI_PRICING: CatalogSource = {url: 'https://openai.com/chatgpt/pricing', retrieved: '2026-09-23'};
const OPENAI_SOL_BLOG: CatalogSource = {url: 'https://openai.com/index/improving-gpt-5-6-sol-in-chatgpt/', retrieved: '2026-09-23'};
const OPENAI_HELP_BUSINESS: CatalogSource = {url: 'https://help.openai.com/en/articles/12003714-chatgpt-business-models-limits.md', retrieved: '2026-09-23'};
const CLAUDE_TUTORIAL: CatalogSource = {url: 'https://claude.com/resources/tutorials/choosing-the-right-claude-model', retrieved: '2026-09-23'};
const CLAUDE_CTX_1M: CatalogSource = {url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows', retrieved: '2026-09-23'};
const GEMINI_SUBS: CatalogSource = {url: 'https://gemini.google/subscriptions', retrieved: '2026-09-23'};
export const modelCatalog: CatalogEntry[] = [
  {patterns: ['gpt-5-mini', 'gpt-5 mini'], display: 'GPT-5 mini', contextTokens: 400000, contextSource: OPENAI_GPT5_MINI, reasoning: true, reasoningNote: 'Reasoning token support', reasoningSource: OPENAI_GPT5_MINI, plans: ['plus', 'pro'], plansSource: OPENAI_PRICING, planNote: 'Thinking Mini on Free and Go'},
  {patterns: ['gpt-5'], display: 'GPT-5', contextTokens: 400000, contextSource: OPENAI_GPT5, reasoning: true, reasoningNote: 'reasoning_effort: minimal, low, medium, high', reasoningSource: OPENAI_GPT5, plans: ['plus', 'pro'], plansSource: OPENAI_PRICING, planNote: 'Legacy model on paid plans'},
  {patterns: ['gpt-5.6-sol-pro', 'sol pro', '5.6-sol-pro'], display: 'GPT-5.6 Sol Pro', contextTokens: null, contextSource: null, reasoning: true, reasoningNote: 'Pro reasoning tier', reasoningSource: OPENAI_HELP_BUSINESS, plans: ['pro'], plansSource: OPENAI_PRICING, planNote: null},
  {patterns: ['gpt-5.6-sol', '5.6 sol', 'sol'], display: 'GPT-5.6 Sol', contextTokens: null, contextSource: null, reasoning: true, reasoningNote: 'Instant, Medium, High and Extra High effort slider', reasoningSource: OPENAI_HELP_BUSINESS, plans: ['plus', 'pro'], plansSource: OPENAI_PRICING, planNote: 'Also Perplexity Max'},
  {patterns: ['gpt-5.6-terra', '5.6 terra', 'terra'], display: 'GPT-5.6 Terra', contextTokens: null, contextSource: null, reasoning: null, reasoningNote: null, reasoningSource: null, plans: ['plus', 'pro'], plansSource: OPENAI_PRICING, planNote: 'Limited Work and Codex access on Free and Go'},
  {patterns: ['gpt-5.6-luna', '5.6 luna', 'luna'], display: 'GPT-5.6 Luna', contextTokens: null, contextSource: null, reasoning: true, reasoningNote: 'Think button for harder questions', reasoningSource: OPENAI_SOL_BLOG, plans: ['free', 'go', 'plus', 'pro'], plansSource: OPENAI_PRICING, planNote: 'Default on Free and Go'},
  {patterns: ['gpt-6-pro', 'gpt-6 astra', 'astra'], display: 'GPT-6 Pro', contextTokens: null, contextSource: null, reasoning: null, reasoningNote: null, reasoningSource: null, plans: ['pro', 'business'], plansSource: OPENAI_HELP_BUSINESS, planNote: null},
  {patterns: ['claude-sonnet-4-5', 'sonnet 4.5', 'sonnet-4-5'], display: 'Claude Sonnet 4.5', contextTokens: 200000, contextSource: ANTHROPIC_CTX, reasoning: true, reasoningNote: 'Extended thinking', reasoningSource: ANTHROPIC_CTX, plans: ['free', 'pro', 'max'], plansSource: CLAUDE_TUTORIAL, planNote: null},
  {patterns: ['claude-haiku-4-5', 'haiku 4.5', 'haiku-4-5'], display: 'Claude Haiku 4.5', contextTokens: 200000, contextSource: ANTHROPIC_CTX, reasoning: true, reasoningNote: 'Extended thinking', reasoningSource: ANTHROPIC_CTX, plans: ['free', 'pro', 'max'], plansSource: CLAUDE_TUTORIAL, planNote: null},
  {patterns: ['claude-sonnet-5', 'sonnet 5', 'sonnet-5'], display: 'Claude Sonnet 5', contextTokens: 1000000, contextSource: CLAUDE_CTX_1M, reasoning: true, reasoningNote: 'Adaptive thinking', reasoningSource: CLAUDE_CTX_1M, plans: ['free', 'pro', 'max'], plansSource: CLAUDE_TUTORIAL, planNote: null},
  {patterns: ['claude-opus-5', 'opus 5', 'opus-5'], display: 'Claude Opus 5', contextTokens: 1000000, contextSource: CLAUDE_CTX_1M, reasoning: true, reasoningNote: 'Adaptive thinking', reasoningSource: CLAUDE_CTX_1M, plans: ['pro', 'max'], plansSource: CLAUDE_TUTORIAL, planNote: null},
  {patterns: ['claude-fable-5', 'fable 5', 'fable-5', 'fable'], display: 'Claude Fable 5', contextTokens: 1000000, contextSource: CLAUDE_CTX_1M, reasoning: true, reasoningNote: 'Adaptive thinking', reasoningSource: CLAUDE_CTX_1M, plans: ['max'], plansSource: CLAUDE_TUTORIAL, planNote: 'Pro runs on prepaid usage credits'},
  {patterns: ['gemini-2.5-pro', 'gemini 2.5 pro', '2.5 pro'], display: 'Gemini 2.5 Pro', contextTokens: 1048576, contextSource: GOOGLE_25_PRO, reasoning: true, reasoningNote: 'thinkingBudget, dynamic by default', reasoningSource: GOOGLE_25_PRO, plans: ['free', 'pro', 'ultra'], plansSource: GEMINI_SUBS, planNote: 'Limited on Free; Deep Think is Ultra'},
  {patterns: ['gemini-2.5-flash', 'gemini 2.5 flash', '2.5 flash'], display: 'Gemini 2.5 Flash', contextTokens: 1048576, contextSource: GOOGLE_25_FLASH, reasoning: true, reasoningNote: 'thinkingBudget, dynamic by default', reasoningSource: GOOGLE_25_FLASH, plans: ['free', 'pro', 'ultra'], plansSource: GEMINI_SUBS, planNote: null},
  {patterns: ['grok-4-heavy', 'grok 4 heavy'], display: 'Grok 4 Heavy', contextTokens: null, contextSource: null, reasoning: true, reasoningNote: 'Multi-agent deep reasoning', reasoningSource: XAI_MODELS, plans: null, plansSource: null, planNote: null},
  {patterns: ['grok-4', 'grok 4'], display: 'Grok 4', contextTokens: 256000, contextSource: XAI_MODELS, reasoning: true, reasoningNote: 'Always-on reasoning, no effort parameter', reasoningSource: XAI_MODELS, plans: null, plansSource: null, planNote: null},
  {patterns: ['qwen3-max', 'qwen3 max', 'qwen max'], display: 'Qwen3-Max', contextTokens: 262144, contextSource: ALIBABA_QWEN3_MAX, reasoning: true, reasoningNote: 'Thinking and non-thinking modes', reasoningSource: ALIBABA_QWEN3_MAX, plans: null, plansSource: null, planNote: null},
  {patterns: ['qwen3-235b', 'qwen3 235b', 'qwen 235b'], display: 'Qwen3-235B', contextTokens: 131072, contextSource: ALIBABA_QWEN3_235B, reasoning: true, reasoningNote: 'Thinking and non-thinking modes', reasoningSource: ALIBABA_QWEN3_235B, plans: null, plansSource: null, planNote: null},
  {patterns: ['k2-thinking', 'k2 thinking'], display: 'Kimi K2 Thinking', contextTokens: 256000, contextSource: MOONSHOT_K2, reasoning: true, reasoningNote: 'Long-term thinking variant', reasoningSource: MOONSHOT_K2, plans: null, plansSource: null, planNote: null},
  {patterns: ['kimi-k2', 'kimi k2', 'k2'], display: 'Kimi K2', contextTokens: 256000, contextSource: MOONSHOT_K2, reasoning: false, reasoningNote: 'Non-thinking flagship', reasoningSource: MOONSHOT_K2, plans: null, plansSource: null, planNote: null},
  {patterns: ['glm-4.6', 'glm 4.6'], display: 'GLM-4.6', contextTokens: 200000, contextSource: ZHIPU_MODELS, reasoning: true, reasoningNote: 'Hybrid thinking mode', reasoningSource: ZHIPU_MODELS, plans: null, plansSource: null, planNote: null},
  {patterns: ['deepseek-r1', 'deepseek-reasoner', 'deepseek r1'], display: 'DeepSeek-R1', contextTokens: 131072, contextSource: DEEPSEEK_DOCS, reasoning: true, reasoningNote: 'DeepThink reasoning mode', reasoningSource: DEEPSEEK_R1, plans: null, plansSource: null, planNote: null},
  {patterns: ['deepseek-v3', 'deepseek-chat', 'deepseek v3'], display: 'DeepSeek-V3', contextTokens: 131072, contextSource: DEEPSEEK_DOCS, reasoning: false, reasoningNote: 'General chat, no reasoning mode', reasoningSource: DEEPSEEK_DOCS, plans: null, plansSource: null, planNote: null},
  {patterns: ['mistral-large', 'mistral large'], display: 'Mistral Large 3', contextTokens: 262144, contextSource: MISTRAL_LARGE3, reasoning: null, reasoningNote: null, reasoningSource: null, plans: null, plansSource: null, planNote: null},
  {patterns: ['mistral-medium', 'mistral medium'], display: 'Mistral Medium 3', contextTokens: 131072, contextSource: MISTRAL_MEDIUM3, reasoning: null, reasoningNote: null, reasoningSource: null, plans: null, plansSource: null, planNote: null},
  {patterns: ['minimax-m2-her', 'm2-her', 'm2 her'], display: 'MiniMax M2-her', contextTokens: 65536, contextSource: MINIMAX_TABLE, reasoning: null, reasoningNote: null, reasoningSource: null, plans: null, plansSource: null, planNote: null},
  {patterns: ['minimax-m2', 'minimax m2', 'mini max m2'], display: 'MiniMax M2', contextTokens: 204800, contextSource: MINIMAX_TABLE, reasoning: true, reasoningNote: 'Agentic capabilities, advanced reasoning', reasoningSource: MINIMAX_TABLE, plans: null, plansSource: null, planNote: null},
  {patterns: ['sonar-reasoning', 'sonar reasoning'], display: 'Sonar Reasoning', contextTokens: null, contextSource: null, reasoning: true, reasoningNote: 'Reasoning-optimized search model', reasoningSource: PERPLEXITY_SONAR, plans: null, plansSource: null, planNote: null},
  {patterns: ['sonar-pro', 'sonar pro'], display: 'Sonar Pro', contextTokens: null, contextSource: null, reasoning: null, reasoningNote: null, reasoningSource: null, plans: null, plansSource: null, planNote: null},
  {patterns: ['sonar-deep-research', 'sonar deep research'], display: 'Sonar Deep Research', contextTokens: null, contextSource: null, reasoning: true, reasoningNote: 'Deep research reasoning model', reasoningSource: PERPLEXITY_SONAR, plans: null, plansSource: null, planNote: null},
  {patterns: ['sonar'], display: 'Sonar', contextTokens: 131072, contextSource: PERPLEXITY_SONAR, reasoning: false, reasoningNote: 'Non-reasoning search model', reasoningSource: PERPLEXITY_SONAR, plans: null, plansSource: null, planNote: null},
  {patterns: ['llama-4-scout', 'llama scout', 'scout'], display: 'Llama 4 Scout', contextTokens: 10485760, contextSource: META_LLAMA4, reasoning: null, reasoningNote: null, reasoningSource: null, plans: null, plansSource: null, planNote: null},
  {patterns: ['llama-4-maverick', 'llama maverick', 'maverick'], display: 'Llama 4 Maverick', contextTokens: 1048576, contextSource: META_LLAMA4, reasoning: null, reasoningNote: null, reasoningSource: null, plans: null, plansSource: null, planNote: null},
];
const normalized = (value: string): string => value.toLowerCase();
function boundaryMatch(haystack: string, pattern: string): boolean {
  let from = 0;
  while (true) {
    const at = haystack.indexOf(pattern, from);
    if (at < 0) return false;
    const before = at === 0 || !/[a-z0-9]/.test(haystack[at - 1]);
    const after = at + pattern.length >= haystack.length || !/[a-z0-9]/.test(haystack[at + pattern.length]);
    if (before && after) return true;
    from = at + 1;
  }
}
/** Longest-pattern-first lookup over the model id and display name. */
export function catalogLookup(id: string, displayName: string): CatalogEntry | null {
  const haystack = `${normalized(id)} ${normalized(displayName)}`;
  let best: CatalogEntry | null = null;
  let bestLength = 0;
  for (const entry of modelCatalog) {
    for (const pattern of entry.patterns) {
      if (pattern.length > bestLength && boundaryMatch(haystack, pattern)) {
        best = entry;
        bestLength = pattern.length;
      }
    }
  }
  return best;
}
export function formatTokens(n: number): string {
  if (n >= 1048576 && n % 1048576 === 0) return `${n / 1048576}M`;
  if (n >= 1000 && n % 1000 === 0) return `${n / 1000}K`;
  return n.toLocaleString('en-US');
}
/** Plan ids as shown beside docs figures, e.g. "Plus/Pro". */
export function formatPlans(plans: string[] | null): string | null {
  if (!plans || !plans.length) return null;
  return plans.map(p => p.length ? p[0].toUpperCase() + p.slice(1) : p).join('/');
}
