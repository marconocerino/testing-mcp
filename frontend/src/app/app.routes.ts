import { Routes } from '@angular/router';
import { DEV_ROUTES } from './dev/dev.routes';
import { HomePage } from './home/home.page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Trading app' },
  ...DEV_ROUTES,
  { path: '**', redirectTo: '' },
];
