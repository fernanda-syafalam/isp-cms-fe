# Boilerplate Dashboard

AI-first React + Vite + TanStack admin dashboard template. Fork it, replace the worked example, and ship.

Every AI agent that opens this repo (Claude Code, and compatible tools) reads `CLAUDE.md` and operates under its rules — that file is the project constitution.

## What's inside

- **Build & dev**: Vite 6, TypeScript 5.7 in strict mode (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`)
- **Framework**: React 19, TanStack Router (file-based) + TanStack Query 5
- **UI**: Tailwind 4 (CSS-first config) + shadcn/ui (new-york) + lucide-react
- **Validation**: Zod 4 with branded ID types
- **HTTP client**: ky with `AppError` normalization
- **Auth**: in-memory access token (Zustand) + HttpOnly refresh cookie + single-flight 401 refresh — see `docs/ADR/0002-auth-strategy.md`
- **State**: Zustand for true cross-component client state, TanStack Query for server state
- **Forms**: React Hook Form + Zod resolver
- **Tests**: Vitest 3 + Testing Library + MSW (node mode); Playwright 1.49 for E2E
- **Lint/format**: ESLint 9 flat config + Prettier
- **CI**: GitHub Actions running lint → typecheck → test → build → bundle-size budget per PR

## Tags

| Tag      | Milestone                                                |
| -------- | -------------------------------------------------------- |
| `v0.1.0` | Scaffold (Vite + React + Tailwind + shadcn primitives)   |
| `v0.2.0` | UI primitives + tenants list example (Form/Table/Dialog) |
| `v0.3.0` | Auth scaffold                                            |
| `v0.4.0` | Auth tests + bug fixes                                   |
| `v0.5.0` | Code splitting                                           |
| `v1.0.0` | Stable template (this commit)                            |

Fork from any tag to skip features you don't need.

## Layout (high-level)

```
src/
├── routes/        # TanStack Router file-based routes (eager + .lazy split)
├── features/      # Domain bundles — one folder per feature
│   ├── auth/      # In-memory token, login, protected layout
│   └── tenants/   # CRUD example demonstrating Form/Table/Dialog pattern
├── components/ui/ # shadcn primitives (vendored, edit freely)
├── api/           # Pure async fetch functions, no React
├── schemas/       # Zod schemas (single source of truth)
├── hooks/         # Cross-feature hooks
├── lib/           # Pure utilities (cn, errors, ...)
├── types/         # Branded IDs and pure type defs
└── test/          # Vitest setup + MSW handlers + helpers
```

See `CLAUDE.md` for the full architecture rules and `docs/ADR/` for decisions.

## Getting started

```bash
pnpm install
cp .env.example .env       # edit VITE_API_BASE_URL to point at your backend
pnpm dev
```

Then:

- Open http://localhost:5173
- Sign in via `/login` (MSW will mock the backend in dev once you wire it; until then, use the Vitest mocks as reference and replace with your real backend contract from `src/api/`)

## How to fork this

1. Replace `features/tenants/` with your first real domain feature using the same shape
2. Update `CLAUDE.md > Project Context` to reflect your project (name, domain, users, backend, compliance)
3. Replace `routes/index.tsx` placeholder with a real landing/dashboard
4. Sanitize `routes/__root.tsx` nav for your real app
5. Add ADRs to `docs/ADR/` as you make decisions worth remembering 6 months later
6. Ship

## Available slash commands and agents

- `/review`, `/component`, `/refactor`, `/audit`, `/test`, `/adr` — see `.claude/commands/`
- `@code-reviewer`, `@refactorer`, `@test-writer` — see `.claude/agents/`

## Why this exists

Most "boilerplates" ship a blank canvas. This one ships **patterns**: every common admin-dashboard concern (auth, list pages, forms, tables, validation, error toasts) has one canonical implementation a contributor (or AI agent) can copy. Strict TypeScript, layered imports, and a single source of truth for every shape mean you can grow the codebase without it growing fractal.

## License

MIT — fork and use freely.
