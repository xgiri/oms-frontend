# OMS Frontend

Angular admin UI for the Order Management System. Talks to the backend
through **oms-gateway**, which fronts two upstreams:

- **REST** (`environment.apiUrl`) → most feature pages: products, customers,
  inventory, order list/create, payments, shipments.
- **GraphQL** (`environment.graphqlUrl`) → the order-detail page, which goes
  gateway → **oms-bff** → **oms-main**, aggregating order + customer +
  payment + shipment into a single query. Other views are expected to move
  to GraphQL over time; see [GraphQL codegen](#graphql-codegen) below.

Built with Angular 22 (standalone components, signals, `@if`/`@for` control
flow), Angular Material, and RxJS.

## Prerequisites

- Node.js + npm (`packageManager` pins `npm@11.16.0`)
- The backend stack running and reachable at the URLs in
  `src/environments/environment.development.ts` (defaults to
  `http://localhost:8090`, i.e. oms-gateway) — see oms-main's
  `docker-compose.yml` / `DEV.md` for bringing that up.
- For [codegen](#graphql-codegen) specifically: a sibling checkout of
  `oms-bff` on disk (`../oms-bff` relative to this repo), since codegen reads
  its schema file directly rather than introspecting a running,
  authenticated endpoint.

## Development server

```bash
npm install
npm start
```

Then open `http://localhost:4200/`. The dev server proxies nothing —
`environment.development.ts` points straight at the gateway, so the backend
stack needs to already be up.

## Project structure

```
src/app/
  core/            Cross-cutting singletons: auth/role guards, HTTP
                    interceptors (auth + error), GlobalErrorHandler,
                    token storage.
  features/        One folder per domain area (auth, dashboard, products,
                    customers, inventory, orders, payments, shipments).
                    Routed via loadComponent(), no NgModules.
  shared/          Reusable pieces used across features: app-shell,
                    confirm/prompt dialogs, table-skeleton loading state,
                    the hasRole structural directive, snackbar service.
  shared/models/    api-types.ts — generated from oms-main's OpenAPI spec
                    (REST). Feature-local order.model.ts etc. re-export the
                    slices each feature actually needs.
```

Route-level access control: the top-level shell route requires
`authGuard`; individual routes can additionally use `roleGuard(...)`
(see `core/guards/role.guard.ts`) for role-gated pages, and the
`*hasRole` structural directive for role-gated UI within a page (e.g.
hiding an admin-only status override control).

Roles are `'ADMIN' | 'MANAGER' | 'STAFF'` (see `features/auth/auth.model.ts`).

## Error handling

Two layers, deliberately not overlapping:

- **`error.interceptor.ts`** — catches HTTP failures at the source and
  surfaces a specific, meaningful message (e.g. via the snackbar).
- **`GlobalErrorHandler`** (`core/global-error-handler.service.ts`) — the
  app-wide `ErrorHandler` override. Ignores `HttpErrorResponse`s (already
  handled above) and only reacts to everything else — e.g. an Observable
  subscribed without an error callback — so nothing is silently swallowed,
  without double-toasting HTTP failures.

## Regenerating REST types

With the backend running on `localhost:8090`, from this folder:

```bash
npm install -D openapi-typescript --legacy-peer-deps
npx openapi-typescript http://localhost:8090/v3/api-docs -o src/app/shared/models/api-types.ts
```

`--legacy-peer-deps` is scoped to this dev-only codegen install — it's not a
runtime dependency sharing the app's actual TypeScript compilation pipeline,
so pre-v7 npm peer-dependency behavior here is harmless.

## GraphQL codegen

One-time setup, since `graphql` needs to be a runtime dependency here (the
generated documents call `print()` in the browser, not just during codegen):

```bash
npm uninstall graphql --legacy-peer-deps
npm install graphql --legacy-peer-deps
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typed-document-node @graphql-typed-document-node/core --legacy-peer-deps
```

Then, whenever a `.graphql` document changes or `oms-bff`'s schema changes:

```bash
npm run codegen
```

`codegen.ts` currently scopes `documents` to
`src/app/features/orders/order-detail/**/*.graphql` — the only view on
GraphQL so far. Widen that glob as more views migrate. Schema-level types
(`*.types.generated.ts`) and operation types (`*.generated.ts`) are kept in
separate generated files per view; see the comments in `codegen.ts` for why
(works around a `typescript-operations@6` duplicate-identifier bug).

## Building

```bash
ng build
```

Production build output goes to `dist/`.

Before shipping a real deployment, update the TODO'd URLs in
`src/environments/environment.ts` (`apiUrl`, `graphqlUrl`) — they currently
default to the local gateway.

## Testing

Unit tests run on [Vitest](https://vitest.dev/):

```bash
ng test
```

No end-to-end testing framework is set up yet.

## Additional resources

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Angular Material](https://material.angular.dev/)
