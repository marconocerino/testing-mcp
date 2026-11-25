import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { A2uiRendererService } from '@a2ui/angular';
import { formatSpecError } from '../catalog/spec-errors';
import { SURFACE_DATA } from '../data/mock-data';
import { A2uiMessage, AgentAction, AgentTransport, surfaceIdOf } from '../transport/agent-transport';
import { ActionRouter } from './action-router';

/**
 * - `building`: created, root not rendered yet (show a skeleton)
 * - `ready`: the root component exists; more updates may still stream in
 * - `failed`: a message failed validation; nothing of it was rendered
 */
export type SurfaceStatus = 'building' | 'ready' | 'failed';

export interface SurfaceState {
  status: SurfaceStatus;
  /** Readable validation error, when failed. */
  error?: string;
}

/** Data paths the agent may write: UI state only, never figures (rule 5). */
const AGENT_WRITABLE_DATA = /^\/ui(\/|$)/;

/**
 * Feeds A2UI messages into the renderer, one surface at a time (E3-S4). Every message from the
 * transport (or a hand-authored spec via {@link load}) is validated before it reaches the
 * screen; a failure marks the surface `failed`, logs the error and removes what was there.
 * New surfaces get the app's data model and route their actions through {@link ActionRouter}.
 */
@Injectable({ providedIn: 'root' })
export class SurfaceSessionService {
  private readonly renderer = inject(A2uiRendererService);
  private readonly router = inject(ActionRouter);
  private readonly initialData = inject(SURFACE_DATA);
  private readonly states = signal<ReadonlyMap<string, SurfaceState>>(new Map());
  private readonly actionSubscriptions = new Map<string, { unsubscribe(): void }>();

  constructor() {
    inject(AgentTransport)
      .messages$.pipe(takeUntilDestroyed())
      .subscribe((m) => this.apply(m, 'agent'));
    inject(DestroyRef).onDestroy(() => this.actionSubscriptions.forEach((s) => s.unsubscribe()));
  }

  /** The state of one surface; undefined when it doesn't exist. */
  state(surfaceId: string): Signal<SurfaceState | undefined> {
    return computed(() => this.states().get(surfaceId));
  }

  /** Renders hand-authored messages through the same checks as the agent's. */
  load(messages: readonly A2uiMessage[]): void {
    messages.forEach((m) => this.apply(m, 'app'));
  }

  private apply(message: A2uiMessage, origin: 'agent' | 'app'): void {
    const surfaceId = surfaceIdOf(message);
    if (!surfaceId) {
      console.warn('[surface] Ignored a message without a surface id.', message);
      return;
    }
    if (message.createSurface) {
      this.remove(surfaceId);
    } else if (this.states().get(surfaceId)?.status === 'failed') {
      return; // the rest of a failed view is dropped until the next createSurface
    }
    if (origin === 'agent' && message.updateDataModel && !AGENT_WRITABLE_DATA.test(message.updateDataModel.path ?? '/')) {
      console.warn(`[surface] Refused agent data for '${message.updateDataModel.path ?? '/'}' on ${surfaceId}: specs bind data, they don't send it (rule 5).`);
      return;
    }

    try {
      this.renderer.processMessages([message] as never);
    } catch (e) {
      this.fail(surfaceId, e);
      return;
    }

    if (message.createSurface) {
      this.setState(surfaceId, { status: 'building' });
      this.renderer.processMessages([
        { version: message.version, updateDataModel: { surfaceId, path: '/', value: this.initialData() } },
      ] as never);
      const surface = this.renderer.surfaceGroup.getSurface(surfaceId);
      const sub = surface?.onAction.subscribe((a) => {
        this.router.dispatch(a as unknown as AgentAction);
      });
      if (sub) this.actionSubscriptions.set(surfaceId, sub);
    } else if (message.updateComponents?.components.some((c) => (c as { id?: string }).id === 'root')) {
      this.setState(surfaceId, { status: 'ready' });
    } else if (message.deleteSurface) {
      this.forget(surfaceId);
    }
  }

  private fail(surfaceId: string, error: unknown): void {
    const message = formatSpecError(error);
    console.error(`[surface] ${surfaceId}: spec rejected, showing the fallback card.\n${message}`);
    this.removeFromRenderer(surfaceId);
    this.setState(surfaceId, { status: 'failed', error: message });
  }

  private remove(surfaceId: string): void {
    this.removeFromRenderer(surfaceId);
    this.forget(surfaceId);
  }

  private removeFromRenderer(surfaceId: string): void {
    this.actionSubscriptions.get(surfaceId)?.unsubscribe();
    this.actionSubscriptions.delete(surfaceId);
    if (this.renderer.surfaceGroup.getSurface(surfaceId)) {
      this.renderer.processMessages([{ version: 'v0.9', deleteSurface: { surfaceId } }] as never);
    }
  }

  private forget(surfaceId: string): void {
    this.states.update((m) => {
      const next = new Map(m);
      next.delete(surfaceId);
      return next;
    });
  }

  private setState(surfaceId: string, state: SurfaceState): void {
    this.states.update((m) => new Map(m).set(surfaceId, state));
  }
}
