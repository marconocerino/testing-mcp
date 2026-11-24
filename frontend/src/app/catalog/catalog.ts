import { AngularCatalog } from '@a2ui/angular';
import { CardApi, TextApi } from '@a2ui/web_core/v1_0';
import { CardAdapterComponent } from './card.adapter';
import { TextAdapterComponent } from './text.adapter';

export const CATALOG_ID = 'urn:trading-app:catalog:v1';

/**
 * Only these types exist in the catalog. Anything else in a spec fails
 * validation in the MessageProcessor (architecture rule 1).
 */
export function createCatalog(): AngularCatalog {
  return new AngularCatalog(CATALOG_ID, 'v0.9', [
    { ...CardApi, component: CardAdapterComponent },
    { ...TextApi, component: TextAdapterComponent },
  ]);
}

/**
 * Strict validation, written out because @a2ui/web_core 0.14 does not export
 * STRICT_VALIDATION. Unknown component types, dangling child ids, orphans and a
 * missing root throw when the spec is processed. Without this, an unknown type
 * is only logged at render time.
 */
export const STRICT_SPEC_VALIDATION = {
  allowUnknownElements: false,
  allowDanglingReferences: false,
  allowOrphanComponents: false,
  allowMissingRoot: false,
} as const;

/** Renderer config shared by the app and tests. */
export function a2uiConfig() {
  return {
    catalogs: [createCatalog()],
    processorOptions: { validationConfig: STRICT_SPEC_VALIDATION },
  };
}
