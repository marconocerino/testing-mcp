import { Routes } from '@angular/router';
import { DEV_ROUTES } from './dev/dev.routes';
import { WorkspacePage } from './workspace/workspace.page';

export const routes: Routes = [
  { path: '', component: WorkspacePage, title: 'Trading app' },
  ...DEV_ROUTES,
  { path: '**', redirectTo: '' },
];
