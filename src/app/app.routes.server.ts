import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Data-driven pages fetch from the backend, which is only reachable from the
    // browser (via the dev proxy) — not from the Node SSR server. Render these
    // on the client to avoid server-side fetch attempts.
    path: 'catalog',
    renderMode: RenderMode.Client,
  },
  {
    path: 'catalog/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'admin',
    renderMode: RenderMode.Client,
  },
  {
    path: 'demo',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
