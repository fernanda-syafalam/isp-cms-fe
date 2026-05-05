# api/

Pure async functions that talk to the backend. **No React here.**

## Rules

- Every response is parsed with the matching Zod schema from `schemas/`.
- One file per resource (`tenants.ts`, `users.ts`).
- `client.ts` exposes the shared HTTP client (auth header, base URL, error normalization).
- Errors thrown from this layer should be `AppError` (see `lib/errors.ts`).
- Components never call these directly — go through `hooks/` (TanStack Query).
