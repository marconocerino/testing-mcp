import { inject, Injectable, InjectionToken, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { A2uiMessage, AgentAction, AgentContext, AgentTransport, ConnectionStatus, TransportError } from './agent-transport';
import { readSse } from './sse';

/**
 * Base URL of the agent endpoint. The dev server proxies it to the agent service (E5); later it
 * points at the CopilotKit runtime (E5-S4).
 */
export const AGENT_ENDPOINT = new InjectionToken<string>('AgentEndpoint', { factory: () => '/api/agent' });

/** The fetch function used for agent traffic. Only the transport layer uses it (rule 3). */
export const AGENT_FETCH = new InjectionToken<typeof fetch>('AgentFetch', {
  factory: () => (input, init) => fetch(input, init),
});

export interface RetryPolicy {
  /** First retry waits this long; each later one doubles it. */
  baseDelayMs: number;
  maxDelayMs: number;
  /** Retries before giving up. */
  maxAttempts: number;
  /** Randomise delays by up to ±25 % so clients don't retry in step. */
  jitter: boolean;
}

export const AGENT_RETRY_POLICY = new InjectionToken<RetryPolicy>('AgentRetryPolicy', {
  factory: () => ({ baseDelayMs: 500, maxDelayMs: 15_000, maxAttempts: 6, jitter: true }),
});

/** Delay before retry number `attempt` (1-based): base, 2×base, 4×base… capped at max. */
export function backoffDelay(attempt: number, policy: RetryPolicy, random = Math.random): number {
  const delay = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (attempt - 1));
  return policy.jitter ? Math.round(delay * (0.75 + random() * 0.5)) : delay;
}

/** Messages users see. Never raw errors or stack traces. */
export const TRANSPORT_MESSAGES = {
  reconnecting: 'Connection to the assistant lost. Reconnecting…',
  gaveUp: 'Lost connection to the assistant. Please try again in a moment.',
  notAllowed: "You're not allowed to use the assistant.",
  unavailable: "The assistant isn't available right now.",
  badRequest: "The assistant couldn't process that request.",
  unreadable: 'The assistant sent a response the app could not read.',
  agentFailed: 'The assistant ran into a problem with that request.',
} as const;

class RetryableError extends Error {}
class FatalError extends Error {}

/**
 * Streams A2UI messages from the agent over HTTP (E3-S3).
 *
 * Wire protocol (the agent service implements it in E5):
 * - `POST {endpoint}/runs`, JSON body `{ runId, prompt?, action?, context?, lastEventId? }`,
 *   `Accept: text/event-stream`.
 * - The response is a server-sent event stream: `event: a2ui` with a numeric `id` and one A2UI
 *   message as JSON `data`; `event: done` when the run is complete; `event: error` with
 *   `{ "retryable": boolean }` data when it failed.
 * - If the stream breaks before `done`, the transport retries the same `runId` with exponential
 *   backoff, sending the last id it received (`lastEventId` and the `Last-Event-ID` header) so
 *   the server can resume. Ids it has already seen are skipped, so nothing renders twice.
 */
@Injectable()
export class HttpTransport extends AgentTransport implements OnDestroy {
  private readonly endpoint = inject(AGENT_ENDPOINT);
  private readonly fetchFn = inject(AGENT_FETCH);
  private readonly policy = inject(AGENT_RETRY_POLICY);
  private readonly subject = new Subject<A2uiMessage>();
  private controller?: AbortController;

  override readonly messages$ = this.subject.asObservable();
  override readonly status = signal<ConnectionStatus>('idle');
  override readonly error = signal<TransportError | null>(null);

  override sendPrompt(prompt: string, context: AgentContext = {}): void {
    void this.run({ prompt, context });
  }

  override sendAction(action: AgentAction): void {
    void this.run({ action, context: { surfaceId: action.surfaceId } });
  }

  ngOnDestroy(): void {
    this.controller?.abort();
    this.subject.complete();
  }

  private async run(request: Record<string, unknown>): Promise<void> {
    this.controller?.abort();
    const controller = (this.controller = new AbortController());
    const runId = crypto.randomUUID();
    let lastEventId: number | undefined;
    let attempt = 0;
    this.error.set(null);
    this.status.set('connecting');

    while (!controller.signal.aborted) {
      try {
        const response = await this.fetchFn(`${this.endpoint}/runs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(lastEventId !== undefined ? { 'Last-Event-ID': String(lastEventId) } : {}),
          },
          body: JSON.stringify({ ...request, runId, ...(lastEventId !== undefined ? { lastEventId } : {}) }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw errorForStatus(response.status);

        for await (const event of readSse(response.body)) {
          if (controller.signal.aborted) return;
          if (event.event === 'done') {
            this.status.set('idle');
            this.error.set(null);
            return;
          }
          if (event.event === 'error') {
            throw parseErrorEvent(event.data) ? new RetryableError(TRANSPORT_MESSAGES.agentFailed) : new FatalError(TRANSPORT_MESSAGES.agentFailed);
          }
          if (event.event !== 'a2ui') continue;
          const id = Number(event.id);
          if (Number.isFinite(id) && lastEventId !== undefined && id <= lastEventId) continue; // already rendered
          const message = parseMessage(event.data);
          if (Number.isFinite(id)) lastEventId = id;
          attempt = 0;
          this.status.set('streaming');
          this.error.set(null);
          this.subject.next(message);
        }
        throw new RetryableError(TRANSPORT_MESSAGES.reconnecting); // stream ended without `done`
      } catch (e) {
        if (controller.signal.aborted) return;
        if (e instanceof FatalError) return this.fail(e.message);
        attempt += 1;
        if (attempt > this.policy.maxAttempts) return this.fail(TRANSPORT_MESSAGES.gaveUp);
        this.status.set('reconnecting');
        this.error.set({ message: TRANSPORT_MESSAGES.reconnecting, retrying: true });
        await wait(backoffDelay(attempt, this.policy), controller.signal);
      }
    }
  }

  private fail(message: string): void {
    this.status.set('error');
    this.error.set({ message, retrying: false });
  }
}

function errorForStatus(status: number): Error {
  if (status === 408 || status === 429 || status >= 500) return new RetryableError(TRANSPORT_MESSAGES.reconnecting);
  if (status === 401 || status === 403) return new FatalError(TRANSPORT_MESSAGES.notAllowed);
  if (status === 404) return new FatalError(TRANSPORT_MESSAGES.unavailable);
  return new FatalError(TRANSPORT_MESSAGES.badRequest);
}

function parseMessage(data: string): A2uiMessage {
  try {
    const message = JSON.parse(data) as A2uiMessage;
    if (message && typeof message === 'object' && typeof message.version === 'string') return message;
  } catch {
    // fall through
  }
  throw new FatalError(TRANSPORT_MESSAGES.unreadable);
}

/** True when the server says the run can be retried. */
function parseErrorEvent(data: string): boolean {
  try {
    return (JSON.parse(data) as { retryable?: unknown }).retryable === true;
  } catch {
    return false;
  }
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}
