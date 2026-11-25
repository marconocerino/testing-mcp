import { TestBed } from '@angular/core/testing';
import { A2uiRendererService, provideA2Ui } from '@a2ui/angular';
import Ajv from 'ajv';
import { SAMPLE_FILES } from '../dev/catalog-gallery/samples';
import { a2uiConfig, createCatalog } from './catalog';
import { CATALOG_ENTRIES, CATALOG_ID, CATALOG_MAJOR_VERSION, CATALOG_SCHEMA_VERSION } from './catalog-definition';
import { exportCatalog, JsonSchema, modelDescription, propsJsonSchema } from './catalog-export';
import { assertCatalogVersion, CatalogVersionError, provideCatalogRenderer } from './catalog-renderer.service';
import { CATALOG_V1_TYPES } from './catalog-v1';
import generatedCatalog from './generated/catalog.json';
import generatedPrompt from './generated/catalog.prompt.md' with { loader: 'text' };
import { formatSpecError } from './spec-errors';

const exported = exportCatalog();
const ajv = new Ajv({ allErrors: true, strict: false });
const jsonValidators = new Map(Object.entries(exported.components).map(([name, c]) => [name, ajv.compile(c.schema)]));

/** Validates one component object against the exported JSON Schema, as a server would. */
function jsonValid(component: Record<string, unknown>): boolean {
  const validate = jsonValidators.get(String(component['component']));
  return validate ? (validate(component) as boolean) : false;
}

/** Validates one component object with the catalog's zod schema, as the renderer does. */
function zodValid(component: Record<string, unknown>): boolean {
  const entry = CATALOG_ENTRIES.find((e) => e.name === component['component']);
  if (!entry) return false;
  const { id: _id, component: _component, ...props } = component;
  return entry.schema.safeParse(props).success;
}

/** Every prop schema of a component, nested ones included, with its path. */
function allProps(schema: JsonSchema, path = ''): [string, JsonSchema][] {
  const properties = (schema['properties'] ?? {}) as Record<string, JsonSchema>;
  return Object.entries(properties).flatMap(([name, prop]) => {
    const items = prop['items'] as JsonSchema | undefined;
    const nested = items?.['type'] === 'object' ? allProps(items, `${path}${name}[].`) : [];
    return [[`${path}${name}`, prop] as [string, JsonSchema], ...nested];
  });
}

const surface = (catalogId?: string) => ({ version: 'v0.9', createSurface: { surfaceId: 's', ...(catalogId === undefined ? {} : { catalogId }) } });

