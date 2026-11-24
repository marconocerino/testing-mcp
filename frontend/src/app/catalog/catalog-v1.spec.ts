import { CATALOG_V1_TYPES } from './catalog-v1';
import { createCatalog } from './catalog';

describe('E1-S1: v1 component list', () => {
  it('has 10 to 15 unique types', () => {
    expect(new Set(CATALOG_V1_TYPES).size).toBe(CATALOG_V1_TYPES.length);
    expect(CATALOG_V1_TYPES.length).toBeGreaterThanOrEqual(10);
    expect(CATALOG_V1_TYPES.length).toBeLessThanOrEqual(15);
  });

  it('the catalog registers only types from the v1 list', () => {
    const registered = [...createCatalog().components.keys()];
    const allowed: readonly string[] = CATALOG_V1_TYPES;
    expect(registered.filter((type) => !allowed.includes(type))).toEqual([]);
  });
});

