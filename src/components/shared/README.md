# components/shared/

Composite components used across multiple features (e.g., `DataTable`, `PageHeader`, `EmptyState`).

## Rules

- Allowed to import from `components/ui/`, `hooks/`, `lib/`.
- Not allowed to depend on a single `features/<domain>/`. If it does, move it into that feature.
- Keep prop surface small — use slot/composition pattern.
