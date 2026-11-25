import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Stand-in for the internal library's application frame (Grid sections in the inventory).
 * Regions are filled by content projection:
 * - `[uiAppHeader]`: top bar (title, navigation, global actions)
 * - default content: the main region (`<main id="main">`)
 *
 * Landmarks and a skip link are built in, so every screen gets them. The assistant is
 * CopilotKit's sidebar, docked next to this frame (E5-S5).
 */
@Component({
  selector: 'ui-app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-app-layout' },
  template: `
    <a class="ui-app-layout__skip" href="#main">Skip to main content</a>
    <header class="ui-app-layout__header"><ng-content select="[uiAppHeader]" /></header>
    <main id="main" class="ui-app-layout__main" tabindex="-1"><ng-content /></main>
  `,
})
export class UiAppLayoutComponent {}
