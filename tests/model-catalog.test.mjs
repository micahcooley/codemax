// The docs catalog must stay honest: every advertised figure carries its
// vendor source, longest-pattern wins so variants never inherit a sibling's
// numbers, and anything unverified resolves to null (unknown stays unknown).
import test from 'node:test';
import assert from 'node:assert/strict';
import {modelCatalog, catalogLookup, formatTokens, formatPlans} from '../dist/src/lib/model-catalog.js';
test('every advertised figure carries a vendor source and retrieval date', () => {
  assert.ok(modelCatalog.length > 10, 'catalog covers the supported sites');
  for (const entry of modelCatalog) {
    assert.ok(entry.patterns.length > 0 && entry.display, entry.display || 'entry');
    if (entry.contextTokens !== null) {
      assert.ok(entry.contextSource?.url.startsWith('http'), `${entry.display}: context source`);
      assert.match(entry.contextSource?.retrieved ?? '', /^\d{4}-\d{2}-\d{2}$/, `${entry.display}: retrieval date`);
      assert.ok(Number.isSafeInteger(entry.contextTokens) && entry.contextTokens >= 128, `${entry.display}: sane tokens`);
    }
    if (entry.reasoning !== null) {
      assert.ok(entry.reasoningSource?.url.startsWith('http'), `${entry.display}: reasoning source`);
      assert.ok(entry.reasoningNote, `${entry.display}: reasoning note`);
    }
    if (entry.plans !== null) {
      assert.ok(entry.plans.length > 0 && entry.plans.every(p => /^[a-z]+$/.test(p)), `${entry.display}: plan ids`);
      assert.ok(entry.plansSource?.url.startsWith('http'), `${entry.display}: plans source`);
    }
  }
});
test('longest pattern wins so variants never inherit sibling numbers', () => {
  assert.equal(catalogLookup('p1/gpt-5-mini', 'GPT-5 mini')?.display, 'GPT-5 mini');
  assert.equal(catalogLookup('p1/gpt-5', 'GPT-5')?.display, 'GPT-5');
  assert.equal(catalogLookup('p1/grok-4-heavy', 'Grok 4 Heavy')?.display, 'Grok 4 Heavy');
  assert.equal(catalogLookup('p1/grok-4', 'Grok 4')?.display, 'Grok 4');
  assert.equal(catalogLookup('p1/k2-thinking', 'Kimi K2 Thinking')?.display, 'Kimi K2 Thinking');
  assert.equal(catalogLookup('p1/k2', 'Kimi K2')?.display, 'Kimi K2');
  assert.equal(catalogLookup('p9/sonar-reasoning', 'Sonar Reasoning')?.display, 'Sonar Reasoning');
  assert.equal(catalogLookup('p9/sonar', 'Sonar')?.display, 'Sonar');
  assert.equal(catalogLookup('p4/minimax-m2-her', 'M2-her')?.display, 'MiniMax M2-her');
  assert.equal(catalogLookup('p4/minimax-m2', 'MiniMax M2')?.display, 'MiniMax M2');
});
test('dated snapshots and casing variants resolve to their family', () => {
  assert.equal(catalogLookup('p1/gpt-5-2025-08-07', 'gpt-5-2025-08-07')?.contextTokens, 400000);
  assert.equal(catalogLookup('p2/CLAUDE-SONNET-4-5', 'Claude Sonnet 4.5')?.contextTokens, 200000);
  assert.equal(catalogLookup('p7/GLM-4.6', 'glm-4.6')?.contextTokens, 200000);
});
test('unverified models resolve to null, never to a guess', () => {
  assert.equal(catalogLookup('p7/glm-5.3-flash', 'GLM-5.3-Flash'), null);
  assert.equal(catalogLookup('p8/step-3.5-flash', 'Step 3.5 Flash'), null);
  assert.equal(catalogLookup('p9/unknown-xyz', 'Something New'), null);
});
test('tier-gated flagships resolve with their plan scope', () => {
  const sol = catalogLookup('p1/gpt-5.6-sol', 'GPT-5.6 Sol');
  assert.equal(sol?.display, 'GPT-5.6 Sol');
  assert.deepEqual(sol?.plans, ['plus', 'pro']);
  const luna = catalogLookup('p1/gpt-5.6-luna', 'Luna');
  assert.deepEqual(luna?.plans, ['free', 'go', 'plus', 'pro']);
  const opus = catalogLookup('p2/claude-opus-5', 'Opus 5');
  assert.equal(opus?.contextTokens, 1000000);
  assert.deepEqual(opus?.plans, ['pro', 'max']);
  const fable = catalogLookup('p2/claude-fable-5', 'Fable 5');
  assert.deepEqual(fable?.plans, ['max']);
  assert.equal(fable?.contextTokens, 1000000);
  const sonnet5 = catalogLookup('p2/sonnet-5', 'Sonnet 5');
  assert.equal(sonnet5?.contextTokens, 1000000);
  const pro258 = catalogLookup('p3/gemini-2.5-pro', 'Gemini 2.5 Pro');
  assert.deepEqual(pro258?.plans, ['free', 'pro', 'ultra']);
});
test('token formatting stays compact and exact', () => {
  assert.equal(formatTokens(1048576), '1M');
  assert.equal(formatTokens(400000), '400K');
  assert.equal(formatTokens(262144), '262,144');
  assert.equal(formatPlans(['plus', 'pro']), 'Plus/Pro');
  assert.equal(formatPlans(null), null);
});
