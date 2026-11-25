import { DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { CopilotKit } from '@copilotkit/angular';
import { Subject } from 'rxjs';
import { A2uiMessage, AgentAction, AgentContext, AgentTransport, ConnectionStatus, TransportError } from './agent-transport';
import { TRANSPORT_MESSAGES } from './http-transport';

/** The agent the CopilotKit runtime hosts (services/copilot-runtime). */
export const TRADING_AGENT_ID = 'trading';

/** AG-UI custom event that carries one A2UI message (services/agent-service). */
export const A2UI_EVENT = 'a2ui.message';

/** Errors the agent service writes for users; anything else is shown as a generic message. */
const AGENT_MESSAGES = new Set([
  'The assistant is busy right now. Try again in a few seconds.',
  'The assistant ran into a problem with that request.',
  'Send a message to get a view.',
]);

/** The parts of an AG-UI agent this transport uses. */
interface Agent {
  subscribe(subscriber: Record<string, (params: never) => unknown>): { unsubscribe(): void };
  addMessage(message: { id: string; role: 'user'; content: string }): void;
}

/**
 * Talks to the agent through the self-hosted CopilotKit runtime (E5-S4). CopilotKit carries the
 * conversation (the chat panel uses the same agent); this transport picks the A2UI messages out
 * of the agent's AG-UI events and hands them to the app's own renderer. CopilotKit's built-in
 * A2UI renderer is never used (decision 2026-11-25).
 */
@Injectable()
export class CopilotKitTransport extends AgentTransport {
  private readonly copilotKit = inject(CopilotKit);
  private readonly subject = new Subject<A2uiMessage>();
  private agent?: Agent;

  override readonly messages$ = this.subject.asObservable();
  override readonly status = signal<ConnectionStatus>('idle');
  override readonly error = signal<TransportError | null>(null);

  constructor() {
    super();
    let subscription: { unsubscribe(): void } | undefined;
    // The runtime lists its agents once connected; subscribe when the trading agent appears.
    effect(() => {
      const agent = this.copilotKit.agents()[TRADING_AGENT_ID] as unknown as Agent | undefined;
      if (!agent || agent === this.agent) return;
      untracked(() => {
        subscription?.unsubscribe();
        this.agent = agent;
        subscription = agent.subscribe(this.subscriber());
      });
    });
    effect(() => {
      if (this.copilotKit.runtimeConnectionStatus() === 'error') {
        untracked(() => this.fail(TRANSPORT_MESSAGES.unavailable));
      }
    });
    inject(DestroyRef).onDestroy(() => {
      subscription?.unsubscribe();
      this.subject.complete();
    });
  }

  override sendPrompt(prompt: string, context: AgentContext = {}): void {
    const agent = this.requireAgent();
    if (!agent) return;
    agent.addMessage({ id: crypto.randomUUID(), role: 'user', content: prompt });
    this.run(agent, { surfaceId: context.surfaceId ?? 'main' });
  }

  override sendAction(action: AgentAction): void {
    const agent = this.requireAgent();
    if (!agent) return;
    this.run(agent, { surfaceId: action.surfaceId, action: { name: action.name, context: action.context } });
  }

  private run(agent: Agent, forwardedProps: Record<string, unknown>): void {
    this.error.set(null);
    this.status.set('connecting');
    this.copilotKit.core.runAgent({ agent: agent as never, forwardedProps }).catch(() => this.fail(TRANSPORT_MESSAGES.agentFailed));
  }

  private requireAgent(): Agent | undefined {
    if (!this.agent) this.fail(TRANSPORT_MESSAGES.unavailable);
    return this.agent;
  }

  private subscriber(): Record<string, (params: never) => unknown> {
    return {
      // Runs started by the chat panel too, not only by this transport.
      onRunStartedEvent: () => {
        this.error.set(null);
        this.status.set('connecting');
      },
      onCustomEvent: ({ event }: { event: { name: string; value: unknown } }) => {
        if (event.name !== A2UI_EVENT || !isA2uiMessage(event.value)) return;
        this.status.set('streaming');
        this.subject.next(event.value);
      },
      onRunErrorEvent: ({ event }: { event: { message?: string } }) => {
        this.fail(event.message && AGENT_MESSAGES.has(event.message) ? event.message : TRANSPORT_MESSAGES.agentFailed);
      },
      onRunFailed: () => {
        if (this.status() !== 'error') this.fail(TRANSPORT_MESSAGES.agentFailed);
      },
      onRunFinalized: () => {
        if (this.status() !== 'error') this.status.set('idle');
      },
    } as Record<string, (params: never) => unknown>;
  }

  private fail(message: string): void {
    this.status.set('error');
    this.error.set({ message, retrying: false });
  }
}

function isA2uiMessage(value: unknown): value is A2uiMessage {
  return !!value && typeof value === 'object' && typeof (value as { version?: unknown }).version === 'string';
}
