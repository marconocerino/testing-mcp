import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  CATALOG_ENTRIES,
  CATALOG_ID,
  CATALOG_PROTOCOL_VERSION,
  CATALOG_SCHEMA_VERSION,
  CatalogEntry,
  CatalogGroup,
  SPEC_RULES,
} from './catalog-definition';

/**
 * Catalog export (E1-S4), generated from `catalog-definition.ts`. One JSON file with:
 * - a JSON Schema per component, for server-side validation and MCP tool definitions;
 * - the model-facing description, for the agent prompt (E5-S2).
 *
 * Written to `generated/catalog.json` and `generated/catalog.prompt.md` by
 * `npm run catalog:export`. A test fails when those files are out of date.
 */
export interface CatalogExport {
  catalogId: string;
  schemaVersion: string;
  protocolVersion: string;
  /** JSON Schema (draft-07) of one component object in `updateComponents`, by type name. */
  components: Record<string, ComponentExport>;
  /** Markdown the agent puts in its prompt. */
  modelDescription: string;
}

export interface ComponentExport {
  group: CatalogGroup;
  schema: JsonSchema;
}

export type JsonSchema = { [key: string]: unknown };

/**
 * zod's `.date()` check (zod 3.25 `dateRegexSource`): YYYY-MM-DD with real days, leap years
 * included, so the JSON Schema rejects exactly what the renderer rejects (2026-02-31 too).
 */
const ISO_DATE_PATTERN =
  '^((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))$';

/** A2UI marks shared definitions in descriptions as `REF:#/$defs/<Def>|<text>`. */
const REF_MARKER = /^REF:#\/\$defs\/([A-Za-z]+)\|?/;

/** Props schema of one entry as plain JSON Schema: shared definitions inlined, markers removed. */
export function propsJsonSchema(entry: CatalogEntry): JsonSchema {
  const schema = zodToJsonSchema(entry.schema as never, { $refStrategy: 'none', target: 'jsonSchema7' }) as JsonSchema;
  delete schema['$schema'];
  return clean(schema) as JsonSchema;
}

/** JSON Schema of a whole component object: `id`, `component` and the props. */
export function componentJsonSchema(entry: CatalogEntry): JsonSchema {
  const props = propsJsonSchema(entry);
  const properties = (props['properties'] ?? {}) as Record<string, JsonSchema>;
  const required = (props['required'] ?? []) as string[];
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: entry.name,
    description: entry.purpose,
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 1, description: 'Unique id of the component in the surface. The top component has the id "root".' },
      component: { const: entry.name, description: 'The component type.' },
      ...properties,
    },
    required: ['id', 'component', ...required],
    additionalProperties: false,
  };
}

export function exportCatalog(): CatalogExport {
  return {
    catalogId: CATALOG_ID,
    schemaVersion: CATALOG_SCHEMA_VERSION,
    protocolVersion: CATALOG_PROTOCOL_VERSION,
    components: Object.fromEntries(CATALOG_ENTRIES.map((e) => [e.name, { group: e.group, schema: componentJsonSchema(e) }])),
    modelDescription: modelDescription(),
  };
}

/** The catalog in words, for the model. Generated from the same schemas the validator uses. */
export function modelDescription(): string {
  const lines = [
    `# UI component catalog ${CATALOG_ID} (schema ${CATALOG_SCHEMA_VERSION}, A2UI ${CATALOG_PROTOCOL_VERSION})`,
    '',
    '## Rules',
    '',
    ...SPEC_RULES.map((r) => `- ${r}`),
    '- Every component also takes `id` (string, required) and `component` (its type name, required).',
  ];
  const groups: CatalogGroup[] = ['Layout', 'Content', 'Inputs', 'Trading'];
  for (const group of groups) {
    lines.push('', `## ${group}`);
    for (const entry of CATALOG_ENTRIES.filter((e) => e.group === group)) {
      lines.push('', `### ${entry.name}`, '', entry.purpose, '');
      lines.push(...describeProps(propsJsonSchema(entry), ''));
    }
  }
  return lines.join('\n') + '\n';
}

