import './no-telemetry.js';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import express from 'express';
import { BASE_PATH, createApp, TRADING_AGENT_ID } from './app.js';

/** A stand-in agent service: answers every run with fixed AG-UI events. */
function stubAgent() {
  const app = express();
  app.use(express.json());
  const received: unknown[] = [];
  app.post('/agent', (req, res) => {
    received.push(req.body);
    const { threadId, runId } = req.body as { threadId: string; runId: string };
    const events = [
      { type: 'RUN_STARTED', threadId, runId },
      { type: 'CUSTOM', name: 'a2ui.message', value: { version: 'v0.9', createSurface: { surfaceId: 'main', catalogId: 'urn:trading-app:catalog:v1' } } },
      { type: 'RUN_FINISHED', threadId, runId },
    ];
    res.set('Content-Type', 'text/event-stream');
    res.end(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(''));
  });
  return { app, received };
}

async function listen(app: express.Express) {
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, close: () => server.close() };
}

describe('E5-S4: CopilotKit runtime', () => {
  let agent: Awaited<ReturnType<typeof listen>>;
  let runtime: Awaited<ReturnType<typeof listen>>;
  let stub: ReturnType<typeof stubAgent>;

  before(async () => {
    stub = stubAgent();
    agent = await listen(stub.app);
    runtime = await listen(createApp({ agentUrl: `${agent.url}/agent` }));
  });
  after(() => {
    runtime.close();
    agent.close();
  });

  it('reports the trading agent, with telemetry disabled', async () => {
    const info = (await (await fetch(`${runtime.url}${BASE_PATH}/info`)).json()) as Record<string, unknown>;
    assert.ok((info['agents'] as Record<string, unknown>)[TRADING_AGENT_ID]);
    assert.equal(info['telemetryDisabled'], true);
  });

  it('forwards a run to the agent service and streams its A2UI events back unchanged', async () => {
    const body = { threadId: 't1', runId: 'r1', state: {}, messages: [{ id: 'm1', role: 'user', content: 'orders' }], tools: [], context: [], forwardedProps: { surfaceId: 'main' } };
    const response = await fetch(`${runtime.url}${BASE_PATH}/agent/${TRADING_AGENT_ID}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    assert.match(text, /"name":"a2ui.message"/);
    assert.match(text, /"createSurface":\{"surfaceId":"main"/);
    assert.equal((stub.received.at(-1) as { forwardedProps: unknown }).forwardedProps && true, true);
    assert.deepEqual((stub.received.at(-1) as { forwardedProps: unknown }).forwardedProps, { surfaceId: 'main' });
  });

  it('does not answer cross-origin preflights (same-origin only)', async () => {
    const response = await fetch(`${runtime.url}${BASE_PATH}/info`, { method: 'OPTIONS', headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' } });
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  });
});
