import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { UiAlertComponent, type UiAlertTone } from '@app/ui';
import { DISCLAIMERS, type DisclaimerId } from '../compliance/disclaimers';
import { CatalogAdapter } from './adapter';
import { AlertApi } from './schemas';

/**
 * The A2UI `Alert` type. With `disclaimerId`, the text comes from the central disclaimer store
 * (rendered as a disclosure) and any spec `text` is ignored, so approved wording can't be changed.
 */
@Component({
  selector: 'app-catalog-alert',
  imports: [UiAlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-alert [tone]="tone()" [title]="title()" [kind]="disclaimer() ? 'disclosure' : 'message'">{{ body() }}</ui-alert>`,
})
export class AlertAdapterComponent extends CatalogAdapter<typeof AlertApi> {
  protected readonly tone = this.prop<UiAlertTone>('tone', 'info');
  protected readonly title = this.prop<string | undefined>('title', undefined);
  protected readonly disclaimer = this.prop<DisclaimerId | undefined>('disclaimerId', undefined);
  private readonly text = this.prop<string>('text', '');
  protected readonly body = computed(() => {
    const id = this.disclaimer();
    return id ? DISCLAIMERS[id] : this.text();
  });
}
