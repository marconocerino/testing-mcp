import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatChip } from '@angular/material/chips';

export type UiTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Stand-in for the internal library's Tag. A static label, not interactive. */
@Component({
  selector: 'ui-badge',
  imports: [MatChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<mat-chip class="ui-badge" [class]="'ui-tone--' + tone()" [disableRipple]="true"><ng-content /></mat-chip>`,
})
export class UiBadgeComponent {
  readonly tone = input<UiTone>('neutral');
}
