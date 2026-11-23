import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

/**
 * Stand-in for the internal library's card. Part of the `@app/ui` contract:
 * the selector and content slot stay the same when the real library replaces
 * the Angular Material implementation.
 */
@Component({
  selector: 'ui-card',
  imports: [MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card appearance="outlined">
      <mat-card-content><ng-content /></mat-card-content>
    </mat-card>
  `,
})
export class UiCardComponent {}
