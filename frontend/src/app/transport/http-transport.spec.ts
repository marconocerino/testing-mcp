import { TestBed } from '@angular/core/testing';
import { A2uiMessage, AgentTransport, provideAgentTransport } from './agent-transport';
import { AGENT_ENDPOINT, AGENT_FETCH, AGENT_RETRY_POLICY, backoffDelay, HttpTransport, TRANSPORT_MESSAGES } from './http-transport';

/** A streamed HTTP response the test feeds chunk by chunk. */
class FakeStream {
  private controller!: ReadableStreamDefaultController<Uint8Array>;
  readonly body = new ReadableStream<Uint8Array>({ start: (c) => void (this.controller = c) });
  message(id: number, msg: object) {
    this.send(`id: ${id}\nevent: a2ui\ndata: ${JSON.stringify(msg)}\n\n`);
  }
  send(text: string) {
    this.controller.enqueue(new TextEncoder().encode(text));
  }
  done() {
    this.send('event: done\ndata: {}\n\n');
    this.controller.close();
  }
  close() {
    this.controller.close();
  }
  drop() {
    this.controller.error(new TypeError('network error'));
  }
}

const msg = (n: number): A2uiMessage => ({ version: 'v0.9', updateComponents: { surfaceId: 'main', components: [{ id: `c${n}` }] } });

/** Lets pending promise callbacks and zero-delay timers run. */
const settle = async (times = 10) => {
  for (let i = 0; i < times; i++) await new Promise((r) => setTimeout(r, 0));
};

