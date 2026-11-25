/** One A2UI v0.9 component in a flat list. */
export interface A2uiComponent {
  id: string;
  component: string;
  [prop: string]: unknown;
}

/** One A2UI v0.9 server-to-client message. */
export type A2uiMessage =
  | { version: 'v0.9'; createSurface: { surfaceId: string; catalogId: string } }
  | { version: 'v0.9'; updateComponents: { surfaceId: string; components: A2uiComponent[] } };

/** The messages that put a list of components on a surface, replacing what was there. */
export function viewMessages(surfaceId: string, catalogId: string, components: A2uiComponent[]): A2uiMessage[] {
  return [
    { version: 'v0.9', createSurface: { surfaceId, catalogId } },
    { version: 'v0.9', updateComponents: { surfaceId, components } },
  ];
}
