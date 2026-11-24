import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiDateFieldComponent } from '@app/ui';
import { CatalogAdapter } from './adapter';
import { DateFieldApi } from './schemas';

/** The A2UI `DateField` type. A picked date (YYYY-MM-DD) is written to the bound path, then `action` is emitted. */
@Component({
  selector: 'app-catalog-date-field',
  imports: [UiDateFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-date-field [label]="label()" [value]="value()" [min]="min()" [max]="max()" (valueChange)="change($event)" />`,
})
export class DateFieldAdapterComponent extends CatalogAdapter<typeof DateFieldApi> {
  protected readonly label = this.prop<string>('label', '');
  protected readonly value = this.prop<string | null>('value', null);
  protected readonly min = this.prop<string | undefined>('min', undefined);
  protected readonly max = this.prop<string | undefined>('max', undefined);

  protected change(value: string): void {
    this.write('value', value);
    this.dispatch('action');
  }
}
