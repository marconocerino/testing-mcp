import { ChangeDetectionStrategy, Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

/**
 * Stand-in for the internal library's textarea with a send button (Form + Text area + Button).
 * Enter sends, Shift+Enter adds a line. Emits the trimmed text and clears the field.
 */
@Component({
  selector: 'ui-prompt-input',
  imports: [MatFormField, MatLabel, MatHint, MatInput, MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="ui-prompt-input" (submit)="$event.preventDefault(); send()">
      <mat-form-field appearance="outline" class="ui-field">
        <mat-label>{{ label() }}</mat-label>
        <textarea
          #field
          matInput
          rows="2"
          [value]="text()"
          [disabled]="disabled()"
          (input)="text.set($any($event.target).value)"
          (keydown.enter)="onEnter($any($event))"
        ></textarea>
        @if (hint()) {
          <mat-hint>{{ hint() }}</mat-hint>
        }
      </mat-form-field>
      <button matButton="filled" type="submit" [disabled]="disabled() || !text().trim()">{{ sendLabel() }}</button>
    </form>
  `,
})
export class UiPromptInputComponent {
  readonly label = input('Message');
  readonly hint = input<string>();
  readonly sendLabel = input('Send');
  readonly disabled = input(false);
  readonly submitted = output<string>();

  protected readonly text = signal('');
  private readonly field = viewChild.required<ElementRef<HTMLTextAreaElement>>('field');

  protected onEnter(event: KeyboardEvent): void {
    if (event.shiftKey) return;
    event.preventDefault();
    this.send();
  }

  protected send(): void {
    const value = this.text().trim();
    if (!value || this.disabled()) return;
    this.submitted.emit(value);
    this.text.set('');
    // Also clear the element: the binding may not have seen the typed text yet.
    this.field().nativeElement.value = '';
  }
}
