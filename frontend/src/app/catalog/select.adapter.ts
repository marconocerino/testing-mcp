import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiSelectComponent, type UiSelectOption } from '@app/ui';
import { CatalogAdapter } from './adapter';
import { SelectApi } from './schemas';

/** The A2UI `Select` type. A choice is written to the bound path, then `action` is emitted. */
@Component({
  selector: 'app-catalog-select',
  imports: [UiSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-select [label]="label()" [options]="options()" [value]="value()" (valueChange)="change($event)" />`,
})
export class SelectAdapterComponent extends CatalogAdapter<typeof SelectApi> {
  protected readonly label = this.prop<string>('label', '');
  protected readonly options = this.prop<UiSelectOption[]>('options', []);
  protected readonly value = this.prop<string | null>('value', null);

  protected change(value: string): void {
    this.write('value', value);
    this.dispatch('action');
  }
}
