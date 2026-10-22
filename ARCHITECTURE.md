# Architecture Reference for neboltai

Adapted from the `machine-learning-ui` micro-frontend. This describes an architecture
you can adopt in **neboltai**. IDS component libraries are intentionally excluded — use
your own component library for the UI layer.

> **neboltai today:** Angular 20.2 standalone app **with SSR** (`@angular/ssr` + Express),
> OpenSeadragon for image viewing. No state library, GraphQL, i18n, or module federation yet.
> Everything below is an architecture to *adopt*; adoption notes call out where SSR changes things.

---

## 1. Shape of the application

The reference app is a **micro-frontend remote**: a standalone Angular app that runs on
its own in dev and is also loaded at runtime by a parent **shell** via Module Federation.

Decide neboltai's role before adopting:
- **Standalone app** (most likely for now) — skip Module Federation entirely (Section 4 optional).
- **Remote** — exposed to and loaded by a shell.
- **Shell** — hosts other remotes.

---

## 2. Core stack (reference versions)

| Concern            | Choice                                             | Version              |
|--------------------|----------------------------------------------------|----------------------|
| Framework          | Angular (standalone, signals)                      | 20.3                 |
| State management   | NGXS + Emitter + Router + Logger plugins           | @ngxs/store 20.1     |
| API (GraphQL)      | Apollo Angular + Apollo Client                     | 11.0 / 3.14          |
| API (REST)         | Angular HttpClient                                 | built-in             |
| GraphQL tooling    | GraphQL Code Generator                             | —                    |
| i18n               | Transloco                                          | 7.6                  |
| Micro-frontend     | @angular-architects/module-federation              | 20.0                 |
| Reactive           | RxJS                                               | 7.8                  |
| Language           | TypeScript                                         | 5.9                  |

neboltai is already on Angular 20.2 / RxJS 7.8 / TS 5.9, so the framework baseline matches.

---

## 3. Architectural layers

```
+-----------------------------------------------+
| (optional) Shell app -- loads remotes at run  |
+-----------------------+-----------------------+
                        | Module Federation (optional)
                +-------+--------+
                |  neboltai app  |
                +-------+--------+
   +------------+-------+--------+--------------+
   | Components | State (NGXS)   | Data access  |
   | standalone |  + Emitters    | Apollo GQL + |
   | signals    |                | HttpClient   |
   | OnPush     |                |              |
   +------------+----------------+--------------+
                        |
       i18n (Transloco), routing (standalone routes), SSR
```

**Feature-first folders.** Each feature is self-contained with its components, state, and
GraphQL documents:

```
src/app/
  applications/<feature>/      # feature domain: components + state + graphql
  <another-feature>/
  transloco/                   # i18n setup
  app.component.*
  app.routes.ts
  app.constants.ts
```

---

## 4. Module Federation (optional micro-frontend seam)

Configured in `webpack.config.js`. A remote **exposes** routes/components; **shared**
dependencies (Angular core, RxJS, state libs) are singletons so shell and remotes share
one runtime copy — this is where version alignment is enforced.

**SSR caveat:** neboltai uses `@angular/ssr` with the application builder. Module Federation
with `@angular-architects/module-federation` is Webpack-based and does not drop cleanly into
the esbuild/SSR setup. If you need MF here, either keep neboltai standalone, or move to the
native-federation approach (`@angular-architects/native-federation`) which supports the modern
builder. **Recommendation: skip MF unless neboltai must be hosted by a shell.**

---

## 5. State management -- NGXS + Emitter

NGXS `@State` classes hold feature state. `@ngxs-labs/emitter` replaces verbose action
classes with emitter methods, cutting boilerplate. Plugins: Router (binds router state),
Logger (dev action logging), Emitter.

Install:
```
npm i @ngxs/store @ngxs/router-plugin @ngxs/logger-plugin @ngxs-labs/emitter
```