function describeProps(schema: JsonSchema, indent: string): string[] {
  const properties = (schema['properties'] ?? {}) as Record<string, JsonSchema>;
  const required = new Set((schema['required'] ?? []) as string[]);
  const lines: string[] = [];
  for (const [name, prop] of Object.entries(properties)) {
    const facts = [typeOf(prop), required.has(name) ? 'required' : 'optional'];
    if (prop['default'] !== undefined) facts.push(`default ${JSON.stringify(prop['default'])}`);
    lines.push(`${indent}- \`${name}\` (${facts.join(', ')}): ${String(prop['description'] ?? '')}`.trimEnd());
    const item = itemObject(prop);
    if (item) lines.push(...describeProps(item, indent + '  '));
  }
  return lines;
}

/** Object schema of a list's items, when the items are objects with their own props. */
function itemObject(prop: JsonSchema): JsonSchema | undefined {
  const items = prop['items'] as JsonSchema | undefined;
  return prop['type'] === 'array' && items?.['type'] === 'object' && items['properties'] ? items : undefined;
}

/** Short, model-readable type of a prop. */
export function typeOf(prop: JsonSchema): string {
  const kind = prop['x-kind'];
  if (typeof kind === 'string') return KIND_LABEL[kind] ?? kind;
  if (Array.isArray(prop['enum'])) return `one of ${(prop['enum'] as unknown[]).map((v) => JSON.stringify(v)).join(' | ')}`;
  if (prop['const'] !== undefined) return JSON.stringify(prop['const']);
  const type = prop['type'];
  if (type === 'array') {
    const limits = range(prop['minItems'], prop['maxItems']);
    const items = prop['items'] as JsonSchema | undefined;
    const of = items?.['type'] === 'object' ? 'objects' : items ? typeOf(items) : 'values';
    return `list of ${of}${limits ? `, ${limits} items` : ''}`;
  }
  if (type === 'integer' || type === 'number') {
    const limits = range(prop['minimum'] ?? (prop['exclusiveMinimum'] !== undefined ? `>${prop['exclusiveMinimum']}` : undefined), prop['maximum']);
    return `${type}${limits ? ` ${limits}` : ''}`;
  }
  if (type === 'string') {
    if (prop['format'] === 'date') return 'date string YYYY-MM-DD';
    if (typeof prop['pattern'] === 'string') return `string matching ${prop['pattern']}`;
    return 'string';
  }
  return typeof type === 'string' ? type : 'value';
}

const range = (min: unknown, max: unknown) =>
  min !== undefined && max !== undefined ? `${min} to ${max}` : min !== undefined ? `at least ${min}` : max !== undefined ? `at most ${max}` : '';

/**
 * Labels for A2UI's shared definitions. `DynamicValue` is only used by our binding-only props
 * (`bound()` in schemas.ts), whose schema has no literal branch.
 */
const KIND_LABEL: Record<string, string> = {
  DynamicString: 'text, or a binding {"path": "/..."}',
  DynamicValue: 'binding only: {"path": "/..."}',
  Action: 'action {"event": {"name": "...", "context": {...}}}',
  Child: 'component id',
  ChildList: 'list of component ids',
  ComponentId: 'component id',
};

/**
 * Removes A2UI's `REF:` markers from descriptions. A prop whose description carried a marker
 * gets `x-kind` with the definition's name, so the model description can name its type.
 * `x-` keywords are ignored by JSON Schema validators.
 */
function clean(node: unknown, isPropertyMap = false): unknown {
  if (Array.isArray(node)) return node.map((n) => clean(n));
  if (!node || typeof node !== 'object') return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (!isPropertyMap && key === 'description' && typeof value === 'string') {
      const match = REF_MARKER.exec(value);
      if (match) {
        out['x-kind'] = match[1];
        const text = value.slice(match[0].length);
        if (text) out['description'] = text;
        continue;
      }
    }
    out[key] = clean(value, key === 'properties' || key === 'definitions' || key === '$defs');
  }
  // `format` is only an annotation for most JSON Schema validators, so dates also get a pattern
  // that every validator enforces.
  if (!isPropertyMap && out['type'] === 'string' && out['format'] === 'date' && out['pattern'] === undefined) {
    out['pattern'] = ISO_DATE_PATTERN;
  }
  return out;
}
