import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { A2UI_EVENT, createServer, toRequest } from './server.js';
import { catalog, scriptedModel, VALID_VIEW } from './test-support.js';
import { createValidator } from './validate.js';

describe('E5-S1: AG-UI endpoint', () => {
  let base: string;
  let model: ReturnType<typeof scriptedModel>;
  const logs: Record<string, unknown>[] = [];
  let close: () => void;

  before(async () => {
    model = scriptedModel();
    const app = createServer(
      { model: { complete: (m, s) => model.complete(m, s) }, validate: createValidator(catalog), systemPrompt: 'SYSTEM', catalogId: catalog.catalogId },
      (event, data) => void logs.push({ event, ...data }),
    );
    const server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    close = () => server.close();
  });
  after(() => close());

  const run = (body: object) =>
    fetch(`${base}/agent`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify(body) });

  async function events(response: Response) {
    const text = await response.text();
    return text
      .split('\n\n')
      .filter((block) => block.startsWith('data: '))
      .map((block) => JSON.parse(block.slice(6)) as { type: string; name?: string; value?: unknown; delta?: string; message?: string });
  }

  const input = (content: string, runId = 'run-1') => ({
    threadId: 'thread-1',
    runId,
    state: {},
    messages: [{ id: 'm1', role: 'user', content }],
    tools: [],
    context: [],
    forwardedProps: { surfaceId: 'main' },
  });

  it('streams RUN_STARTED, the A2UI messages, the reply and RUN_FINISHED', async () => {
    model = scriptedModel(JSON.stringify(VALID_VIEW));
    const response = await run(input('Show my recent orders'));
    assert.match(response.headers.get('content-type') ?? '', /^text\/event-stream/);
    assert.equal(response.headers.get('x-trace-id'), 'run-1');
    const ev = await events(response);
    assert.deepEqual(ev.map((e) => e.type), ['RUN_STARTED', 'CUSTOM', 'CUSTOM', 'TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_END', 'RUN_FINISHED']);
    assert.ok(ev.filter((e) => e.type === 'CUSTOM').every((e) => e.name === A2UI_EVENT));
    assert.deepEqual((ev[2]!.value as { updateComponents: { components: unknown } }).updateComponents.components, VALID_VIEW.components);
    assert.equal(ev[4]!.delta, 'Your recent orders.');
  });

  it('puts the run id in every log line as the trace id', async () => {
    model = scriptedModel(JSON.stringify(VALID_VIEW));
    logs.length = 0;
    await events(await run(input('orders', 'trace-42')));
    assert.ok(logs.length >= 2);
    assert.ok(logs.every((l) => l['traceId'] === 'trace-42'));
  });

  it('reports a failure as RUN_ERROR with a readable message, not the internal error', async () => {
    model = scriptedModel(new Error('ECONNRESET at socket 10.0.0.1'));
    const ev = await events(await run(input('orders')));
    assert.deepEqual(ev.map((e) => e.type), ['RUN_STARTED', 'RUN_ERROR']);
    assert.equal(ev[1]!.message, 'The assistant ran into a problem with that request.');
  });

  it('tells the user to retry when the model provider is busy (429)', async () => {
    const { ModelBusyError } = await import('./llm.js');
    model = scriptedModel(new ModelBusyError('rate limited'));
    const ev = await events(await run(input('orders')));
    assert.equal(ev[1]!.message, 'The assistant is busy right now. Try again in a few seconds.');
  });

  it('rejects a body that is not an AG-UI RunAgentInput', async () => {
    const response = await fetch(`${base}/agent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"hello": 1}' });
    assert.equal(response.status, 400);
  });

  it('turns messages and actions into the generate_view request', () => {
    const messages = [
      { id: '1', role: 'user', content: 'show accounts' },
      { id: '2', role: 'assistant', content: 'Here they are.' },
      { id: '3', role: 'user', content: 'now orders' },
    ] as never;
    assert.deepEqual(toRequest(messages, {}), {
      prompt: 'now orders',
      history: [{ role: 'user', content: 'show accounts' }, { role: 'assistant', content: 'Here they are.' }],
      surfaceId: 'main',
    });
    assert.match(toRequest(messages, { action: { name: 'showAccount', context: { accountId: 'ACC-1' } } })!.prompt, /pressed "showAccount" with \{"accountId":"ACC-1"\}/);
    assert.equal(toRequest([], {}), null);
  });
});
