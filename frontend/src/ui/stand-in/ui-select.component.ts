import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';

export interface UiSelectOption {
  value: string;
  label: string;
}

/** Stand-in for the internal library's Dropdown. The label is wired to the field for screen readers. */
@Component({
  selector: 'ui-select',
  imports: [MatFormField, MatLabel, MatSelect, MatOption],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="ui-field">
      <mat-label>{{ label() }}</mat-label>
      <mat-select [value]="value()" (selectionChange)="valueChange.emit($event.value)">
        @for (option of options(); track option.value) {
          <mat-option [value]="option.value">{{ option.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class UiSelectComponent {
  readonly label = input.required<string>();
  readonly options = input.required<readonly UiSelectOption[]>();
  readonly value = input<string | null>(null);
  readonly valueChange = output<string>();
}
