import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiEmptyStateComponent } from '@app/ui';
import { SURFACE_DATA } from '../data/mock-data';
import { ActionRouter } from '../surface/action-router';
import { SurfaceHostComponent } from '../surface/surface-host.component';
import { SurfaceSessionService } from '../surface/surface-session.service';
import { type ScreenSpec, screenMessages } from './screen-spec';

/**
 * A default view (Dashboard, Accounts, Orders): renders its hand-authored spec on its own surface
 * through the same session and validation as generated views. The route's data holds the spec. The
 * surface is kept when the user switches tabs, so a filter or selection survives.
 */
@Component({
  selector: 'app-screen-page',
  imports: [SurfaceHostComponent, UiEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-surface-host [surfaceId]="spec.id" [label]="spec.title">
      <ui-empty-state title="Loading" />
    </app-surface-host>
  `,
})
export class ScreenPage implements OnInit {
  /** The route's `data.spec` (app.routes.ts). */
  protected readonly spec = inject(ActivatedRoute).snapshot.data['spec'] as ScreenSpec;

  private readonly session = inject(SurfaceSessionService);
  private readonly actions = inject(ActionRouter);
  private readonly data = inject(SURFACE_DATA);

  ngOnInit(): void {
    const spec = this.spec;
    if (this.session.state(spec.id)()) return; // already built: keep its state
    this.session.load(screenMessages(spec, this.data()));
    if (spec.onLoad) this.actions.dispatch({ name: spec.onLoad, surfaceId: spec.id, sourceComponentId: 'screen', context: {} });
  }
}