describe('E3-S3: HTTP streaming transport', () => {
  let calls: { url: string; init: RequestInit }[];
  let responses: (() => Response | Promise<Response>)[];
  let transport: HttpTransport;
  let received: A2uiMessage[];

  function respondWith(stream: FakeStream, status = 200) {
    responses.push(() => ({ ok: status < 300, status, body: stream.body }) as Response);
  }
  function respondStatus(status: number) {
    responses.push(() => ({ ok: false, status, body: null }) as Response);
  }
  function respondNetworkError() {
    responses.push(() => Promise.reject(new TypeError('Failed to fetch')));
  }

  beforeEach(() => {
    calls = [];
    responses = [];
    TestBed.configureTestingModule({
      providers: [
        provideAgentTransport(HttpTransport),
        { provide: AGENT_ENDPOINT, useValue: '/api/agent' },
        { provide: AGENT_RETRY_POLICY, useValue: { baseDelayMs: 1, maxDelayMs: 4, maxAttempts: 3, jitter: false } },
        {
          provide: AGENT_FETCH,
          useValue: (url: string, init: RequestInit) => {
            calls.push({ url, init });
            const next = responses.shift();
            if (!next) return Promise.reject(new Error('no response queued'));
            return Promise.resolve(next());
          },
        },
      ],
    });
    transport = TestBed.inject(AgentTransport) as HttpTransport;
    received = [];
    transport.messages$.subscribe((m) => received.push(m));
  });

  const body = (i: number) => JSON.parse(calls[i].init.body as string);
  const header = (i: number, name: string) => (calls[i].init.headers as Record<string, string>)[name];

  it('posts the prompt and context as a new run, asking for an event stream', async () => {
    const stream = new FakeStream();
    respondWith(stream);
    transport.sendPrompt('Show my accounts', { surfaceId: 'main' });
    await settle();
    expect(calls[0].url).toBe('/api/agent/runs');
    expect(calls[0].init.method).toBe('POST');
    expect(header(0, 'Accept')).toBe('text/event-stream');
    expect(body(0)).toEqual({ prompt: 'Show my accounts', context: { surfaceId: 'main' }, runId: expect.any(String) });
    expect(transport.status()).toBe('connecting');
  });

  it('emits each A2UI message as soon as it arrives', async () => {
    const stream = new FakeStream();
    respondWith(stream);
    transport.sendPrompt('x');
    await settle();

    stream.message(1, msg(1));
    await settle();
    expect(received).toEqual([msg(1)]);
    expect(transport.status()).toBe('streaming');

    stream.message(2, msg(2));
    await settle();
    expect(received).toEqual([msg(1), msg(2)]);

    stream.done();
    await settle();
    expect(transport.status()).toBe('idle');
  });

  it('reconnects after a drop, resumes from the last id and skips duplicates', async () => {
    const first = new FakeStream();
    const second = new FakeStream();
    respondWith(first);
    respondWith(second);
    transport.sendPrompt('x');
    await settle();
    first.message(1, msg(1));
    first.message(2, msg(2));
    await settle();

    first.drop();
    await settle(2);
    expect(['reconnecting', 'connecting']).toContain(transport.status());
    await settle();
    expect(calls).toHaveLength(2);
    expect(body(1).runId).toBe(body(0).runId);
    expect(body(1).lastEventId).toBe(2);
    expect(header(1, 'Last-Event-ID')).toBe('2');

    second.message(2, msg(2)); // the server replays the last one
    second.message(3, msg(3));
    second.done();
    await settle();
    expect(received).toEqual([msg(1), msg(2), msg(3)]);
    expect(transport.status()).toBe('idle');
    expect(transport.error()).toBeNull();
  });

  it('shows a retrying error while reconnecting', async () => {
    respondNetworkError();
    const stream = new FakeStream();
    respondWith(stream);
    transport.sendPrompt('x');
    await settle(1);
    await settle(1);
    expect(transport.error()).toEqual({ message: TRANSPORT_MESSAGES.reconnecting, retrying: true });
    await settle();
    stream.done();
    await settle();
    expect(transport.error()).toBeNull();
  });

  it('retries when a stream ends without "done"', async () => {
    const first = new FakeStream();
    const second = new FakeStream();
    respondWith(first);
    respondWith(second);
    transport.sendPrompt('x');
    await settle();
    first.message(1, msg(1));
    first.close();
    await settle();
    second.done();
    await settle();
    expect(calls).toHaveLength(2);
    expect(transport.status()).toBe('idle');
  });

  it('gives up after the last retry with a readable message, not a raw error', async () => {
    for (let i = 0; i < 4; i++) respondNetworkError();
    transport.sendPrompt('x');
    await settle(40);
    expect(calls).toHaveLength(4);
    expect(transport.status()).toBe('error');
    expect(transport.error()).toEqual({ message: TRANSPORT_MESSAGES.gaveUp, retrying: false });
    expect(transport.error()!.message).not.toMatch(/TypeError|fetch|at /);
  });

  it('retries server errors (5xx, 429) but not refusals (401, 403, 404)', async () => {
    respondStatus(503);
    const ok = new FakeStream();
    respondWith(ok);
    transport.sendPrompt('x');
    await settle();
    ok.done();
    await settle();
    expect(calls).toHaveLength(2);

    respondStatus(403);
    transport.sendPrompt('y');
    await settle();
    expect(calls).toHaveLength(3);
    expect(transport.status()).toBe('error');
    expect(transport.error()!.message).toBe(TRANSPORT_MESSAGES.notAllowed);
  });

  it('turns an agent error event and an unreadable message into readable errors', async () => {
    const failing = new FakeStream();
    respondWith(failing);
    transport.sendPrompt('x');
    await settle();
    failing.send('event: error\ndata: {"retryable":false,"detail":"stack trace here"}\n\n');
    await settle();
    expect(transport.error()!.message).toBe(TRANSPORT_MESSAGES.agentFailed);

    const garbled = new FakeStream();
    respondWith(garbled);
    transport.sendPrompt('y');
    await settle();
    garbled.send('id: 1\nevent: a2ui\ndata: {not json\n\n');
    await settle();
    expect(transport.error()!.message).toBe(TRANSPORT_MESSAGES.unreadable);
    expect(received).toEqual([]);
  });

  it('a new prompt cancels the run in progress', async () => {
    const first = new FakeStream();
    const second = new FakeStream();
    respondWith(first);
    respondWith(second);
    transport.sendPrompt('x');
    await settle();
    transport.sendPrompt('y');
    await settle();
    expect((calls[0].init.signal as AbortSignal).aborted).toBe(true);
    expect((calls[1].init.signal as AbortSignal).aborted).toBe(false);
  });

  it('sends actions as a run for their surface', async () => {
    const stream = new FakeStream();
    respondWith(stream);
    const action = { name: 'showAccount', surfaceId: 'main', sourceComponentId: 't', context: { accountId: 'ACC-1' } };
    transport.sendAction(action);
    await settle();
    expect(body(0)).toEqual({ action, context: { surfaceId: 'main' }, runId: expect.any(String) });
  });

  it('backs off exponentially, capped', () => {
    const policy = { baseDelayMs: 500, maxDelayMs: 15_000, maxAttempts: 6, jitter: false };
    expect([1, 2, 3, 4, 5, 6, 7].map((a) => backoffDelay(a, policy))).toEqual([500, 1000, 2000, 4000, 8000, 15000, 15000]);
    const jittered = backoffDelay(3, { ...policy, jitter: true }, () => 0);
    expect(jittered).toBe(1500);
  });
});
