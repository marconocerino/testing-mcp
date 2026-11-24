import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatDivider } from '@angular/material/divider';

/** Stand-in for the internal library's Divider. */
@Component({
  selector: 'ui-divider',
  imports: [MatDivider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<mat-divider [vertical]="vertical()" />`,
})
export class UiDividerComponent {
  readonly vertical = input(false);
}
