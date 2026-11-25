import { Ajv, type ErrorObject, type ValidateFunction } from 'ajv';
import addFormatsModule from 'ajv-formats';
import type { A2uiComponent } from './a2ui.js';
import type { Catalog } from './catalog.js';

// ajv-formats is CommonJS; its default export arrives wrapped under NodeNext.
const addFormats = ((addFormatsModule as unknown as { default?: typeof addFormatsModule }).default ?? addFormatsModule) as unknown as (ajv: Ajv) => Ajv;

/** Action names a generated view may use. Must match the app's allow-list (app.config.ts). */
export const ALLOWED_ACTIONS = ['showAccount', 'openOrderTicket', 'filterTransactions'] as const;

export const MAX_COMPONENTS = 60;

export interface ValidationResult {
  ok: boolean;
  /** One readable line per problem; sent back to the model for repair. */
  errors: string[];
}

/**
 * Checks a generated view before it leaves the service (E5-S3): every component against its
 * catalog JSON Schema, plus the rules a schema can't express: one root, unique ids, every
 * child id exists, nothing unreachable, and only allow-listed action names.
 */
export function createValidator(catalog: Catalog): (components: unknown) => ValidationResult {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv); // the catalog uses "date" (DateField min/max)
  const validators = new Map<string, ValidateFunction>(
    Object.entries(catalog.components).map(([name, entry]) => [name, ajv.compile(stripSchemaUri(entry.schema))]),
  );

  return (input) => {
    const errors: string[] = [];
    if (!Array.isArray(input) || input.length === 0) return { ok: false, errors: ['"components" must be a non-empty list.'] };
    if (input.length > MAX_COMPONENTS) errors.push(`Too many components (${input.length}); use at most ${MAX_COMPONENTS}.`);

    const components = input as A2uiComponent[];
    const ids = new Map<string, A2uiComponent>();
    for (const [i, c] of components.entries()) {
      if (!c || typeof c !== 'object' || typeof c.id !== 'string' || typeof c.component !== 'string') {
        errors.push(`Item ${i} needs a string "id" and a string "component".`);
        continue;
      }
      if (ids.has(c.id)) errors.push(`Duplicate id '${c.id}'.`);
      ids.set(c.id, c);
      const validate = validators.get(c.component);
      if (!validate) {
        errors.push(`Unknown component type '${c.component}' (${c.id}). Use only catalog components.`);
        continue;
      }
      if (!validate(c)) errors.push(...describe(c, validate.errors ?? []));
      for (const name of actionNames(c)) {
        if (!(ALLOWED_ACTIONS as readonly string[]).includes(name)) {
          errors.push(`'${c.component}' (${c.id}) uses action '${name}', which is not allowed. Allowed: ${ALLOWED_ACTIONS.join(', ')}.`);
        }
      }
    }
    if (!ids.has('root')) errors.push("No component has the id 'root'.");

    const referenced = new Set<string>();
    for (const c of ids.values()) {
      for (const child of childIds(c)) {
        if (!ids.has(child)) errors.push(`'${c.component}' (${c.id}) refers to '${child}', which does not exist.`);
        if (referenced.has(child)) errors.push(`'${child}' is used as a child more than once.`);
        referenced.add(child);
      }
    }
    for (const id of ids.keys()) {
      if (id !== 'root' && !referenced.has(id)) errors.push(`'${id}' is not inside any other component, so it would never show.`);
    }
    return { ok: errors.length === 0, errors };
  };
}

function describe(c: A2uiComponent, issues: ErrorObject[]): string[] {
  const lines = new Set<string>();
  for (const e of issues) {
    const where = e.instancePath ? ` ${e.instancePath}` : '';
    const params = e.params as Record<string, unknown>;
    if (e.keyword === 'additionalProperties') lines.add(`'${c.component}' (${c.id}): unknown prop '${String(params['additionalProperty'])}'${where ? ` at${where}` : ''}.`);
    else if (e.keyword === 'required') lines.add(`'${c.component}' (${c.id}): missing required prop '${String(params['missingProperty'])}'${where ? ` at${where}` : ''}.`);
    else if (e.keyword === 'enum') lines.add(`'${c.component}' (${c.id})${where} must be one of ${(params['allowedValues'] as unknown[]).map((v) => JSON.stringify(v)).join(', ')}.`);
    else if (e.keyword === 'anyOf') lines.add(`'${c.component}' (${c.id})${where} has the wrong kind of value (for figures use {"path": "..."}).`);
  }
  // Fall back to ajv's first message when none of the readable cases matched.
  if (lines.size === 0 && issues[0]) lines.add(`'${c.component}' (${c.id})${issues[0].instancePath ? ` ${issues[0].instancePath}` : ''} ${issues[0].message ?? 'is invalid'}.`);
  return [...lines];
}

/** Ids this component renders as children. */
function childIds(c: A2uiComponent): string[] {
  const out: string[] = [];
  if (typeof c['child'] === 'string') out.push(c['child']);
  const children = c['children'];
  if (Array.isArray(children)) out.push(...children.filter((x): x is string => typeof x === 'string'));
  else if (children && typeof children === 'object' && typeof (children as { componentId?: unknown }).componentId === 'string') {
    out.push((children as { componentId: string }).componentId);
  }
  return out;
}

function actionNames(c: A2uiComponent): string[] {
  return ['action', 'rowAction']
    .map((k) => (c[k] as { event?: { name?: unknown } } | undefined)?.event?.name)
    .filter((n): n is string => typeof n === 'string');
}

/** ajv rejects unknown meta-schema URIs; the catalog uses draft-07, ajv's default. */
function stripSchemaUri(schema: object): object {
  const { $schema: _ignored, ...rest } = schema as Record<string, unknown>;
  return rest;
}
