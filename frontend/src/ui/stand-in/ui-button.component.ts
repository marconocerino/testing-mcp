import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';

/** Visual weight of a `ui-button`. Same names as the A2UI basic `Button.variant`. */
export type UiButtonVariant = 'default' | 'primary' | 'borderless';

/**
 * Stand-in for the internal library's Button (`FttButton`). Part of the `@app/ui` contract:
 * selector `ui-button`, inputs `variant` and `disabled`, output `pressed`, label as content.
 */
@Component({
  selector: 'ui-button',
  imports: [MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" [matButton]="appearance()" [disabled]="disabled()" (click)="pressed.emit()">
      <ng-content />
    </button>
  `,
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>('default');
  readonly disabled = input(false);
  readonly pressed = output<void>();

  protected readonly appearance = computed(() => APPEARANCE[this.variant()]);
}

const APPEARANCE = { default: 'outlined', primary: 'filled', borderless: 'text' } as const;
