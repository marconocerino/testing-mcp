import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiEmptyStateComponent } from '@app/ui';
import { MAIN_SURFACE_ID } from '../shell/assistant-sidebar.component';
import { SurfaceHostComponent } from '../surface/surface-host.component';

/** The main page: whatever view the assistant built last, or a welcome until it has built one. */
@Component({
  selector: 'app-workspace-page',
  imports: [SurfaceHostComponent, UiEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-surface-host [surfaceId]="surfaceId" label="your view">
      <ui-empty-state
        title="No view yet"
        text="Ask the assistant for a view of your accounts, orders or spending. It builds the screen from the app's own components."
      />
    </app-surface-host>
  `,
})
export class WorkspacePage {
  protected readonly surfaceId = MAIN_SURFACE_ID;
}
