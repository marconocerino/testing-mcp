import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Stand-in for the internal library's Loading Indicator, as a content skeleton. Announced to
 * screen readers through its label; the shapes are decorative.
 */
@Component({
  selector: 'ui-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', '[attr.aria-label]': 'label()', 'aria-busy': 'true', class: 'ui-skeleton' },
  template: `
    <div class="ui-skeleton__line ui-skeleton__line--title" aria-hidden="true"></div>
    @for (line of lineList; track $index) {
      <div class="ui-skeleton__block" aria-hidden="true"></div>
    }
  `,
})
export class UiSkeletonComponent {
  readonly label = input('Loading');
  protected readonly lineList = [0, 1, 2];
}
