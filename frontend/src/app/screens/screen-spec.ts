import { CATALOG_ID } from '../catalog/catalog';
import type { A2uiMessage } from '../transport/agent-transport';

/**
 * A hand-authored default view (E4): a versioned JSON file in `specs/`. The layout only; every
 * figure is a binding to the data model (rule 5). Rendered through the same session and
 * validation as generated views. The description doubles as the example text for the agent
 * (E4-S6).
 */
export interface ScreenSpec {
  /** Also the A2UI surface id. */
  id: string;
  /** Bump on every change to the layout. */
  version: number;
  title: string;
  /** What the view shows and when to use it. */
  description: string;
  /** Flat A2UI component list; one has the id `root`. */
  components: object[];
  /**
   * Components swapped for an EmptyState when the list at `path` is empty (E4-S2), for example
   * the accounts table when there are no accounts.
   */
  emptyStates?: { path: string; replace: string; with: Record<string, unknown> }[];
  /** Allow-listed action run once after the view loads (for example to select a first item). */
  onLoad?: string;
}

/** The A2UI messages for a screen, with empty states applied for the given data. */
export function screenMessages(spec: ScreenSpec, data: Record<string, unknown>): A2uiMessage[] {
  let components = spec.components as { id: string }[];
  for (const empty of spec.emptyStates ?? []) {
    const value = readPath(data, empty.path);
    if (Array.isArray(value) && value.length === 0) {
      components = components.map((c) => (c.id === empty.replace ? { ...empty.with, id: c.id } : c));
    }
  }
  return [
    { version: 'v0.9', createSurface: { surfaceId: spec.id, catalogId: CATALOG_ID } },
    { version: 'v0.9', updateComponents: { surfaceId: spec.id, components: reachable(components) } },
  ];
}

/** Drops components no longer reachable from `root` (after an empty state replaced a branch). */
function reachable(components: { id: string }[]): { id: string }[] {
  const byId = new Map(components.map((c) => [c.id, c as Record<string, unknown>]));
  const keep = new Set<string>();
  const visit = (id: string) => {
    const c = byId.get(id);
    if (!c || keep.has(id)) return;
    keep.add(id);
    if (typeof c['child'] === 'string') visit(c['child']);
    if (Array.isArray(c['children'])) (c['children'] as unknown[]).forEach((x) => typeof x === 'string' && visit(x));
  };
  visit('root');
  return components.filter((c) => keep.has(c.id));
}

/** Reads a JSON-pointer-like path ("/a/b") from plain data. */
export function readPath(data: unknown, path: string): unknown {
  return path
    .split('/')
    .filter(Boolean)
    .reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), data);
}
