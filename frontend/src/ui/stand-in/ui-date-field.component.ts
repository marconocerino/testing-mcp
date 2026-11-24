import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

/**
 * Stand-in for the internal library's Date Select. The contract uses ISO dates (YYYY-MM-DD)
 * in and out; conversion to the library's date type stays inside this wrapper.
 */
@Component({
  selector: 'ui-date-field',
  imports: [MatFormField, MatLabel, MatSuffix, MatInput, MatDatepicker, MatDatepickerInput, MatDatepickerToggle],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="ui-field">
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        [matDatepicker]="picker"
        [value]="date()"
        [min]="minDate()"
        [max]="maxDate()"
        (dateChange)="onDate($event.value)"
      />
      <mat-datepicker-toggle matIconSuffix [for]="picker" />
      <mat-datepicker #picker />
    </mat-form-field>
  `,
})
export class UiDateFieldComponent {
  readonly label = input.required<string>();
  readonly value = input<string | null>(null);
  readonly min = input<string>();
  readonly max = input<string>();
  readonly valueChange = output<string>();

  protected readonly date = computed(() => fromIso(this.value()));
  protected readonly minDate = computed(() => fromIso(this.min()));
  protected readonly maxDate = computed(() => fromIso(this.max()));

  protected onDate(date: Date | null): void {
    if (date) this.valueChange.emit(toIso(date));
  }
}

function fromIso(iso: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

function toIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
