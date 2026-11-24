import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type UiAlertTone = 'info' | 'warning' | 'danger';

/**
 * Stand-in for the internal library's Inline Message (`kind="message"`) and Footnotes and
 * Disclosures (`kind="disclosure"`). Material has neither, so this is plain markup on the
 * Material theme tokens. Danger messages are announced immediately (`role="alert"`).
 */
@Component({
  selector: 'ui-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="'ui-alert ui-alert--' + kind() + ' ui-tone--' + tone()" [attr.role]="role()">
      @if (title()) {
        <p class="ui-type-title-small ui-alert__title">{{ title() }}</p>
      }
      <p [class]="kind() === 'disclosure' ? 'ui-type-small' : 'ui-type-body'"><ng-content /></p>
    </div>
  `,
})
export class UiAlertComponent {
  readonly tone = input<UiAlertTone>('info');
  readonly title = input<string>();
  readonly kind = input<'message' | 'disclosure'>('message');

  protected readonly role = computed(() => (this.kind() === 'disclosure' ? 'note' : this.tone() === 'danger' ? 'alert' : 'status'));
}
