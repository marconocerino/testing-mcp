import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ComponentHostComponent } from '@a2ui/angular';
import { CardApi } from '@a2ui/web_core/v1_0';
import { UiCardComponent } from '@app/ui';
import { CatalogAdapter } from './adapter';

/**
 * The A2UI `Card` type, rendered by the `@app/ui` card.
 *
 * Reference adapter (E1-S2): copy this file to start a new one. See docs/adapters.md.
 * - Extend `CatalogAdapter` with the component's A2UI API type.
 * - Import UI only from `@app/ui`.
 * - Render children by id with `<a2ui-v09-component-host>` inside the `ui-*` element.
 */
@Component({
  selector: 'app-catalog-card',
  imports: [UiCardComponent, ComponentHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-card data-testid="library-card">
      @if (child(); as c) {
        <a2ui-v09-component-host [componentKey]="c" [surfaceId]="surfaceId()" />
      }
    </ui-card>
  `,
})
export class CardAdapterComponent extends CatalogAdapter<typeof CardApi> {
  protected readonly child = computed(() => this.props().child?.value());
}