describe('E1-S4: one schema source for the validator and the model description', () => {
  it('the catalog lists every v1 type once, in order', () => {
    expect(CATALOG_ENTRIES.map((e) => e.name)).toEqual([...CATALOG_V1_TYPES].sort((a, b) => order(a) - order(b)));
    expect(new Set(CATALOG_ENTRIES.map((e) => e.name)).size).toBe(CATALOG_V1_TYPES.length);
  });

  it('the renderer validates with exactly the schemas of the catalog definition', () => {
    const catalog = createCatalog();
    expect(catalog.id).toBe(CATALOG_ID);
    expect([...catalog.components.keys()]).toEqual(CATALOG_ENTRIES.map((e) => e.name));
    for (const entry of CATALOG_ENTRIES) {
      expect(catalog.components.get(entry.name)?.schema, entry.name).toBe(entry.schema);
    }
  });

  it('the model description names every component with its purpose and every prop', () => {
    const text = modelDescription();
    for (const entry of CATALOG_ENTRIES) {
      expect(text).toContain(`### ${entry.name}\n\n${entry.purpose}`);
      for (const [path] of allProps(propsJsonSchema(entry))) {
        expect(text, `${entry.name}.${path}`).toContain(`\`${path.split('.').pop()!.replace('[]', '')}\``);
      }
    }
  });

  it('the exported JSON Schema accepts and rejects exactly what the renderer validator does (gallery samples)', () => {
    let checked = 0;
    for (const file of SAMPLE_FILES) {
      for (const sample of file.samples) {
        for (const component of sample.components as Record<string, unknown>[]) {
          expect(jsonValid(component), `${file.component} / ${sample.name} / ${String(component['id'])}`).toBe(zodValid(component));
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(80);
  });

  it('the committed export is up to date (run `npm run catalog:export` after changing the catalog)', () => {
    expect(generatedCatalog).toEqual(JSON.parse(JSON.stringify(exported)));
    expect(generatedPrompt).toBe(exported.modelDescription);
  });
});

describe('E1-S4: every prop has a type and a description', () => {
  for (const entry of CATALOG_ENTRIES) {
    it(`${entry.name}`, () => {
      const props = allProps(propsJsonSchema(entry));
      expect(props.length).toBeGreaterThan(0);
      for (const [path, prop] of props) {
        expect(String(prop['description'] ?? '').length, `${entry.name}.${path} description`).toBeGreaterThan(3);
        const typed = ['type', 'enum', 'const', 'x-kind', 'anyOf', 'oneOf'].some((k) => k in prop);
        expect(typed, `${entry.name}.${path} type`).toBe(true);
      }
    });
  }

  it('props with a fixed set of choices are enums', () => {
    const enumProps = ['justify', 'align', 'axis', 'variant', 'format', 'tone', 'disclaimerId', 'side', 'orderType'];
    for (const entry of CATALOG_ENTRIES) {
      for (const [path, prop] of allProps(propsJsonSchema(entry))) {
        if (enumProps.includes(path.split('.').pop()!)) {
          expect(Array.isArray(prop['enum']), `${entry.name}.${path}`).toBe(true);
        }
      }
    }
  });

  it('the description says which props are binding only (rule 5)', () => {
    const text = modelDescription();
    expect(text).toContain('- `value` (binding only: {"path": "/..."}, required): The figure');
    expect(text).toContain('- `rows` (binding only: {"path": "/..."}, required)');
  });
});

describe('E1-S4: invalid specs fail with a readable error', () => {
  let renderer: A2uiRendererService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideA2Ui(a2uiConfig()), provideCatalogRenderer()] });
    renderer = TestBed.inject(A2uiRendererService);
  });

  const render = (components: object[]) => () =>
    renderer.processMessages([surface(CATALOG_ID), { version: 'v0.9', updateComponents: { surfaceId: 's', components } }]);
  const errorOf = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      return formatSpecError(e);
    }
    throw new Error('expected the spec to be rejected');
  };

  it('unknown component', () => {
    const spec = [{ id: 'root', component: 'Iframe', src: 'https://example.com' }];
    expect(errorOf(render(spec))).toMatch(/Iframe/);
    expect(jsonValid(spec[0])).toBe(false);
  });

  it('unknown prop', () => {
    const spec = { id: 'root', component: 'Text', text: 'hi', html: '<b>x</b>' };
    expect(errorOf(render([spec]))).toBe("Validation failed for component 'Text' (root)\nroot: Unrecognized key(s) in object: 'html'");
    expect(jsonValid(spec)).toBe(false);
  });

  it('wrong type', () => {
    const spec = { id: 'root', component: 'Table', rows: { path: '/orders' }, columns: [{ key: 'qty', header: 'Qty' }], pageSize: 'ten' };
    expect(errorOf(render([spec]))).toBe("Validation failed for component 'Table' (root)\npageSize: Expected number, received string");
    expect(jsonValid(spec)).toBe(false);
  });

  it('literal balance where a binding is required', () => {
    const spec = { id: 'root', component: 'Stat', label: 'Total', value: 48210.55 };
    expect(errorOf(render([spec]))).toBe("Validation failed for component 'Stat' (root)\nvalue: Expected object, received number");
    expect(jsonValid(spec)).toBe(false);
  });

  it('dates: the JSON Schema rejects the same impossible dates as the renderer', () => {
    for (const min of ['2026-02-31', '2026-13-01', '02/11/2026', '2025-02-29']) {
      const spec = { id: 'root', component: 'DateField', label: 'From', value: { path: '/from' }, min };
      expect(jsonValid(spec), min).toBe(false);
      expect(zodValid(spec), min).toBe(false);
    }
    const leap = { id: 'root', component: 'DateField', label: 'From', value: { path: '/from' }, min: '2028-02-29' };
    expect(jsonValid(leap)).toBe(true);
    expect(zodValid(leap)).toBe(true);
  });

  it('Button no longer accepts checks (the catalog has no functions)', () => {
    const spec = { id: 'root', component: 'Button', child: 'l', action: { event: { name: 'x' } }, checks: [] };
    expect(errorOf(render([spec, { id: 'l', component: 'Text', text: 'Go' }]))).toMatch(/checks/);
  });
});

