import { AngularCatalog } from '@a2ui/angular';
import { ButtonApi, CardApi, ColumnApi, DividerApi, RowApi } from '@a2ui/web_core/v1_0';
import { AlertAdapterComponent } from './alert.adapter';
import { BadgeAdapterComponent } from './badge.adapter';
import { ButtonAdapterComponent } from './button.adapter';
import { CardAdapterComponent } from './card.adapter';
import { DateFieldAdapterComponent } from './date-field.adapter';
import { DividerAdapterComponent } from './divider.adapter';
import { EmptyStateAdapterComponent } from './empty-state.adapter';
import { KeyValueListAdapterComponent } from './key-value-list.adapter';
import { OrderTicketAdapterComponent } from './order-ticket.adapter';
import {
  AlertApi,
  BadgeApi,
  DateFieldApi,
  EmptyStateApi,
  KeyValueListApi,
  OrderTicketApi,
  SelectApi,
  StatApi,
  TableApi,
  TextApi,
} from './schemas';
import { SelectAdapterComponent } from './select.adapter';
import { ColumnAdapterComponent, RowAdapterComponent } from './stack.adapters';
import { StatAdapterComponent } from './stat.adapter';
import { TableAdapterComponent } from './table.adapter';
import { TextAdapterComponent } from './text.adapter';

export const CATALOG_ID = 'urn:trading-app:catalog:v1';

/**
 * The v1 catalog (docs/catalog-v1.md). Only these types exist. Anything else in a spec fails
 * validation in the MessageProcessor (architecture rule 1).
 */
export function createCatalog(): AngularCatalog {
  return new AngularCatalog(CATALOG_ID, 'v0.9', [
    // Layout
    { ...ColumnApi, component: ColumnAdapterComponent },
    { ...RowApi, component: RowAdapterComponent },
    { ...CardApi, component: CardAdapterComponent },
    { ...DividerApi, component: DividerAdapterComponent },
    // Content
    { ...TextApi, component: TextAdapterComponent },
    { ...StatApi, component: StatAdapterComponent },
    { ...KeyValueListApi, component: KeyValueListAdapterComponent },
    { ...TableApi, component: TableAdapterComponent },
    { ...BadgeApi, component: BadgeAdapterComponent },
    { ...AlertApi, component: AlertAdapterComponent },
    { ...EmptyStateApi, component: EmptyStateAdapterComponent },
    // Inputs
    { ...ButtonApi, component: ButtonAdapterComponent },
    { ...SelectApi, component: SelectAdapterComponent },
    { ...DateFieldApi, component: DateFieldAdapterComponent },
    // Trading
    { ...OrderTicketApi, component: OrderTicketAdapterComponent },
  ]);
}

/**
 * Strict validation, written out because @a2ui/web_core 0.14 does not export
 * STRICT_VALIDATION. Unknown component types, dangling child ids, orphans and a
 * missing root throw when the spec is processed. Without this, an unknown type
 * is only logged at render time.
 */
export const STRICT_SPEC_VALIDATION = {
  allowUnknownElements: false,
  allowDanglingReferences: false,
  allowOrphanComponents: false,
  allowMissingRoot: false,
} as const;

/** Renderer config shared by the app and tests. */
export function a2uiConfig() {
  return {
    catalogs: [createCatalog()],
    processorOptions: { validationConfig: STRICT_SPEC_VALIDATION },
  };
}
