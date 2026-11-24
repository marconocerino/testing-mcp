import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { UiEmptyStateComponent } from '@app/ui';
import { CatalogAdapter } from './adapter';
import { EmptyStateApi } from './schemas';

/** The A2UI `EmptyState` type: what is empty, and at most one next step. */
@Component({
  selector: 'app-catalog-empty-state',
  imports: [UiEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ui-empty-state [title]="title()" [text]="text()" [actionLabel]="actionLabel()" (action)="dispatch()" />`,
})
export class EmptyStateAdapterComponent extends CatalogAdapter<typeof EmptyStateApi> {
  protected readonly title = this.prop<string>('title', '');
  protected readonly text = this.prop<string | undefined>('text', undefined);
  private readonly label = this.prop<string | undefined>('actionLabel', undefined);
  private readonly hasAction = computed(() => this.props()['action' as never] !== undefined);
  /** The button only shows when the spec gives both a label and an action. */
  protected readonly actionLabel = computed(() => (this.hasAction() ? this.label() : undefined));
}
