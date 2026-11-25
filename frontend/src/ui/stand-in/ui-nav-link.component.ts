import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Stand-in for the internal library's Link, used for in-app navigation. The active link gets
 * `aria-current="page"`.
 */
@Component({
  selector: 'ui-nav-link',
  imports: [MatButton, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      matButton="text"
      class="ui-nav-link"
      [routerLink]="to()"
      routerLinkActive="ui-nav-link--active"
      [routerLinkActiveOptions]="{ exact: exact() }"
      ariaCurrentWhenActive="page"
    >
      <ng-content />
    </a>
  `,
})
export class UiNavLinkComponent {
  readonly to = input.required<string>();
  /** Active only on an exact URL match (use for `/`). */
  readonly exact = input(false);
}
