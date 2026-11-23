import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CatalogComponent, ComponentHostComponent } from '@a2ui/angular';
import { CardApi } from '@a2ui/web_core/v1_0';
import { UiCardComponent } from '@app/ui';

/** The A2UI `Card` type, rendered by the `@app/ui` card. */
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
export class CardAdapterComponent extends CatalogComponent<typeof CardApi> {
  protected readonly child = computed(() => this.props().child?.value());
}
