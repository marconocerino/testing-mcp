import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Headline figure. The internal library has no Stat, so this is composed from Label, Title and
 * Microcopy. Values arrive already formatted. A change is shown as coloured text (up green, down
 * red) followed by its label, for example "+$412.30 today"; a caption is a small muted line.
 */
@Component({
  selector: 'ui-stat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-stat">
      <span class="ui-stat__label">{{ label() }}</span>
      <span class="ui-stat__value">{{ value() }}</span>
      @if (change()) {
        <span class="ui-stat__change" [class]="'ui-stat__change ui-trend--' + trend()">
          {{ change() }}@if (changeLabel()) {<span> {{ changeLabel() }}</span>}
        </span>
      }
      @if (caption()) {
        <span class="ui-stat__caption">{{ caption() }}</span>
      }
    </div>
  `,
})
export class UiStatComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly change = input<string>();
  readonly changeLabel = input<string>();
  readonly caption = input<string>();
  readonly trend = input<'up' | 'down' | 'flat'>('flat');
}
