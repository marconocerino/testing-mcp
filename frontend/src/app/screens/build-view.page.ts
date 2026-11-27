import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiAlertComponent, UiEmptyStateComponent } from '@app/ui';
import { AssistantSidebarComponent, MAIN_SURFACE_ID } from '../shell/assistant-sidebar.component';
import { SurfaceHostComponent } from '../surface/surface-host.component';
import { AgentTransport } from '../transport/agent-transport';

/**
 * "Build a view": the user describes a view to the assistant (CopilotKit sidebar, this tab only)
 * and the generated view renders here. Connection problems with the assistant show here only.
 */
@Component({
  selector: 'app-build-view-page',
  imports: [SurfaceHostComponent, UiEmptyStateComponent, UiAlertComponent, AssistantSidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (transport.status()) {
      @case ('reconnecting') {
        <!-- Non-blocking: the page stays usable while the transport retries. -->
        <ui-alert tone="warning">{{ transport.error()?.message }}</ui-alert>
      }
      @case ('error') {
        <ui-alert tone="danger">{{ transport.error()?.message }}</ui-alert>
      }
    }
    <app-surface-host [surfaceId]="surfaceId" label="your view">
      <ui-empty-state
        title="Build your own view"
        text="Describe the view you want to the assistant, for example 'my accounts as a compact table with this month's spending'. It builds the screen from the app's own components."
      />
    </app-surface-host>
    <app-assistant-sidebar />
  `,
})
export class BuildViewPage {
  protected readonly surfaceId = MAIN_SURFACE_ID;
  /** Connection problems are only shown here, where the assistant is used. */
  protected readonly transport = inject(AgentTransport);
}
