import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { UiAlertComponent, UiCardComponent, UiKeyValueListComponent, UiStackComponent, UiTextComponent } from '@app/ui';
import { CatalogAdapter } from './adapter';
import { formatValue } from './format';
import { OrderTicketApi } from './schemas';

/**
 * The A2UI `OrderTicket` type. Locked (rule 4): a spec can only pre-fill it. It has no children
 * and emits no actions; nothing here can place an order.
 *
 * PLACEHOLDER until E4-S4: shows the pre-filled values only. E4-S4 replaces the body with the
 * enter, preview and confirm flow against the orders service, keeping this type and its props.
 */
@Component({
  selector: 'app-catalog-order-ticket',
  imports: [UiCardComponent, UiStackComponent, UiTextComponent, UiKeyValueListComponent, UiAlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-card>
      <ui-stack>
        <ui-text variant="heading">New order</ui-text>
        <ui-key-value-list [items]="prefill()" />
        <ui-alert tone="info">Order entry is not available yet. Nothing can be placed from here.</ui-alert>
      </ui-stack>
    </ui-card>
  `,
})
export class OrderTicketAdapterComponent extends CatalogAdapter<typeof OrderTicketApi> {
  private readonly instrument = this.prop<string | undefined>('instrument', undefined);
  private readonly side = this.prop<string | undefined>('side', undefined);
  private readonly quantity = this.prop<number | undefined>('quantity', undefined);
  private readonly orderType = this.prop<string | undefined>('orderType', undefined);

  protected readonly prefill = computed(() => [
    { label: 'Instrument', value: formatValue(this.instrument(), 'text') },
    { label: 'Side', value: capitalize(this.side()) },
    { label: 'Quantity', value: formatValue(this.quantity(), 'number') },
    { label: 'Order type', value: capitalize(this.orderType()) },
  ]);
}

function capitalize(value: string | undefined): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '—';
}
