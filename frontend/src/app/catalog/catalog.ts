import { Type } from '@angular/core';
import { AngularCatalog } from '@a2ui/angular';
import { AlertAdapterComponent } from './alert.adapter';
import { BadgeAdapterComponent } from './badge.adapter';
import { ButtonAdapterComponent } from './button.adapter';
import { CardAdapterComponent } from './card.adapter';
import { CATALOG_ENTRIES, CATALOG_ID, CATALOG_PROTOCOL_VERSION } from './catalog-definition';
import { CatalogV1Type } from './catalog-v1';
import { DateFieldAdapterComponent } from './date-field.adapter';
import { DividerAdapterComponent } from './divider.adapter';
import { EmptyStateAdapterComponent } from './empty-state.adapter';
import { KeyValueListAdapterComponent } from './key-value-list.adapter';
import { OrderTicketAdapterComponent } from './order-ticket.adapter';
import { SelectAdapterComponent } from './select.adapter';
import { ColumnAdapterComponent, RowAdapterComponent } from './stack.adapters';
import { StatAdapterComponent } from './stat.adapter';
import { TableAdapterComponent } from './table.adapter';
import { TextAdapterComponent } from './text.adapter';

export { CATALOG_ID, CATALOG_SCHEMA_VERSION } from './catalog-definition';

/** The adapter of each catalog type. The compiler fails if a type has none. */
const ADAPTERS: Record<CatalogV1Type, Type<unknown>> = {
  Column: ColumnAdapterComponent,
  Row: RowAdapterComponent,
  Card: CardAdapterComponent,
  Divider: DividerAdapterComponent,
  Text: TextAdapterComponent,
  Stat: StatAdapterComponent,
  KeyValueList: KeyValueListAdapterComponent,
  Table: TableAdapterComponent,
  Badge: BadgeAdapterComponent,
  Alert: AlertAdapterComponent,
  EmptyState: EmptyStateAdapterComponent,
  Button: ButtonAdapterComponent,
  Select: SelectAdapterComponent,
  DateField: DateFieldAdapterComponent,
  OrderTicket: OrderTicketAdapterComponent,
};

/**
 * The v1 catalog (docs/catalog-v1.md), built from the catalog schema in
 * `catalog-definition.ts`. Only these types exist. Anything else in a spec fails validation
 * in the MessageProcessor (architecture rule 1).
 */
export function createCatalog(): AngularCatalog {
  return new AngularCatalog(
    CATALOG_ID,
    CATALOG_PROTOCOL_VERSION,
    CATALOG_ENTRIES.map((e) => ({ name: e.name, schema: e.schema, component: ADAPTERS[e.name] })) as never,
  );
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
