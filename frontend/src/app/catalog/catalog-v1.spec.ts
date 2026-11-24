import { CATALOG_V1_TYPES } from './catalog-v1';
import { createCatalog } from './catalog';

describe('E1-S1: v1 component list', () => {
  it('has 10 to 15 unique types', () => {
    expect(new Set(CATALOG_V1_TYPES).size).toBe(CATALOG_V1_TYPES.length);
    expect(CATALOG_V1_TYPES.length).toBeGreaterThanOrEqual(10);
    expect(CATALOG_V1_TYPES.length).toBeLessThanOrEqual(15);
  });

  it('E1-S3: the catalog registers exactly the v1 list, each under its A2UI type name', () => {
    expect([...createCatalog().components.keys()].sort()).toEqual([...CATALOG_V1_TYPES].sort());
  });
});

