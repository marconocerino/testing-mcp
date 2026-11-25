import { CATALOG_ID } from '../../catalog/catalog';
import alert from './samples/alert.json';
import badge from './samples/badge.json';
import button from './samples/button.json';
import card from './samples/card.json';
import column from './samples/column.json';
import dateField from './samples/date-field.json';
import divider from './samples/divider.json';
import emptyState from './samples/empty-state.json';
import keyValueList from './samples/key-value-list.json';
import orderTicket from './samples/order-ticket.json';
import row from './samples/row.json';
import select from './samples/select.json';
import stat from './samples/stat.json';
import table from './samples/table.json';
import text from './samples/text.json';

/**
 * Sample A2UI specs for the catalog gallery (E1-S5), one JSON file per catalog type in
 * `./samples/`. Edit a file and reload `/dev/catalog` to see the change.
 *
 * - `default`: the common case.
 * - `edge`: optional props, missing or extreme data, odd content.
 * - `invalid`: a spec the catalog must reject; the gallery shows the validation error.
 */
export type SampleKind = 'default' | 'edge' | 'invalid';

export interface CatalogSample {
  /** Short title shown above the sample. */
  name: string;
  kind: SampleKind;
  /** What the sample shows or why it is rejected. */
  note?: string;
  /** The A2UI v0.9 components. One of them must have the id `root`. */
  components: object[];
  /** Mock data model values, by JSON pointer path (rule 6: mock data only). */
  data?: Record<string, unknown>;
}

export interface CatalogSampleFile {
  /** The catalog type these samples show. */
  component: string;
  samples: CatalogSample[];
}

/** Every sample file, in catalog order (docs/catalog-v1.md). */
export const SAMPLE_FILES: CatalogSampleFile[] = [
  column,
  row,
  card,
  text,
  divider,
  stat,
  keyValueList,
  table,
  badge,
  alert,
  emptyState,
  button,
  select,
  dateField,
  orderTicket,
] as CatalogSampleFile[];

/** Surface id of one sample. Stable, so reloading a page shows the same surfaces. */
export const sampleSurfaceId = (component: string, index: number) => `gallery-${component}-${index}`;

/** The A2UI messages that render a sample on its own surface. */
export function sampleMessages(surfaceId: string, sample: CatalogSample): object[] {
  return [
    { version: 'v0.9', createSurface: { surfaceId, catalogId: CATALOG_ID } },
    { version: 'v0.9', updateComponents: { surfaceId, components: sample.components } },
    ...Object.entries(sample.data ?? {}).map(([path, value]) => ({ version: 'v0.9', updateDataModel: { surfaceId, path, value } })),
  ];
}
