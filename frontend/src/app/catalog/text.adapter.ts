import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CatalogComponent } from '@a2ui/angular';
import { TextApi } from '@a2ui/web_core/v1_0';

/** The A2UI `Text` type. Plain text only, no markdown or HTML rendering. */
@Component({
  selector: 'app-catalog-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ui-text" [class.ui-text--caption]="variant() === 'caption'">{{ text() }}</span>`,
})
export class TextAdapterComponent extends CatalogComponent<typeof TextApi> {
  protected readonly text = computed(() => String(this.props().text?.value() ?? ''));
  protected readonly variant = computed(() => this.props().variant?.value() ?? 'body');
}
