import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiTextComponent, type UiTextVariant } from '@app/ui';
import { CatalogAdapter } from './adapter';
import { TextApi } from './schemas';

/** The A2UI `Text` type. Plain text only: no markdown or HTML is ever rendered. */
@Component({
  selector: 'app-catalog-text',
  imports: [UiTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-text [variant]="variant()">{{ text() }}</ui-text>`,
})
export class TextAdapterComponent extends CatalogAdapter<typeof TextApi> {
  protected readonly text = this.prop<string>('text', '');
  protected readonly variant = this.prop<UiTextVariant>('variant', 'body');
}
