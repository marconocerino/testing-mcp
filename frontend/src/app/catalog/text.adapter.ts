import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextApi } from '@a2ui/web_core/v1_0';
import { CatalogAdapter } from './adapter';

/** The A2UI `Text` type. Plain text only, no markdown or HTML rendering. */
@Component({
  selector: 'app-catalog-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ui-text" [class.ui-text--caption]="variant() === 'caption'">{{ text() }}</span>`,
})
export class TextAdapterComponent extends CatalogAdapter<typeof TextApi> {
  protected readonly text = this.prop<string>('text', '');
  protected readonly variant = this.prop<'body' | 'caption'>('variant', 'body');
}
