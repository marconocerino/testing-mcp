import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { UiKeyValueListComponent } from '@app/ui';
import { CatalogAdapter } from './adapter';
import { formatValue, type ValueFormat } from './format';
import { KeyValueListApi } from './schemas';

interface Item {
  label?: string;
  value?: unknown;
  format?: ValueFormat;
}

/** The A2UI `KeyValueList` type: 1 to 8 labelled values, such as an order summary. */
@Component({
  selector: 'app-catalog-key-value-list',
  imports: [UiKeyValueListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-key-value-list [items]="items()" />`,
})
export class KeyValueListAdapterComponent extends CatalogAdapter<typeof KeyValueListApi> {
  private readonly rawItems = this.prop<Item[]>('items', []);
  private readonly currency = this.prop<string>('currency', 'USD');

  protected readonly items = computed(() =>
    this.rawItems().map((item) => ({
      label: item.label ?? '',
      value: formatValue(item.value, item.format ?? 'text', this.currency()),
    })),
  );
}
