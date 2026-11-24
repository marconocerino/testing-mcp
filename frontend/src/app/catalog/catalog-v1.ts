/**
 * The v1 component types agreed in E1-S1 (docs/catalog-v1.md).
 * The catalog may register only these. E1-S3 adds adapters until every one is registered.
 * Model-facing descriptions and prop schemas live in the catalog schema (E1-S4), not here.
 */
export const CATALOG_V1_TYPES = [
  'Column',
  'Row',
  'Card',
  'Text',
  'Divider',
  'Stat',
  'KeyValueList',
  'Table',
  'Badge',
  'Alert',
  'EmptyState',
  'Button',
  'Select',
  'DateField',
  'OrderTicket',
] as const;

export type CatalogV1Type = (typeof CATALOG_V1_TYPES)[number];
