# types/

Pure type definitions. **No runtime code.**

## Rules

- Branded IDs live here (`TenantId`, `UserId`, `ClinicId`) — see `ids.ts`.
- Shared cross-domain types only. Component-local types stay co-located with the component.
- No imports from app code. Zod is fine (for `z.infer` types if needed, but prefer importing from `schemas/`).
