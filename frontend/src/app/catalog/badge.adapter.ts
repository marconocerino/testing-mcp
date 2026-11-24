import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiBadgeComponent, type UiTone } from '@app/ui';
import { CatalogAdapter } from './adapter';
import { BadgeApi } from './schemas';

/** The A2UI `Badge` type: a short status label. */
@Component({
  selector: 'app-catalog-badge',
  imports: [UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-badge [tone]="tone()">{{ text() }}</ui-badge>`,
})
export class BadgeAdapterComponent extends CatalogAdapter<typeof BadgeApi> {
  protected readonly text = this.prop<string>('text', '');
  protected readonly tone = this.prop<UiTone>('tone', 'neutral');
}