describe('E1-S4: schema version', () => {
  it('is in the exported artifacts', () => {
    expect(exported.schemaVersion).toBe(CATALOG_SCHEMA_VERSION);
    expect(exported.catalogId).toBe(CATALOG_ID);
    expect(CATALOG_SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(exported.modelDescription).toContain(`schema ${CATALOG_SCHEMA_VERSION}`);
    expect(exported.modelDescription).toContain(`catalogId "${CATALOG_ID}"`);
  });

  it('the catalog id carries the major version', () => {
    expect(CATALOG_ID).toBe(`urn:trading-app:catalog:v${CATALOG_MAJOR_VERSION}`);
  });

  describe('is checked at render time', () => {
    let renderer: A2uiRendererService;
    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [provideA2Ui(a2uiConfig()), provideCatalogRenderer()] });
      renderer = TestBed.inject(A2uiRendererService);
    });

    it('renders specs for this catalog', () => {
      expect(() =>
        renderer.processMessages([surface(CATALOG_ID), { version: 'v0.9', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'ok' }] } }]),
      ).not.toThrow();
    });

    it('rejects a spec for another major version', () => {
      expect(() => renderer.processMessages([surface('urn:trading-app:catalog:v2')])).toThrow(CatalogVersionError);
      expect(() => renderer.processMessages([surface('urn:trading-app:catalog:v2')])).toThrow(/asks for catalog 'urn:trading-app:catalog:v2', but this app renders 'urn:trading-app:catalog:v1' \(schema 1\.\d+\.\d+\)/);
    });

    it('rejects a spec that names no catalog, which A2UI alone would accept', () => {
      expect(() => renderer.processMessages([surface()])).toThrow(/asks for catalog \(none\)/);
      expect(() => renderer.processMessages({ version: 'v0.9', createSurface: { surfaceId: 'x' } })).toThrow(CatalogVersionError);
    });

    it('checks async processing too', async () => {
      await expect(renderer.processMessagesAsync([surface('urn:other')])).rejects.toThrow(CatalogVersionError);
    });
  });

  it('assertCatalogVersion reads message lists, single messages and wrapped lists', () => {
    expect(() => assertCatalogVersion({ messages: [surface('bad')] })).toThrow(CatalogVersionError);
    expect(() => assertCatalogVersion(surface(CATALOG_ID))).not.toThrow();
    expect(() => assertCatalogVersion([{ version: 'v0.9', updateDataModel: { surfaceId: 's', path: '/a', value: 1 } }])).not.toThrow();
  });
});

describe('E1-S4: formatSpecError', () => {
  it('puts each distinct schema issue on its own line', () => {
    const err = new Error("Validation failed for component 'Stat' (root): value: Expected object, received number; value: Expected object, received number; label: Required");
    expect(formatSpecError(err)).toBe("Validation failed for component 'Stat' (root)\nvalue: Expected object, received number\nlabel: Required");
  });

  it('keeps other messages as they are', () => {
    expect(formatSpecError(new Error('Component "missing" not found'))).toBe('Component "missing" not found');
    expect(formatSpecError('boom')).toBe('boom');
  });
});

function order(name: string) {
  return CATALOG_ENTRIES.findIndex((e) => e.name === name);
}
