import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ComponentHostComponent } from '@a2ui/angular';
import { ButtonApi } from '@a2ui/web_core/v1_0';
import { UiButtonComponent, type UiButtonVariant } from '@app/ui';
import { CatalogAdapter } from './adapter';

/**
 * The A2UI `Button` type, rendered by the `@app/ui` button. Its label is a child component
 * (usually `Text`). A click emits the spec's action; it never calls a service, and no action
 * can place a trade (rule 4).
 */
@Component({
  selector: 'app-catalog-button',
  imports: [UiButtonComponent, ComponentHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-button [variant]="variant()" (pressed)="dispatch()">
      @if (child(); as c) {
        <a2ui-v09-component-host [componentKey]="c" [surfaceId]="surfaceId()" />
      }
    </ui-button>
  `,
})
export class ButtonAdapterComponent extends CatalogAdapter<typeof ButtonApi> {
  protected readonly variant = this.prop<UiButtonVariant>('variant', 'default');
  protected readonly child = computed(() => this.props().child?.value());
}
