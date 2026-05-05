# features/auth/

Domain bundle for authentication. In-memory access token + HttpOnly refresh cookie pattern (CLAUDE.md security baseline).

## Layout

```
auth/
├── components/      # auth-scoped UI (LoginForm, UserMenu)
├── hooks/           # useLogin, useLogout, useCurrentUser, useIsAuthenticated
├── store/           # Zustand auth store — access token in memory only
└── index.ts         # public API barrel — only place a barrel is allowed
```

## Rules

- Only this `index.ts` exports the feature's public surface. Internal files import each other directly, not via the barrel.
- Imports from `features/` are allowed only from `routes/`.
- Access token never touches `localStorage` / `sessionStorage`. Refresh token is owned by the backend as an HttpOnly cookie.
- `api/client.ts` reads the token via `useAuthStore.getState()` and replays 401s through a single-flight refresh — do not duplicate that logic here.

## See also

- `src/api/client.ts` — Bearer injection + 401 single-flight refresh
- `src/api/auth.ts` — login / logout / refresh / me endpoints
- `src/routes/_auth.tsx` — protected layout that redirects unauthenticated users to `/login?from=...`
