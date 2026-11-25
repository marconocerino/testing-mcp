import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';

/** Visual weight of a `ui-button`. Same names as the A2UI basic `Button.variant`. */
export type UiButtonVariant = 'default' | 'primary' | 'borderless';

/**
 * Stand-in for the internal library's Button (`FttButton`). Part of the `@app/ui` contract:
 * selector `ui-button`, inputs `variant`, `disabled`, `type`, and the accessibility inputs
 * `ariaLabel`, `ariaExpanded`, `ariaControls`; output `pressed`; label as content.
 */
@Component({
  selector: 'ui-button',
  imports: [MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [matButton]="appearance()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-expanded]="ariaExpanded() ?? null"
      [attr.aria-controls]="ariaControls() ?? null"
      (click)="pressed.emit()"
    >
      <ng-content />
    </button>
  `,
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>('default');
  readonly disabled = input(false);
  /** `submit` inside a form, so Enter in a field submits it. */
  readonly type = input<'button' | 'submit'>('button');
  readonly ariaLabel = input<string>();
  readonly ariaExpanded = input<boolean>();
  readonly ariaControls = input<string>();
  readonly pressed = output<void>();

  protected readonly appearance = computed(() => APPEARANCE[this.variant()]);
}

const APPEARANCE = { default: 'outlined', primary: 'filled', borderless: 'text' } as const;
