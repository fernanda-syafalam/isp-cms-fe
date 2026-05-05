# hooks/

Cross-feature React hooks. A hook lives here if it is used in 2+ features OR is generic infrastructure (e.g., `useDebounce`, `useMediaQuery`).

If a hook is feature-scoped, put it under `features/<domain>/hooks/` instead.

## Rules

- May import `api/`, `schemas/`, `lib/`.
- May not import from `components/` or `features/`.
