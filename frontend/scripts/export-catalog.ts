/**
 * Writes the catalog export (E1-S4): `npm run catalog:export`.
 * Bundled with esbuild and run in Node, so it can only import Angular-free modules.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { exportCatalog } from '../src/app/catalog/catalog-export';

const outDir = resolve(process.cwd(), 'src/app/catalog/generated');
const catalog = exportCatalog();

const write = (file: string, content: string) => {
  const path = resolve(outDir, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`wrote ${path}`);
};

write('catalog.json', JSON.stringify(catalog, null, 2) + '\n');
write('catalog.prompt.md', catalog.modelDescription);
