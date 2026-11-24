import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface UiKeyValueItem {
  label: string;
  value: string;
}

/** Stand-in for the internal library's Description List. Values arrive already formatted. */
@Component({
  selector: 'ui-key-value-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="ui-key-value-list">
      @for (item of items(); track $index) {
        <div class="ui-key-value-list__row">
          <dt class="ui-type-body">{{ item.label }}</dt>
          <dd class="ui-type-body">{{ item.value }}</dd>
        </div>
      }
    </dl>
  `,
})
export class UiKeyValueListComponent {
  readonly items = input.required<readonly UiKeyValueItem[]>();
}
