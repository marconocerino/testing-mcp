import { inject, Injectable, InjectionToken, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { A2uiMessage, AgentAction, AgentContext, AgentTransport, ConnectionStatus, TransportError } from './agent-transport';
import { MOCK_RECORDINGS, MockRecording } from './recordings';

export interface MockTransportOptions {
  /** Pause before each message, so views build up as they would from a real agent. */
  delayMs: number;
}

export const MOCK_TRANSPORT_OPTIONS = new InjectionToken<MockTransportOptions>('MockTransportOptions', {
  factory: () => ({ delayMs: 350 }),
});

/** The recordings the mock replays. Tests can provide their own. */
export const MOCK_TRANSPORT_RECORDINGS = new InjectionToken<readonly MockRecording[]>('MockTransportRecordings', {
  factory: () => MOCK_RECORDINGS,
});

/**
 * Replays recorded A2UI message files instead of calling an agent (E3-S2), for tests, demos and
 * working without an LLM. A prompt picks the recording whose keywords it matches best, or the
 * `fallback` recording. Actions are recorded in {@link sentActions}; a recording that lists the
 * action's name in `actions` is replayed for it, other actions get no answer.
 */
@Injectable()
export class MockTransport extends AgentTransport implements OnDestroy {
  private readonly recordings = inject(MOCK_TRANSPORT_RECORDINGS);
  private readonly options = inject(MOCK_TRANSPORT_OPTIONS);
  private readonly subject = new Subject<A2uiMessage>();
  private timers: ReturnType<typeof setTimeout>[] = [];

  override readonly messages$ = this.subject.asObservable();
  override readonly status = signal<ConnectionStatus>('idle');
  override readonly error = signal<TransportError | null>(null);
  /** Actions received, newest last. */
  readonly sentActions = signal<AgentAction[]>([]);

  override sendPrompt(prompt: string, context: AgentContext = {}): void {
    this.replay(pickRecording(this.recordings, prompt), context.surfaceId);
  }

  override sendAction(action: AgentAction): void {
    this.sentActions.update((list) => [...list, action]);
    const recording = this.recordings.find((r) => r.actions?.includes(action.name));
    if (recording) this.replay(recording, action.surfaceId);
  }

  private replay(recording: MockRecording, surfaceId: string | undefined): void {
    this.cancel();
    this.error.set(null);
    const messages = recording.messages.map((m) => retarget(m, surfaceId));
    this.status.set('connecting');
    let at = 0;
    messages.forEach((message, i) => {
      at += this.options.delayMs;
      this.timers.push(
        setTimeout(() => {
          this.status.set('streaming');
          this.subject.next(message);
          if (i === messages.length - 1) this.status.set('idle');
        }, at),
      );
    });
  }

  ngOnDestroy(): void {
    this.cancel();
    this.subject.complete();
  }

  private cancel(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}

/** The recording with the most keyword hits in the prompt; `fallback` when none match. */
export function pickRecording(recordings: readonly MockRecording[], prompt: string): MockRecording {
  const text = prompt.toLowerCase();
  let best: MockRecording | undefined;
  let bestHits = 0;
  for (const r of recordings) {
    const hits = r.keywords.filter((k) => text.includes(k.toLowerCase())).length;
    if (hits > bestHits) [best, bestHits] = [r, hits];
  }
  const fallback = recordings.find((r) => r.id === 'fallback');
  if (!best && !fallback) throw new Error('MockTransport: no recording matches and there is no fallback recording');
  return best ?? fallback!;
}

/** Recordings target the surface `main`; point them at the caller's surface instead. */
function retarget(message: A2uiMessage, surfaceId: string | undefined): A2uiMessage {
  if (!surfaceId) return message;
  const copy = structuredClone(message);
  for (const key of ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface'] as const) {
    const body = copy[key] as { surfaceId?: string } | undefined;
    if (body) body.surfaceId = surfaceId;
  }
  return copy;
}
