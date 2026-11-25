import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UiAlertComponent, UiAppLayoutComponent, UiBadgeComponent, UiButtonComponent, UiNavLinkComponent, UiStackComponent, UiTextComponent } from '@app/ui';
import { DEV_ROUTES } from '../dev/dev.routes';
import { AgentTransport } from '../transport/agent-transport';

/**
 * App shell (E3-S1): header with navigation, the main region for the routed page, and a
 * collapsible panel reserved for the assistant. No sign-in yet: SSO is deferred for the MVP
 * (see docs/decisions.md), so every visitor is the mock user.
 */
@Component({
  selector: 'app-shell',
  imports: [UiAlertComponent, UiAppLayoutComponent, UiTextComponent, UiBadgeComponent, UiNavLinkComponent, UiButtonComponent, UiStackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-app-layout [panelOpen]="panelOpen()" panelLabel="Assistant" panelId="assistant-panel">
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
        <span class="ui-spacer"></span>
        <ui-button
          [ariaExpanded]="panelOpen()"
          ariaControls="assistant-panel"
          (pressed)="panelOpen.set(!panelOpen())"
        >{{ panelOpen() ? 'Hide assistant' : 'Assistant' }}</ui-button>
      </ng-container>

      @if (transport.status() === 'reconnecting') {
        <!-- Non-blocking (E3-S3): the page stays usable while the transport retries. -->
        <ui-alert tone="warning">{{ transport.error()?.message }}</ui-alert>
      }
      <ng-content />

      <ng-container uiAppPanel>
        <ng-content select="[appAssistant]" />
      </ng-container>
    </ui-app-layout>
  `,
})
export class ShellComponent {
  protected readonly transport = inject(AgentTransport);
  protected readonly panelOpen = signal(true);
  /** Dev-only pages; empty in production builds (dev.routes.prod.ts). */
  protected readonly devLinks = DEV_ROUTES.map((r) => ({ to: `/${r.path}`, label: String(r.title ?? r.path) }));
}
