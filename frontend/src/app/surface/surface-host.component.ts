import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SurfaceComponent } from '@a2ui/angular';
import { UiAlertComponent, UiCardComponent, UiSkeletonComponent, UiStackComponent, UiTextComponent } from '@app/ui';
import { SurfaceSessionService } from './surface-session.service';

/**
 * Shows one A2UI surface (E3-S4): a loading skeleton while it builds, the surface once its root
 * exists, or a fallback card when its spec failed validation. With no surface yet, shows its
 * projected content (an empty state). Several hosts can show different surfaces at once.
 */
@Component({
  selector: 'app-surface-host',
  imports: [SurfaceComponent, UiSkeletonComponent, UiCardComponent, UiAlertComponent, UiStackComponent, UiTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()?.status) {
      @case ('building') {
        <ui-skeleton [label]="'Building ' + label()" />
      }
      @case ('ready') {
        <a2ui-v09-surface [surfaceId]="surfaceId()" />
      }
      @case ('failed') {
        <ui-card>
          <ui-stack>
            <ui-alert tone="danger" title="This view couldn't be shown">
              The layout didn't pass the app's checks, so nothing from it was displayed. Try asking again in other words.
            </ui-alert>
            <details>
              <summary>Details</summary>
              <ui-text variant="caption">{{ state()?.error }}</ui-text>
            </details>
          </ui-stack>
        </ui-card>
      }
      @default {
        <ng-content />
      }
    }
  `,
})
export class SurfaceHostComponent {
  readonly surfaceId = input.required<string>();
  /** What the surface shows, for screen readers ("Building the main view…"). */
  readonly label = input('the view');

  private readonly session = inject(SurfaceSessionService);
  protected readonly state = computed(() => this.session.state(this.surfaceId())());
}
