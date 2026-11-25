import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiAlertComponent, UiAppLayoutComponent, UiBadgeComponent, UiNavLinkComponent, UiStackComponent, UiTextComponent } from '@app/ui';
import { DEV_ROUTES } from '../dev/dev.routes';
import { AgentTransport } from '../transport/agent-transport';

/**
 * App shell (E3-S1): header with navigation and the main region for the routed page. The
 * assistant is CopilotKit's sidebar next to it (E5-S5), with its own open and close control.
 * No sign-in yet: SSO is deferred for the MVP (see docs/decisions.md).
 */
@Component({
  selector: 'app-shell',
  imports: [UiAlertComponent, UiAppLayoutComponent, UiTextComponent, UiBadgeComponent, UiNavLinkComponent, UiStackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-app-layout>
      <ng-container uiAppHeader>
        <ui-text variant="title">Trading</ui-text>
        <ui-badge tone="warning">Mock data</ui-badge>
        <nav aria-label="Main">
          <ui-stack direction="horizontal" align="center">
            <ui-nav-link to="/" [exact]="true">Workspace</ui-nav-link>
            @for (link of devLinks; track link.to) {
              <ui-nav-link [to]="link.to">{{ link.label }}</ui-nav-link>
            }
          </ui-stack>
        </nav>
      </ng-container>

      @switch (transport.status()) {
        @case ('reconnecting') {
          <!-- Non-blocking (E3-S3): the page stays usable while the transport retries. -->
          <ui-alert tone="warning">{{ transport.error()?.message }}</ui-alert>
        }
        @case ('error') {
          <ui-alert tone="danger">{{ transport.error()?.message }}</ui-alert>
        }
      }
      <ng-content />
    </ui-app-layout>
  `,
})
export class ShellComponent {
  protected readonly transport = inject(AgentTransport);
  /** Dev-only pages; empty in production builds (dev.routes.prod.ts). */
  protected readonly devLinks = DEV_ROUTES.map((r) => ({ to: `/${r.path}`, label: String(r.title ?? r.path) }));
}
