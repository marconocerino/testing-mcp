import { Routes } from '@angular/router';
import { DEV_ROUTES } from './dev/dev.routes';
import { BuildViewPage } from './screens/build-view.page';
import { ScreenPage } from './screens/screen.page';
import type { ScreenSpec } from './screens/screen-spec';
import accounts from './screens/specs/accounts.json';
import dashboard from './screens/specs/dashboard.json';
import orders from './screens/specs/orders.json';

/** The hand-authored default views (E4), in tab order. */
export const SCREENS: readonly ScreenSpec[] = [dashboard, accounts, orders] as ScreenSpec[];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  ...SCREENS.map((spec) => ({ path: spec.id, component: ScreenPage, title: `${spec.title} · Trading`, data: { spec } })),
  { path: 'build', component: BuildViewPage, title: 'Build a view · Trading' },
  ...DEV_ROUTES,
  { path: '**', redirectTo: 'dashboard' },
];
