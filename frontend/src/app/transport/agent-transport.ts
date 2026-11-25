import { Provider, Signal, Type } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * The only way the app talks to the agent (E3-S2, CLAUDE.md rule 3). Components and services
 * inject `AgentTransport`; which implementation runs is chosen by one provider line in
 * `app.config.ts` (see {@link provideAgentTransport}). Nothing outside `src/app/transport/` may
 * use HttpClient, fetch, EventSource or postMessage for agent traffic; a test enforces it.
 */
export abstract class AgentTransport {
  /** A2UI messages from the agent, in order. Hot: subscribe before sending. */
  abstract readonly messages$: Observable<A2uiMessage>;
  /** Connection state, for status lines and banners. */
  abstract readonly status: Signal<ConnectionStatus>;
  /** The last problem, written for users (never a stack trace); null when all is well. */
  abstract readonly error: Signal<TransportError | null>;
  /** Asks the agent for a view. A new prompt replaces any run still in progress. */
  abstract sendPrompt(prompt: string, context?: AgentContext): void;
  /** Sends a user action from a generated view to the agent as a follow-up event. */
  abstract sendAction(action: AgentAction): void;
}

/**
 * - `idle`: nothing in flight
 * - `connecting`: request sent, waiting for the first message
 * - `streaming`: messages arriving
 * - `reconnecting`: connection lost, retrying (show a non-blocking banner)
 * - `error`: gave up; see {@link AgentTransport.error}
 */
export type ConnectionStatus = 'idle' | 'connecting' | 'streaming' | 'reconnecting' | 'error';

export interface TransportError {
  /** Short and readable, for the user. */
  message: string;
  /** True while the transport is still retrying on its own. */
  retrying: boolean;
}

/** What the agent needs to know besides the prompt. */
export interface AgentContext {
  /** Surface the generated view should replace. */
  surfaceId?: string;
}

/** A user action from a generated view, as A2UI reports it. */
export interface AgentAction {
  name: string;
  surfaceId: string;
  sourceComponentId: string;
  context: Record<string, unknown>;
}

/** One A2UI v0.9 server-to-client message. Validated by the renderer, not here. */
export interface A2uiMessage {
  version: string;
  createSurface?: { surfaceId: string; catalogId: string; [key: string]: unknown };
  updateComponents?: { surfaceId: string; components: object[] };
  updateDataModel?: { surfaceId: string; path?: string; value?: unknown };
  deleteSurface?: { surfaceId: string };
  [key: string]: unknown;
}

/** The surface id a message targets, if any. */
export function surfaceIdOf(message: A2uiMessage): string | undefined {
  return (message.createSurface ?? message.updateComponents ?? message.updateDataModel ?? message.deleteSurface)?.surfaceId;
}

/** Chooses the transport. Swap implementations by changing this one line in `app.config.ts`. */
export function provideAgentTransport(implementation: Type<AgentTransport>): Provider {
  return { provide: AgentTransport, useClass: implementation };
}