Wire it (standalone, in `app.config.ts`):
```ts
import { provideStore } from '@ngxs/store';
import { withNgxsRouterPlugin } from '@ngxs/router-plugin';
import { withNgxsLoggerPlugin } from '@ngxs/logger-plugin';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStore(
      [/* FeatureState, ... */],
      withNgxsRouterPlugin(),
      withNgxsLoggerPlugin({ disabled: environment.production }),
    ),
  ],
};
```

**SSR caveat:** keep state serializable and avoid browser-only APIs in state init so
server rendering stays clean.

---

## 6. Data access -- GraphQL first, REST where needed

**GraphQL (primary)** via Apollo Angular with a schema-driven codegen workflow:
1. Keep the backend schema at `.../graphql/<domain>.schema.graphql`.
2. Register `.graphql` document paths in `<domain>.codegen.yml`.
3. Write `*.queries.graphql` / `*.mutations.graphql` per module.
4. Run codegen to generate typed query/mutation services.

**REST** uses `HttpClient` for whatever GraphQL does not cover.

Install:
```
npm i apollo-angular @apollo/client graphql
npm i -D @graphql-codegen/cli
```

**SSR caveat:** register Apollo with `provideHttpClient(withFetch())` and use Apollo's
SSR state transfer so queries resolved on the server hydrate on the client without refetch.

---

## 7. Internationalization -- Transloco

All user-facing text goes through Transloco keys — no hardcoded strings. Translations are
JSON catalogs under assets, feature-scoped; scoped library translations are extracted at
startup.

Install:
```
npm i @jsverse/transloco
```
Key format: `FEATURE.SECTION.ACTION` or `COMMON.ACTION`. Template usage:
`{{ 'FEATURE.TITLE' | transloco }}`.

---

## 8. UI component conventions (library-agnostic)

Carry these over regardless of component library:
- **Standalone components** (no NgModules)
- **ChangeDetectionStrategy.OnPush** everywhere
- **Signal APIs**: `input()` / `input.required()`, `output()`, `computed()`,
  `toSignal()` / `toObservable()` for RxJS interop
- **`inject()`** over constructor injection
- **Block control flow** (`@if`, `@for`, `@switch`) over structural directives
- **BEM** CSS naming (e.g. `card__title`, `card__title--active`)

The reference app's UI library (IDS) is **excluded** here. Transferable optional pieces:
a general component library of your choice, and Monaco Editor if you need in-browser code
editing. neboltai already uses OpenSeadragon for image viewing — keep it.

---

## 9. Build & tooling

- **Build**: Angular application builder (neboltai already uses `@angular/build` + SSR).
  The reference app uses Webpack only because of Module Federation.
- **Code quality**: ESLint, Prettier, Husky, Lint-staged (pre-commit reformats + lints
  staged files). neboltai already has Prettier configured in package.json.
- **GraphQL**: GraphQL Code Generator (add if adopting Section 6).

Suggested dev-quality setup:
```
npm i -D eslint @angular-eslint/schematics husky lint-staged
```

---

## 10. Minimal adoption recipe for neboltai

1. Keep Angular 20 standalone + signals; set OnPush as the default for all components.
2. Organize code feature-first under `src/app/applications/<feature>/`.
3. Add NGXS + emitter + router + logger plugins; one `@State` per feature (Section 5).
4. Add Apollo Angular + GraphQL Code Generator; wire HttpClient for REST gaps; use Apollo
   SSR transfer (Section 6).
5. Add Transloco; move all strings to keys (Section 7).
6. Pick your own component library (not IDS); keep OpenSeadragon.
7. Add ESLint + Husky + Lint-staged alongside the existing Prettier config.
8. Only add Module Federation if neboltai must be hosted by a shell — and prefer
   native-federation given the SSR builder (Section 4).

---

*Derived from the machine-learning-ui README and verified package versions. IDS libraries
(ids-enterprise-wc, ids-enterprise-ng) deliberately omitted.*