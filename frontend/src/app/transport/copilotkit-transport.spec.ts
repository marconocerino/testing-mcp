import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CopilotKit } from '@copilotkit/angular';
import { A2uiMessage, AgentTransport, provideAgentTransport, TRANSPORT_MESSAGES } from './agent-transport';
import { A2UI_EVENT, CopilotKitTransport, TRADING_AGENT_ID } from './copilotkit-transport';

/** An AG-UI agent stand-in: records messages and lets the test fire subscriber hooks. */
class FakeAgent {
  readonly messages: unknown[] = [];
  subscribers: Record<string, (params: unknown) => void>[] = [];
  subscribe(s: Record<string, (params: unknown) => void>) {
    this.subscribers.push(s);
    return { unsubscribe: () => (this.subscribers = this.subscribers.filter((x) => x !== s)) };
  }
  addMessage(m: unknown) {
    this.messages.push(m);
  }
  fire(hook: string, params: unknown = {}) {
    this.subscribers.forEach((s) => s[hook]?.(params));
  }
}

describe('E5-S4: CopilotKitTransport', () => {
  let agent: FakeAgent;
  let agents: ReturnType<typeof signal<Record<string, unknown>>>;
  let connection: ReturnType<typeof signal<string>>;
  let runs: { agent: unknown; forwardedProps: Record<string, unknown> }[];
  let transport: CopilotKitTransport;
  let received: A2uiMessage[];

  beforeEach(async () => {
    agent = new FakeAgent();
    agents = signal<Record<string, unknown>>({});
    connection = signal('connecting');
    runs = [];
    TestBed.configureTestingModule({
      providers: [
        provideAgentTransport(CopilotKitTransport),
        {
          provide: CopilotKit,
          useValue: {
            agents,
            runtimeConnectionStatus: connection,
            core: { runAgent: (p: { agent: unknown; forwardedProps: Record<string, unknown> }) => (runs.push(p), Promise.resolve({})) },
          },
        },
      ],
    });
    transport = TestBed.inject(AgentTransport) as CopilotKitTransport;
    received = [];
    transport.messages$.subscribe((m) => received.push(m));
    agents.set({ [TRADING_AGENT_ID]: agent });
    connection.set('connected');
    TestBed.tick();
  });

  const message: A2uiMessage = { version: 'v0.9', createSurface: { surfaceId: 'main', catalogId: 'urn:trading-app:catalog:v1' } };

  it('subscribes to the trading agent once the runtime lists it', () => {
    expect(agent.subscribers).toHaveLength(1);
  });

  it('sends a prompt as a user message and runs the agent for the surface', () => {
    transport.sendPrompt('Show my orders', { surfaceId: 'main' });
    expect(agent.messages).toEqual([{ id: expect.any(String), role: 'user', content: 'Show my orders' }]);
    expect(runs).toEqual([{ agent, forwardedProps: { surfaceId: 'main' } }]);
    expect(transport.status()).toBe('connecting');
  });

  it('sends an action as a follow-up run without a user message', () => {
    transport.sendAction({ name: 'showAccount', surfaceId: 'main', sourceComponentId: 't', context: { accountId: 'ACC-1' } });
    expect(agent.messages).toEqual([]);
    expect(runs[0].forwardedProps).toEqual({ surfaceId: 'main', action: { name: 'showAccount', context: { accountId: 'ACC-1' } } });
  });

  it('passes A2UI custom events on, from any run (including ones the chat started)', () => {
    agent.fire('onRunStartedEvent');
    agent.fire('onCustomEvent', { event: { name: A2UI_EVENT, value: message } });
    agent.fire('onCustomEvent', { event: { name: 'something-else', value: { version: 'v0.9' } } });
    expect(received).toEqual([message]);
    expect(transport.status()).toBe('streaming');
    agent.fire('onRunFinalized');
    expect(transport.status()).toBe('idle');
  });

  it("shows the agent's own user-facing errors, and a generic one for anything else", () => {
    agent.fire('onRunErrorEvent', { event: { message: 'The assistant is busy right now. Try again in a few seconds.' } });
    expect(transport.error()).toEqual({ message: 'The assistant is busy right now. Try again in a few seconds.', retrying: false });
    agent.fire('onRunErrorEvent', { event: { message: 'TypeError: cannot read x of undefined at ...' } });
    expect(transport.error()!.message).toBe(TRANSPORT_MESSAGES.agentFailed);
    expect(transport.status()).toBe('error');
  });

  it('reports an unreachable runtime as unavailable', () => {
    connection.set('error');
    TestBed.tick();
    expect(transport.error()!.message).toBe(TRANSPORT_MESSAGES.unavailable);
  });
});
