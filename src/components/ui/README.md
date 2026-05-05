# components/ui/

Primitives — managed by [shadcn/ui](https://ui.shadcn.com). Add new components with:

```bash
pnpm dlx shadcn@latest add <component>
```

## Filename convention exception

shadcn CLI generates files in **lowercase** (e.g., `button.tsx`, `dialog.tsx`). This **deviates** from the project-wide PascalCase rule in CLAUDE.md, but it is required for `shadcn add` to work without manual renaming on every command.

Rule: lowercase **only inside `components/ui/`**. Everywhere else (including `components/shared/`, `features/<x>/components/`) keeps PascalCase.

## Other rules

- Pure presentation. No domain knowledge, no API calls, no business state.
- No imports from `features/`, `hooks/`, `api/`, `schemas/`.
- Style with Tailwind utility classes through `cn()` from `@/lib/cn`.
- Use `cva` for variants (multiple looks of the same primitive). Avoid >3 boolean props.
- Vendor here, then customize freely — shadcn is copy-paste, not a dependency.

## Updating shadcn config

`components.json` (repo root) controls the CLI. Note `aliases.utils` points to `@/lib/cn` (not `@/lib/utils`) — CLAUDE.md bans catch-all `utils.ts`.
