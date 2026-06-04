# ADR-0001: Frontend Stack Selection

- **Date**: 2026-05-05
- **Status**: Accepted (amended 2026-06-04)
- **Deciders**: sanjit@xprogroup.com.au

> **Amendment 2026-06-04**: the linter/formatter decision below (ESLint 9 +
> Prettier) is superseded by **Biome** (single tool, `biome.json`). Rationale:
> cross-repo consistency with the `boilerplate-nestjs` service, which already
> standardised on Biome, and a faster single-binary lint+format step. The
> a11y coverage previously provided by `eslint-plugin-jsx-a11y` is replaced by
> Biome's `a11y` rule group. All other decisions in this ADR stand.

## Context

We are bootstrapping the `saas-clinic-controller` admin dashboard from scratch in May 2026. The project is a private SaaS administration UI for clinics, primarily used by internal operators. There is no public-facing marketing surface, no SEO requirement, and no SSR requirement at this time. The team is small and ships AI-assisted, so the stack must be:

- Easy for AI assistants to reason about (well-documented, widely-known idioms)
- Strict enough to catch errors at compile time (the team cannot afford to debug runtime type bugs)
- Boring — we should not be spending budget chasing bleeding-edge framework drama
- Forward-looking enough that we are not refactoring it in six months

We must lock the foundational choices now because they shape every subsequent file.

## Decision

We will use the following frontend stack:

> - **Build & dev server**: Vite 6
> - **Framework**: React 19 (with the new `ref`-as-prop, `use()` hook, and Compiler opt-in available)
> - **Language**: TypeScript 5.7+ in strict mode, with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax` enabled
> - **Routing**: TanStack Router 1.x (file-based)
> - **Server state**: TanStack Query 5
> - **Client global state**: Zustand 5 (used sparingly — only for auth and other truly app-wide state)
> - **Validation**: Zod 4
> - **Styling**: Tailwind CSS 4 (CSS-first config with `@theme inline {}`)
> - **UI primitives**: shadcn/ui (new-york style), vendored under `src/components/ui/`
> - **HTTP client**: ky
> - **Forms**: React Hook Form + Zod resolver
> - **Testing**: Vitest 3 + Testing Library + MSW (node mode); Playwright for E2E
> - **Linting & formatting**: Biome (`biome.json`) — see amendment above (was ESLint 9 + Prettier)
> - **Package manager**: pnpm

We will **not** introduce Next.js, Redux, Moment.js, Lodash (full bundle), or any CSS-in-JS runtime library. We will not store JWTs in localStorage or sessionStorage.

## Alternatives considered

### Alternative 1: Next.js 15 App Router

- **Pros**:
  - Server Components reduce client bundle for read-heavy pages
  - Built-in routing, image optimization, server actions
  - First-party Vercel deployment story
- **Cons**:
  - We have no SSR requirement — the admin app is auth-gated and operator-only
  - RSC boundary discipline adds cognitive load disproportionate to the benefit here
  - Slower local dev startup than Vite for SPA workloads
  - Tighter coupling between routing and data fetching makes feature extraction harder
- **Why rejected**: The dashboard is a private SPA. SSR pays cost without revenue. Vite + TanStack Router gives us file-based routing and type-safe links without the RSC tax.

### Alternative 2: React 18 + Tailwind 3 + Zod 3 (conservative versions)

- **Pros**:
  - Maximum ecosystem compatibility — every shadcn snippet, blog post, and Stack Overflow answer applies
  - Slower but well-trodden upgrade path
- **Cons**:
  - We are starting from zero with no legacy to drag along — there is no migration cost to pay
  - Tailwind 4 build is materially faster (claimed 5x) and the CSS-first config is simpler than the JS config
  - Zod 4 has roughly half the bundle size and ~3x faster type inference for large schemas
  - React 19 removes `forwardRef` boilerplate and ships `useFormStatus` / `useOptimistic` which simplify exactly the patterns this app needs
- **Why rejected**: Stale at birth. The cost of upgrading later (compounded by the codebase growing) is worse than the cost of patching the small handful of upstream incompatibilities now (which we have already absorbed in the boilerplate PRs).

### Alternative 3: Remix / React Router 7 framework mode

- **Pros**:
  - Loader/action model is excellent for forms
  - File-based routing
- **Cons**:
  - Same SSR-not-needed argument as Next.js
  - Smaller community than TanStack Router for SPA usage
  - We would still want TanStack Query — mixing two data layers
- **Why rejected**: TanStack Router covers our needs without dragging in framework-mode features we will not use.

### Alternative 4: Do nothing (no shared boilerplate, each feature picks its tools)

- **Pros**:
  - Zero upfront decision cost
- **Cons**:
  - Inconsistency compounds. By feature five we will have three styling systems and two state libraries
  - Onboarding gets harder over time — each contributor learns a different subset
  - AI assistants degrade in quality when there is no consistent pattern to follow
- **Why rejected**: A boilerplate is a forcing function. Skipping it is technical debt collected on day one.

## Consequences

### Positive

- One canonical pattern for every concern: forms, fetching, validation, styling, state. New features copy `features/tenants/` and adjust.
- Strict TypeScript catches a meaningful share of bugs before runtime — particularly important given AI-assisted development volume.
- `components/ui/` is a vendored copy of shadcn — we own it, can edit it freely, and are not blocked by an upstream maintainer.
- Vite + Vitest share a config, reducing dual-tooling overhead.

### Negative

- shadcn upstream sometimes ships code that does not pass `exactOptionalPropertyTypes: true`. We patch in place rather than relax tsconfig — this means each new shadcn component added via the CLI may need a small touch-up. Net cost has been ~10 minutes per component added so far.
- The `components/ui/` folder is the only place using lowercase filenames (shadcn CLI convention). This is documented as an exception in `CLAUDE.md` and `components/ui/README.md`.
- Tailwind 4 plugin ecosystem is still catching up — some niche plugins are unmaintained or behind. We mitigate by avoiding plugins where possible and writing CSS in `@theme` instead.
- Vite is SPA-first. If we later need SSR or marketing pages, that becomes a separate project (likely Next.js) rather than a config flip.

### Neutral

- The team commits to an annual stack review (next: 2027-05). Major-version bumps require a follow-up ADR superseding this one.

## Implementation Notes

The boilerplate landed across PRs #1, #2, and #3:

- PR #1 — Vite + TS + ESLint + Tailwind + base shadcn Button, layered architecture skeleton
- PR #2 — 13 shadcn primitives + tenants list page demonstrating the canonical Form/Table/Dialog pattern
- PR #3 — auth scaffold (Zustand store + HttpOnly refresh cookie + TanStack Router protected layout)

Critical files that encode the decision:

- `package.json` — version pins for every dependency in this ADR
- `tsconfig.json` — strict-mode flags
- `vite.config.ts` — plugin order (TanStack Router → React → Tailwind)
- `eslint.config.js` — rule set
- `src/components/ui/README.md` — documents the lowercase-filename deviation
- `CLAUDE.md` — encodes the architecture rules this stack supports

## Validation

This decision is validated if, six months from now (2026-11):

- We have not introduced a second styling system, a second state library, or a second form library
- New features can be scaffolded by copying `features/tenants/` and feel natural
- CI build time stays under 3 minutes on a clean cache
- We have not had to relax `tsconfig.json` strict flags

If any of those fail, we revisit and supersede this ADR.
