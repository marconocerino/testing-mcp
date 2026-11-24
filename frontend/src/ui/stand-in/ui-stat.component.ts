import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiBadgeComponent, type UiTone } from './ui-badge.component';

/**
 * Headline figure. The internal library has no Stat, so this is composed from Label, Title and
 * Tag (here: typography classes and the stand-in badge). Values arrive already formatted.
 */
@Component({
  selector: 'ui-stat',
  imports: [UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-stat">
      <span class="ui-type-label ui-stat__label">{{ label() }}</span>
      <span class="ui-type-headline ui-stat__value">{{ value() }}</span>
      @if (change()) {
        <ui-badge [tone]="TREND_TONE[trend()]">{{ change() }}</ui-badge>
      }
    </div>
  `,
})
export class UiStatComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly change = input<string>();
  readonly trend = input<'up' | 'down' | 'flat'>('flat');

  protected readonly TREND_TONE: Record<'up' | 'down' | 'flat', UiTone> = { up: 'success', down: 'danger', flat: 'neutral' };
}
