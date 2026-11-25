import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateView, parseAnswer } from './generate-view.js';
import { catalog, scriptedModel, VALID_VIEW } from './test-support.js';
import { createValidator } from './validate.js';

const deps = (model: ReturnType<typeof scriptedModel>, log: unknown[] = []) => ({
  model,
  validate: createValidator(catalog),
  systemPrompt: 'SYSTEM',
  catalogId: catalog.catalogId,
  log: (event: string, data?: Record<string, unknown>) => void log.push({ event, ...data }),
});
const request = { prompt: 'Show my recent orders', surfaceId: 'main' };

describe('E5-S1: generate_view', () => {
  it('returns the view as A2UI messages for the surface, with the reply', async () => {
    const model = scriptedModel(JSON.stringify(VALID_VIEW));
    const view = await generateView(request, deps(model));
    assert.equal(view.outcome, 'valid');
    assert.equal(view.reply, 'Your recent orders.');
    assert.deepEqual(view.messages, [
      { version: 'v0.9', createSurface: { surfaceId: 'main', catalogId: catalog.catalogId } },
      { version: 'v0.9', updateComponents: { surfaceId: 'main', components: VALID_VIEW.components } },
    ]);
  });

  it('sends the system prompt, the history and the request to the model', async () => {
    const model = scriptedModel(JSON.stringify(VALID_VIEW));
    await generateView({ ...request, history: [{ role: 'user', content: 'earlier' }, { role: 'assistant', content: 'ok' }] }, deps(model));
    assert.deepEqual(model.calls[0]!.map((m) => m.role), ['system', 'user', 'assistant', 'user']);
    assert.equal(model.calls[0]![3]!.content, 'Show my recent orders');
  });
});

describe('E5-S3: validation and one repair attempt', () => {
  it('sends the validation errors back once and returns the repaired view', async () => {
    const broken = { reply: 'x', components: [{ id: 'root', component: 'Iframe' }] };
    const model = scriptedModel(JSON.stringify(broken), JSON.stringify(VALID_VIEW));
    const log: { event: string }[] = [];
    const view = await generateView(request, deps(model, log));
    assert.equal(view.outcome, 'repaired');
    assert.equal(model.calls.length, 2);
    assert.match(model.calls[1]!.at(-1)!.content, /Unknown component type 'Iframe'/);
    assert.ok(log.some((l) => l.event === 'view.generated' && 'repairMs' in l), 'logs the added latency');
  });

  it('never returns an invalid view: after a failed repair it falls back to a safe one', async () => {
    const model = scriptedModel('not json at all', '{"components": [{"id": "root", "component": "Nope"}]}');
    const view = await generateView(request, deps(model));
    assert.equal(view.outcome, 'fallback');
    assert.equal(model.calls.length, 2, 'at most one repair attempt');
    const components = (view.messages[1] as { updateComponents: { components: unknown[] } }).updateComponents.components;
    assert.equal(createValidator(catalog)(components).ok, true);
  });

  it('reads JSON wrapped in code fences or text', () => {
    assert.deepEqual(parseAnswer('```json\n' + JSON.stringify(VALID_VIEW) + '\n```'), VALID_VIEW);
    assert.equal(parseAnswer('no json'), null);
    assert.equal(parseAnswer('{"reply": "missing components"}'), null);
  });
});

describe('E5-S2: prompt assembled from the catalog export', () => {
  it('includes every catalog component, the data paths and the allowed actions, with weight explained once', async () => {
    const { buildSystemPrompt } = await import('./prompt.js');
    const prompt = buildSystemPrompt(catalog);
    for (const name of Object.keys(catalog.components)) assert.match(prompt, new RegExp(`### ${name}\\b`));
    assert.match(prompt, /\/accounts: list of/);
    assert.match(prompt, /- openOrderTicket:/);
    assert.equal(prompt.match(/`weight`/g)?.length, 1);
    assert.match(prompt, /never place an order/i);
  });
});
