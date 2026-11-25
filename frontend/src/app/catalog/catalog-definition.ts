import { z } from 'zod';
import { CardApi, ColumnApi, DividerApi, RowApi } from '@a2ui/web_core/v1_0';
import { CatalogV1Type } from './catalog-v1';
import {
  AlertApi,
  BadgeApi,
  ButtonApi,
  DateFieldApi,
  EmptyStateApi,
  KeyValueListApi,
  OrderTicketApi,
  SelectApi,
  StatApi,
  TableApi,
  TextApi,
} from './schemas';

/**
 * The catalog schema (E1-S4): the single source for the renderer's validator (`catalog.ts`),
 * the JSON Schema export and the model-facing description (`catalog-export.ts`).
 *
 * No Angular imports here, so the export script can load this file in Node.
 *
 * Versioning is semver. Patch: wording of descriptions. Minor: backward-compatible additions
 * (an optional prop, a new component, a new enum value). Major: anything that can make an
 * existing spec invalid or change its meaning. The major version is part of {@link CATALOG_ID},
 * so specs and saved layouts built against another major version fail at render time.
 */
export const CATALOG_SCHEMA_VERSION = '1.0.0';

export const CATALOG_MAJOR_VERSION = Number(CATALOG_SCHEMA_VERSION.split('.')[0]);

export const CATALOG_ID = `urn:trading-app:catalog:v${CATALOG_MAJOR_VERSION}`;

/** A2UI protocol version the catalog is written for. */
export const CATALOG_PROTOCOL_VERSION = 'v0.9';

export type CatalogGroup = 'Layout' | 'Content' | 'Inputs' | 'Trading';

export interface CatalogEntry {
  /** A2UI type name, the `component` value in a spec. */
  readonly name: CatalogV1Type;
  readonly group: CatalogGroup;
  /** One line for the model: when to use the component (docs/catalog-v1.md). */
  readonly purpose: string;
  /** Props schema. Strict: undeclared props are rejected. */
  readonly schema: z.ZodTypeAny;
}

const entry = (api: { name: string; schema: z.ZodTypeAny }, group: CatalogGroup, purpose: string): CatalogEntry => ({
  name: api.name as CatalogV1Type,
  group,
  purpose,
  schema: api.schema,
});

/** Every catalog type, in catalog order. Nothing else may appear in a spec (rule 1). */
export const CATALOG_ENTRIES: readonly CatalogEntry[] = [
  entry(ColumnApi, 'Layout', 'Use Column to stack components vertically; it is the usual root of a view.'),
  entry(RowApi, 'Layout', 'Use Row to place 2-4 components side by side, such as stat tiles or buttons.'),
  entry(CardApi, 'Layout', 'Use Card to group one section of a view under a single surface; put a Column inside for several children.'),
  entry(TextApi, 'Content', 'Use Text for headings, labels and short plain-text sentences; never for numbers that come from data, use Stat or KeyValueList.'),
  entry(DividerApi, 'Layout', 'Use Divider to separate groups inside a Card.'),
  entry(StatApi, 'Content', 'Use Stat for one headline figure with a label and optional change, such as total balance or cash.'),
  entry(KeyValueListApi, 'Content', 'Use KeyValueList for 2-8 labelled values, such as an order summary or spending by category.'),
  entry(TableApi, 'Content', 'Use Table for lists of 5+ comparable items with the same fields, such as accounts, transactions or orders.'),
  entry(BadgeApi, 'Content', 'Use Badge for a short status label, such as an order status or "Paper trading".'),
  entry(AlertApi, 'Content', 'Use Alert for a message the user must notice: a warning, an error or a required disclaimer.'),
  entry(EmptyStateApi, 'Content', 'Use EmptyState when a section has no data yet, with a short explanation and one next step.'),
  entry(ButtonApi, 'Inputs', 'Use Button for an action the user starts, such as "View all" or "New order"; it never places a trade.'),
  entry(SelectApi, 'Inputs', 'Use Select to pick one value from a short fixed list, such as an account or transaction type.'),
  entry(DateFieldApi, 'Inputs', 'Use DateField to pick a date, for example the start or end of a transaction filter.'),
  entry(OrderTicketApi, 'Trading', 'Use OrderTicket to start an order; you may pre-fill instrument, side, quantity and type, nothing else.'),
];

/**
 * Rules for every spec, in words the model reads. They state what validation enforces; they
 * don't replace it.
 */
export const SPEC_RULES: readonly string[] = [
  `Start every surface with createSurface and catalogId "${CATALOG_ID}". Specs for another catalog id are rejected.`,
  'Use only the components listed below, with only the props listed. Anything else is rejected.',
  'Components are a flat list. Exactly one has the id "root"; every other component is referenced as a child exactly once, by id.',
  'Never write balances, prices, quantities held or transactions into a spec. Bind them to the data model with {"path": "/..."}. Props marked "binding only" reject literal values.',
  'Text is plain text: no HTML, markdown, links or images.',
  'You design views; you never place, change or cancel orders. OrderTicket only takes pre-fill values.',
];
