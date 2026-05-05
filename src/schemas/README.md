# schemas/

Zod schemas — the single source of truth for shapes that cross a boundary (API, forms, URL params).

## Rules

- Type, validation, and parser all derive from one schema (`z.infer<typeof X>`).
- One file per domain. No `index.ts` re-exports.
- Schemas may import from `types/` (branded IDs) and Zod only.
- Never import React.
