import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The catalog export (frontend `npm run catalog:export`), as the agent uses it. */
export interface Catalog {
  catalogId: string;
  schemaVersion: string;
  protocolVersion: string;
  /** JSON Schema of each component type, keyed by type name. */
  components: Record<string, { group: string; schema: object }>;
  /** The catalog written for the model. */
  modelDescription: string;
}

export function loadCatalog(dir: string): Catalog {
  const catalog = JSON.parse(readFileSync(join(dir, 'catalog.json'), 'utf8')) as Catalog;
  if (!catalog.catalogId || !catalog.components || !catalog.modelDescription) {
    throw new Error(`${dir}/catalog.json is not a catalog export`);
  }
  return catalog;
}
