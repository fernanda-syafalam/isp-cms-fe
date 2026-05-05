# routes/

File-based routes for TanStack Router. The plugin generates `routeTree.gen.ts` automatically — do not edit that file.

## Conventions

- `__root.tsx` — root layout with providers context.
- `index.tsx` — `/` route.
- `_auth.tsx` — pathless layout (e.g., auth guard wrapper).
- `_auth.tenants.index.tsx` — `/tenants` rendered inside `_auth` layout.
- `tenants.$tenantId.tsx` — `/tenants/:tenantId`.

## Rules

- Routes are the **only** layer allowed to import from `features/`.
- Keep route components thin — delegate UI to feature components.
- Loaders/actions for data prefetch live here; the actual fetch logic stays in `api/` + `hooks/`.

See CLAUDE.md › Architecture Rules.
