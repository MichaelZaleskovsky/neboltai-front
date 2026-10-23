import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'about' },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./pages/catalog/catalog-page').then((m) => m.CatalogPage),
  },
  {
    path: 'catalog/:id',
    loadComponent: () =>
      import('./pages/product/product-page').then((m) => m.ProductPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin-page').then((m) => m.AdminPage),
  },
  {
    path: 'demo',
    loadComponent: () => import('./pages/demo/demo-page').then((m) => m.DemoPage),
  },
  {
    path: 'authors',
    loadComponent: () =>
      import('./pages/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
    data: { title: 'Authors' },
  },
  {
    path: 'exhibitions',
    loadComponent: () =>
      import('./pages/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
    data: { title: 'Exhibitions' },
  },
  {
    path: 'publications',
    loadComponent: () =>
      import('./pages/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
    data: { title: 'Publications' },
  },
  {
    path: 'contacts',
    loadComponent: () =>
      import('./pages/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
    data: { title: 'Contacts' },
  },
  { path: '**', redirectTo: 'about' },
];
