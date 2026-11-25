import { Routes } from '@angular/router';

/**
 * Dev-only routes (E1-S5). Production builds swap this file for `dev.routes.prod.ts`
 * (`fileReplacements` in angular.json), so the gallery and its samples are not shipped.
 */
export const DEV_ROUTES: Routes = [
  {
    path: 'dev/catalog',
    title: 'Catalog gallery',
    loadComponent: () => import('./catalog-gallery/catalog-gallery.page').then((m) => m.CatalogGalleryPage),
  },
];
