import { inject, Injectable, InjectionToken, Provider } from '@angular/core';
import { AgentAction, AgentTransport } from '../transport/agent-transport';

export type ActionHandler = (action: AgentAction) => void;

/** Forward the action to the agent as a follow-up event (E5-S6). */
export const FORWARD_TO_AGENT = 'agent';

/**
 * Actions with financial effect. No generated view may trigger them: registering a handler for
 * one throws, and dispatching one is refused. Orders go only through OrderTicket's confirm
 * step (rule 4).
 */
export const BLOCKED_ACTIONS: ReadonlySet<string> = new Set([
  'placeOrder',
  'submitOrder',
  'confirmOrder',
  'modifyOrder',
  'cancelOrder',
  'transfer',
  'withdraw',
  'deposit',
]);

/**
 * Adds client handlers built inside an injection context, so they can use services (the
 * router, the session). Same allow-list rules as {@link provideActionHandlers}.
 */
export function provideActionHandlerFactory(factory: () => Record<string, ActionHandler>): Provider {
  return { provide: ACTION_HANDLERS, multi: true, useFactory: factory };
}

const ACTION_HANDLERS = new InjectionToken<Record<string, ActionHandler>[]>('ActionHandlers');

/**
 * Adds action names to the allow-list, each with a client handler or `'agent'` to forward it
 * to the agent. Can be used more than once; a name registered twice is an error.
 */
export function provideActionHandlers(handlers: Record<string, ActionHandler | typeof FORWARD_TO_AGENT>): Provider {
  return {
    provide: ACTION_HANDLERS,
    multi: true,
    useFactory: () => {
      const transport = inject(AgentTransport);
      return Object.fromEntries(
        Object.entries(handlers).map(([name, h]) => [name, h === FORWARD_TO_AGENT ? (a: AgentAction) => transport.sendAction(a) : h]),
      );
    },
  };
}

/**
 * Routes actions from rendered surfaces to allow-listed handlers (E3-S4). Unknown actions are
 * ignored and logged; blocked ones are refused and logged.
 */
@Injectable({ providedIn: 'root' })
export class ActionRouter {
  private readonly handlers = new Map<string, ActionHandler>();

  constructor() {
    for (const group of inject(ACTION_HANDLERS, { optional: true }) ?? []) {
      for (const [name, handler] of Object.entries(group)) {
        if (BLOCKED_ACTIONS.has(name)) throw new Error(`Action '${name}' moves money and can't be handled from a generated view (rule 4).`);
        if (this.handlers.has(name)) throw new Error(`Action '${name}' has two handlers.`);
        this.handlers.set(name, handler);
      }
    }
  }

  /** The allow-listed action names. */
  get allowed(): string[] {
    return [...this.handlers.keys()];
  }

  /** Runs the action's handler. Returns false when the action was refused or ignored. */
  dispatch(action: AgentAction): boolean {
    if (BLOCKED_ACTIONS.has(action.name)) {
      console.warn(`[actions] Refused '${action.name}' from ${action.surfaceId}/${action.sourceComponentId}: blocked action (rule 4).`);
      return false;
    }
    const handler = this.handlers.get(action.name);
    if (!handler) {
      console.warn(`[actions] Ignored '${action.name}' from ${action.surfaceId}/${action.sourceComponentId}: not on the allow-list.`);
      return false;
    }
    handler(action);
    return true;
  }
}
