import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { UiStatComponent } from '@app/ui';
import { CatalogAdapter } from './adapter';
import { formatValue, trendOf, type ValueFormat } from './format';
import { StatApi } from './schemas';

/** The A2UI `Stat` type: one headline figure, with an optional signed change. */
@Component({
  selector: 'app-catalog-stat',
  imports: [UiStatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-stat [label]="label()" [value]="value()" [change]="change()" [changeLabel]="changeLabel()" [caption]="caption()" [trend]="trend()" />
  `,
})
export class StatAdapterComponent extends CatalogAdapter<typeof StatApi> {
  private readonly format = this.prop<ValueFormat>('format', 'number');
  private readonly currency = this.prop<string>('currency', 'USD');
  private readonly rawValue = this.prop<unknown>('value', null);
  private readonly rawChange = this.prop<number | undefined>('change', undefined);

  protected readonly label = this.prop<string>('label', '');
  protected readonly changeLabel = this.prop<string | undefined>('changeLabel', undefined);
  protected readonly caption = this.prop<string | undefined>('caption', undefined);
  protected readonly value = computed(() => formatValue(this.rawValue(), this.format(), this.currency()));
  protected readonly change = computed(() =>
    this.rawChange() === undefined ? undefined : formatValue(this.rawChange(), this.format(), this.currency(), true),
  );
  protected readonly trend = computed(() => trendOf(this.rawChange()));
}
