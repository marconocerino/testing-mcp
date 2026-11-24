import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiTextVariant = 'title' | 'heading' | 'body' | 'caption';

/**
 * Stand-in for the internal library's Title and Microcopy. Titles and headings render as real
 * heading elements so screen readers can navigate them. Text arrives as content.
 */
@Component({
  selector: 'ui-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (variant()) {
      @case ('title') { <h2 class="ui-text ui-type-headline"><ng-container *ngTemplateOutlet="content" /></h2> }
      @case ('heading') { <h3 class="ui-text ui-type-title"><ng-container *ngTemplateOutlet="content" /></h3> }
      @case ('caption') { <p class="ui-text ui-type-small"><ng-container *ngTemplateOutlet="content" /></p> }
      @default { <p class="ui-text ui-type-body"><ng-container *ngTemplateOutlet="content" /></p> }
    }
    <ng-template #content><ng-content /></ng-template>
  `,
  imports: [NgTemplateOutlet],
})
export class UiTextComponent {
  readonly variant = input<UiTextVariant>('body');
}
