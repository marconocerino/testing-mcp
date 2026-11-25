import { Injectable, Provider } from '@angular/core';
import { A2uiRendererService } from '@a2ui/angular';
import { CATALOG_ID, CATALOG_SCHEMA_VERSION } from './catalog-definition';

/** A spec was written for a catalog (or catalog version) this app does not render. */
export class CatalogVersionError extends Error {
  constructor(surfaceId: string, catalogId: unknown) {
    super(
      `Surface '${surfaceId}' asks for catalog ${catalogId === undefined ? '(none)' : `'${String(catalogId)}'`}, ` +
        `but this app renders '${CATALOG_ID}' (schema ${CATALOG_SCHEMA_VERSION}). Regenerate the spec for this catalog.`,
    );
    this.name = 'CatalogVersionError';
  }
}

/**
 * Throws {@link CatalogVersionError} unless every `createSurface` names this catalog's id,
 * which carries the schema's major version (E1-S4). A2UI alone would reject an unknown id but
 * silently use the default catalog when the id is missing.
 */
export function assertCatalogVersion(messages: unknown): void {
  for (const message of toList(messages)) {
    const create = (message as { createSurface?: { surfaceId?: unknown; catalogId?: unknown } } | null)?.createSurface;
    if (create && create.catalogId !== CATALOG_ID) {
      throw new CatalogVersionError(String(create.surfaceId), create.catalogId);
    }
  }
}

function toList(messages: unknown): unknown[] {
  if (Array.isArray(messages)) return messages;
  const wrapped = (messages as { messages?: unknown } | null)?.messages;
  return Array.isArray(wrapped) ? wrapped : [messages];
}

/**
 * The renderer with the catalog version check in front of A2UI's own validation, so every
 * spec is checked at render time, whoever sends it. Provide it with {@link provideCatalogRenderer}.
 */
@Injectable()
export class CatalogRendererService extends A2uiRendererService {
  override processMessages(messages: unknown): void {
    assertCatalogVersion(messages);
    super.processMessages(messages);
  }

  override processMessagesAsync(messages: unknown): Promise<void> {
    try {
      assertCatalogVersion(messages);
    } catch (e) {
      return Promise.reject(e);
    }
    return super.processMessagesAsync(messages);
  }
}

/** Provides {@link CatalogRendererService} wherever `A2uiRendererService` is injected. */
export function provideCatalogRenderer(): Provider {
  return { provide: A2uiRendererService, useClass: CatalogRendererService };
}
