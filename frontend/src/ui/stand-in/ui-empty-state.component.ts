import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButtonComponent } from './ui-button.component';

/** Stand-in for the internal library's Message used as an empty state, with one next step. */
@Component({
  selector: 'ui-empty-state',
  imports: [UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-empty-state" role="status">
      <p class="ui-type-title">{{ title() }}</p>
      @if (text()) {
        <p class="ui-type-body">{{ text() }}</p>
      }
      @if (actionLabel()) {
        <ui-button variant="primary" (pressed)="action.emit()">{{ actionLabel() }}</ui-button>
      }
    </div>
  `,
})
export class UiEmptyStateComponent {
  readonly title = input.required<string>();
  readonly text = input<string>();
  readonly actionLabel = input<string>();
  readonly action = output<void>();
}
