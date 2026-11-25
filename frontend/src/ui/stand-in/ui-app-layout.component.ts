import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Stand-in for the internal library's application frame (Grid sections in the inventory).
 * Regions are filled by content projection:
 * - `[uiAppHeader]`: top bar (title, navigation, global actions)
 * - default content: the main region (`<main id="main">`)
 * - `[uiAppPanel]`: the side panel, shown when `panelOpen` (the assistant)
 *
 * Landmarks and a skip link are built in, so every screen gets them.
 */
@Component({
  selector: 'ui-app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-app-layout', '[class.ui-app-layout--panel-open]': 'panelOpen()' },
  template: `
    <a class="ui-app-layout__skip" href="#main">Skip to main content</a>
    <header class="ui-app-layout__header"><ng-content select="[uiAppHeader]" /></header>
    <main id="main" class="ui-app-layout__main" tabindex="-1"><ng-content /></main>
    <aside
      [id]="panelId()"
      class="ui-app-layout__panel"
      [attr.aria-label]="panelLabel()"
      [hidden]="!panelOpen()"
    >
      <ng-content select="[uiAppPanel]" />
    </aside>
  `,
})
export class UiAppLayoutComponent {
  readonly panelOpen = input(true);
  readonly panelLabel = input('Side panel');
  readonly panelId = input('app-panel');
}
