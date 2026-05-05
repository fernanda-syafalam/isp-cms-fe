# features/tenants/

Domain bundle for the **tenants** feature. Created when a domain has 3+ files.

## Layout

```
tenants/
├── components/      # tenant-scoped UI
├── hooks/           # tenant-scoped hooks
└── index.ts         # public API barrel — only place a barrel is allowed
```

## Rules

- Only this `index.ts` exports the feature's public surface. Internal files import each other directly, not via the barrel.
- Imports from `features/` are allowed only from `routes/`.
- No cross-feature imports (e.g., `features/tenants` must not import from `features/billing`). Promote shared code to `components/shared/`, `hooks/`, or `lib/`.
