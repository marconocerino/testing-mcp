import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { DividerApi } from '@a2ui/web_core/v1_0';
import { UiDividerComponent } from '@app/ui';
import { CatalogAdapter } from './adapter';

/** The A2UI `Divider` type. */
@Component({
  selector: 'app-catalog-divider',
  imports: [UiDividerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-divider [vertical]="vertical()" />`,
})
export class DividerAdapterComponent extends CatalogAdapter<typeof DividerApi> {
  private readonly axis = this.prop<'horizontal' | 'vertical'>('axis', 'horizontal');
  protected readonly vertical = computed(() => this.axis() === 'vertical');
}
