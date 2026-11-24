import { CATALOG_ID } from '../catalog/catalog';

export const SURFACE_ID = 'main-surface';

/**
 * Hand-written A2UI spec (protocol v0.9). Layout only: the visible text comes
 * from a data binding (`/account/displayName`), not from the spec (rule 5).
 */
export const ACCOUNT_CARD_SPEC = [
  { version: 'v0.9', createSurface: { surfaceId: SURFACE_ID, catalogId: CATALOG_ID } },
  {
    version: 'v0.9',
    updateComponents: {
      surfaceId: SURFACE_ID,
      components: [
        { id: 'root', component: 'Card', child: 'account-name' },
        { id: 'account-name', component: 'Text', text: { path: '/account/displayName' } },
      ],
    },
  },
] as const;

/** Mock data only (rule 6). In the real app this arrives from domain services, not the agent. */
export const MOCK_DATA = [
  {
    version: 'v0.9',
    updateDataModel: { surfaceId: SURFACE_ID, path: '/account/displayName', value: 'Mock Brokerage Account' },
  },
] as const;
