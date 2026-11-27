import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiAppLayoutComponent, UiBadgeComponent, UiNavLinkComponent, UiStackComponent, UiTextComponent } from '@app/ui';
import { DEV_ROUTES } from '../dev/dev.routes';

/**
 * App shell (E3-S1): header with the tabs (Dashboard, Accounts, Orders: hand-authored default
 * views; Build a view: the assistant) and the main region for the routed page.
 * No sign-in yet: SSO is deferred for the MVP (see docs/decisions.md).
 */
@Component({
  selector: 'app-shell',
  imports: [UiAppLayoutComponent, UiTextComponent, UiBadgeComponent, UiNavLinkComponent, UiStackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-app-layout>
      <ng-container uiAppHeader>
        <ui-text variant="title">Trading</ui-text>
        <ui-badge tone="warning">Mock data</ui-badge>
        <nav aria-label="Main">
          <ui-stack direction="horizontal" align="center">
            @for (tab of tabs; track tab.to) {
              <ui-nav-link [to]="tab.to">{{ tab.label }}</ui-nav-link>
            }
            @for (link of devLinks; track link.to) {
              <ui-nav-link [to]="link.to">{{ link.label }}</ui-nav-link>
            }
          </ui-stack>
        </nav>
      </ng-container>

      <ng-content />
    </ui-app-layout>
  `,
})
export class ShellComponent {
  /** The default views, then the tab where the user builds their own. */
  protected readonly tabs = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/accounts', label: 'Accounts' },
    { to: '/orders', label: 'Orders' },
    { to: '/build', label: 'Build a view' },
  ];
  /** Dev-only pages; empty in production builds (dev.routes.prod.ts). */
  protected readonly devLinks = DEV_ROUTES.map((r) => ({ to: `/${r.path}`, label: String(r.title ?? r.path) }));
}
