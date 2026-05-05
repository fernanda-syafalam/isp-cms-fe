# Project Constitution

> This file is read automatically by Claude Code at the start of every session.
> It defines how AI agents must operate in this codebase. Treat every rule as binding
> unless explicitly overridden by the user in the current conversation.

## Table of Contents

1. [Project Context](#project-context)
2. [Core Engineering Principles](#core-engineering-principles)
3. [Tech Stack & Tooling](#tech-stack--tooling)
4. [Architecture Rules](#architecture-rules)
5. [Naming Conventions](#naming-conventions)
6. [File Organization](#file-organization)
7. [TypeScript Rules](#typescript-rules)
8. [React Component Patterns](#react-component-patterns)
9. [State Management Hierarchy](#state-management-hierarchy)
10. [Data Fetching Patterns](#data-fetching-patterns)
11. [Form Patterns](#form-patterns)
12. [Error Handling](#error-handling)
13. [Testing Strategy](#testing-strategy)
14. [Performance](#performance)
15. [Accessibility](#accessibility)
16. [Security](#security)
17. [NEVER List](#never-list)
18. [ALWAYS List](#always-list)
19. [Decision Rubrics](#decision-rubrics)
20. [Communication Protocol](#communication-protocol)
21. [Definition of Done](#definition-of-done)

---

## Project Context

**Fill this section per project before first use:**

- **Project name**: [TO FILL]
- **Domain**: [TO FILL — e.g., admin dashboard, e-commerce, SaaS]
- **Primary users**: [TO FILL]
- **Backend**: [TO FILL — separate API, e.g., Go REST, Node tRPC, etc.]
- **Deployment target**: [TO FILL]
- **Compliance requirements**: [TO FILL — none, GDPR, HIPAA, PCI, etc.]

---

## Core Engineering Principles

These are not slogans. Each principle translates to enforceable rules below.

### 1. Boring code wins
Predictable beats clever. If a junior engineer cannot read a function in 30 seconds and understand its purpose, rewrite it.

### 2. Optimize for the reader, not the writer
Code is read 10x more than written. Verbose-but-clear beats terse-and-cryptic.

### 3. Make the wrong thing hard
Use the type system, lint rules, and architecture to prevent mistakes — not documentation alone.

### 4. Single source of truth
Each piece of state, config, or knowledge lives in exactly one place. Duplication is a bug waiting to happen.

### 5. YAGNI before DRY before SOLID
- **YAGNI first**: don't build what you don't need today.
- **DRY second**: when you have 3+ duplications, extract.
- **SOLID third**: apply when complexity demands it, not preemptively.

### 6. Explicit over implicit
Magic is debt. Prefer named, traceable patterns over framework magic when the cost is low.

### 7. Fail loud, fail fast
Errors should surface immediately and clearly. Silent failures are worse than crashes.

### 8. Composition over configuration
A component with 12 boolean props is broken. Split it.

---

## Tech Stack & Tooling

**Mandatory (non-negotiable):**
- **TypeScript**: strict mode, `noUncheckedIndexedAccess: true`
- **ESLint** + **Prettier**: with `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `@typescript-eslint`
- **Package manager**: pnpm (or npm/yarn — pick one and commit)
- **Node**: latest LTS

**Recommended (use unless project has reason otherwise):**
- **Build**: Vite (or Next.js if SSR/SSG needed)
- **Test**: Vitest + Testing Library + Playwright for E2E
- **Validation**: Zod
- **Forms**: React Hook Form
- **Server state**: TanStack Query
- **Styling**: Tailwind CSS
- **UI primitives**: Radix UI or shadcn/ui (vendored)

**Banned outright:**
- Class components (use functions + hooks)
- Default exports for components (use named exports — refactoring + grep friendly)
- `any` type (use `unknown` and narrow)
- Moment.js (use date-fns or Temporal)
- Lodash full-import (use per-method imports or rewrite)
- CSS-in-JS runtime libraries (Emotion, styled-components) for new code (use Tailwind, CSS modules, or vanilla-extract)

---

## Architecture Rules

### Layering (strict)

Imports flow downward only. Never upward.

```
routes/pages/  →  features/  →  components/  →  hooks/  →  api/  →  schemas/  →  lib/
                                                                                  ↓
                                                                                types/
```

**Rules:**
- `lib/` and `types/` import nothing from app code (pure utilities and types).
- `schemas/` imports only from Zod and `types/`.
- `api/` imports schemas, types, lib — never components or hooks.
- `hooks/` import api, schemas, lib — never components.
- `components/` import hooks, schemas, ui — never routes.
- `features/` is allowed to bundle hooks + components for a domain (e.g., `features/tenants/`).
- `routes/` is the only layer allowed to import from `features/`.

**Why:** dependency direction is a forcing function. Cycles cause bugs and slow builds. If you cannot import what you need, the design is wrong — fix the design, not the rule.

### Boundaries

- **Domain logic** lives in `features/<domain>/` or `lib/<domain>/`. Never in components.
- **API calls** never happen inside components. They go through `api/` and are consumed via `hooks/`.
- **Validation** happens at boundaries: API responses (Zod parse), form inputs (Zod schema), URL search params (Zod).
- **Side effects** (analytics, logging, navigation) are explicit. No surprise side effects in render.

---

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files (component) | PascalCase | `TenantTable.tsx` |
| Files (hook) | camelCase, `use` prefix | `useTenants.ts` |
| Files (utility) | camelCase | `formatCurrency.ts` |
| Files (route) | per router convention | `_auth.tenants.index.tsx` |
| Components | PascalCase | `function TenantTable()` |
| Hooks | camelCase, `use` prefix | `function useTenants()` |
| Functions | camelCase, verb-first | `formatDate`, `parseTenantFilter` |
| Constants | UPPER_SNAKE | `MAX_PAGE_SIZE` |
| Types/Interfaces | PascalCase, no `I` prefix | `type Tenant`, `type TenantProps` |
| Enums (avoid) | PascalCase | use `as const` objects instead |
| Booleans | `is`/`has`/`can`/`should` prefix | `isLoading`, `hasError` |
| Event handlers (props) | `on` prefix | `onClick`, `onChange` |
| Event handlers (impl) | `handle` prefix | `handleSubmit` |

**File naming bans:**
- No `index.ts` re-exports of components (use direct file imports — better for refactoring tools).
- No `utils.ts` catch-all files. If utilities don't share a clear domain, separate files.
- No `types.ts` in feature folders unless type is shared by 3+ files in that folder.

---

## File Organization

```
src/
├── routes/         # Pages/routes (per router framework convention)
├── features/       # Domain features that bundle multiple files
│   └── tenants/
│       ├── components/
│       ├── hooks/
│       └── index.ts        # Barrel ONLY for the feature's public API
├── components/     # Cross-feature reusable components
│   ├── ui/         # Primitives (buttons, inputs) — never domain logic
│   └── shared/     # Composite components used across features
├── hooks/          # Cross-feature hooks
├── api/            # API client + endpoint functions
├── schemas/        # Zod schemas (single source of truth for shapes)
├── lib/            # Pure utilities (no React)
├── types/          # Pure type definitions (no runtime)
├── styles/         # Global CSS, Tailwind config
└── main.tsx
```

**When to create a `feature/` folder:**
- Domain has 3+ components, OR
- Domain has its own state machine, OR
- Domain is likely to be extracted to a separate package.

If a domain is just one component + one hook, keep it flat under `components/` and `hooks/`.

---

## TypeScript Rules

### Mandatory `tsconfig.json` settings

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true
  }
}
```

### Type rules

- **No `any`.** Period. Use `unknown` and narrow.
- **No non-null assertion (`!`)** unless you can prove with a comment why it's safe. Prefer narrowing.
- **No `as` casting** except: (a) `as const` for literal types, (b) Zod-validated narrowing, (c) DOM type narrowing (`as HTMLElement` after `instanceof` check).
- **Prefer `type` over `interface`** unless declaration merging is needed (rare). Consistency matters more than the trivial perf difference.
- **Discriminated unions for variants:**

```ts
// BAD
type Result = { ok: boolean; data?: string; error?: string }

// GOOD
type Result =
  | { ok: true; data: string }
  | { ok: false; error: string }
```

- **`as const` for literal arrays/objects** when you want narrow types.
- **Branded types** for IDs that should not be interchangeable:

```ts
type TenantId = string & { readonly __brand: 'TenantId' }
type UserId = string & { readonly __brand: 'UserId' }
// Function signature now refuses wrong ID type at compile time.
```

- **Never re-export types with `export *`.** Be explicit.

---

## React Component Patterns

### Component anatomy

```tsx
// 1. Imports — external first, then internal, grouped
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { useTenants } from '@/hooks/useTenants'
import { TenantSchema } from '@/schemas/tenant'
import { Button } from '@/components/ui/button'

// 2. Types co-located with component
type Props = {
  tenantId: string
  onSuspend: (id: string) => void
}

// 3. Named export, function declaration
export function TenantCard({ tenantId, onSuspend }: Props) {
  // 4. Hooks at top, in order: routing -> data -> state -> derived -> effects
  const navigate = useNavigate()
  const { data: tenant, isLoading } = useTenant(tenantId)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // 5. Early returns for loading/error/empty
  if (isLoading) return <TenantCardSkeleton />
  if (!tenant) return <EmptyState message="Tenant not found" />

  // 6. Event handlers (handle* prefix)
  const handleSuspend = () => {
    onSuspend(tenant.id)
    setConfirmOpen(false)
  }

  // 7. Render
  return (
    <article>
      <h2>{tenant.name}</h2>
      <Button onClick={() => setConfirmOpen(true)}>Suspend</Button>
    </article>
  )
}
```

### Component rules

- **Max 200 lines per component file.** If longer, split.
- **Max 7 props.** If more, you're either missing a composition or need a context.
- **No prop drilling >2 levels.** Use composition or scoped context.
- **No conditional hooks.** Hooks at top, always called in same order.
- **No business logic in event handlers.** Event handler calls a function; logic lives in the function.
- **No inline objects/arrays in props that cause re-renders** when parent re-renders frequently. Memoize or hoist.
- **Loading, error, empty states are mandatory** for any component that fetches data. Skeleton > spinner.

### Composition patterns

**Prefer composition over boolean props explosion:**

```tsx
// BAD
<Card showHeader showFooter compact bordered elevated highlighted>...</Card>

// GOOD
<Card>
  <CardHeader>...</CardHeader>
  <CardBody>...</CardBody>
  <CardFooter>...</CardFooter>
</Card>
```

**Slot patterns over render props for simple cases:**

```tsx
type Props = {
  header: ReactNode
  children: ReactNode
  footer?: ReactNode
}
```

---

## State Management Hierarchy

**Choose state location in this order. Stop at the first that fits.**

1. **Derived from props/existing state** -> no state needed. Compute it.
2. **Local component state** (`useState`, `useReducer`) -> component-only state.
3. **URL state** (search params, route params) -> state that should be bookmarkable, shareable, or survive refresh.
4. **Server cache** (TanStack Query / SWR) -> state owned by the server.
5. **Scoped context** -> state shared by a subtree, not the whole app.
6. **Global store** (Zustand, Jotai) -> only when 3+ unrelated components need it AND it's not server state.

### Decision tree

```
Is it server data?           -> Server cache (Query)
Should it survive refresh?   -> URL state
Used by one component?       -> Local state
Used by a subtree?           -> Context (scoped, not global)
Used everywhere?             -> Global store (Zustand)
```

### Anti-patterns

- Putting server data in Zustand/Redux. The server already owns it. Use Query.
- Storing derived values in state. Derive in render or `useMemo` if expensive.
- Syncing server data into local state with `useEffect`. Use Query's `select` or compute in render.
- Global store for data used by one component.

---

## Data Fetching Patterns

### Query keys

Always arrays, hierarchical, predictable:

```ts
// GOOD
['tenants']                              // all tenants
['tenants', 'list', filterObject]        // filtered list
['tenants', 'detail', tenantId]          // single tenant
['tenants', 'detail', tenantId, 'metrics'] // sub-resource

// BAD
['tenant-list', filter]                  // inconsistent
[`tenant-${id}`]                         // string concat
```

### API layer pattern

```ts
// api/tenants.ts — pure functions, no React
export async function listTenants(filter: TenantFilter): Promise<TenantList> {
  const res = await api.get('tenants', { searchParams: filter }).json()
  return TenantListSchema.parse(res)  // ALWAYS validate at boundary
}

// hooks/useTenants.ts — React glue
export function useTenantsList(filter: TenantFilter) {
  return useQuery({
    queryKey: ['tenants', 'list', filter],
    queryFn: () => listTenants(filter),
    staleTime: 30_000,
  })
}
```

### Mutation pattern

```ts
export function useSuspendTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: SuspendInput) => suspendTenant(id, reason),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.setQueryData(['tenants', 'detail', vars.id], data)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
```

### Rules

- **Validate every API response with Zod.** Network is untrusted, even your own backend.
- **Never call `fetch`/`ky` from components.** Always go through `api/` -> `hooks/`.
- **Loading skeleton, not spinner.** Skeleton matches final layout.
- **Optimistic updates only when failure is rare and reversal is cheap.**
- **Never poll faster than 5 seconds** without a strong reason. Prefer SSE/WebSocket for true real-time.

---

## Form Patterns

**Stack:** React Hook Form + Zod resolver.

```tsx
const FormSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
})
type FormValues = z.infer<typeof FormSchema>

export function TenantForm({ onSubmit }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '', name: '' },
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Field
        label="Email"
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />
      <Button type="submit" disabled={form.formState.isSubmitting}>
        Save
      </Button>
    </form>
  )
}
```

### Rules

- **Single Zod schema** is the source of truth. Type, validation, and parser all derive from it.
- **Field component** wraps label + input + error. Never inline error display in every field.
- **Disable submit during submission.** Always.
- **Show server errors** with field-level mapping when possible (`form.setError('email', { message: ... })`).
- **`noValidate` on form** to disable native browser validation (we own validation).
- **Accessible errors:** `aria-invalid` and `aria-describedby` on inputs with errors.

---

## Error Handling

### Layers

1. **Network errors** — `api/` layer normalizes to `AppError` with code + message.
2. **Mutation errors** — surfaced via toast or form field error.
3. **Render errors** — caught by Error Boundaries (one per route minimum).
4. **Unhandled** — global error reporter (Sentry) catches and logs.

### Pattern

```ts
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public cause?: unknown
  ) {
    super(message)
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred'
}
```

### Rules

- **Never `console.log` errors silently.** Either handle or rethrow.
- **Never show raw error.message to user.** Map to friendly message.
- **Always include user-actionable next step** ("Try again", "Contact support", "Refresh page").
- **Error boundary per route**, with reset button.

---

## Testing Strategy

### What to test

- **E2E (Playwright)**: critical user paths only — login, primary action per main feature, payment flow if applicable. 5-15 tests for the whole app.
- **Component tests (Testing Library)**: components with branching logic, forms, complex interactions. Skip pure display components.
- **Unit tests (Vitest)**: pure utilities in `lib/`, schemas in `schemas/`, parsing logic. Aim for 80%+ on these files.
- **Integration tests**: hooks that orchestrate multiple API calls or have non-trivial logic.

### What NOT to test

- Implementation details (internal state, function names, prop drilling paths).
- Third-party libraries (assume they work).
- Trivial components (`<Button>{children}</Button>`).
- Type-level guarantees (TypeScript already proves them).

### Rules

- **Test behavior, not implementation.** "When user clicks Suspend, tenant status updates" not "useState is called with 'suspended'".
- **Use Testing Library queries in priority order**: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`.
- **`data-testid` is a last resort.** Prefer accessible queries.
- **Mock at the network layer** (MSW), not at the function layer.

---

## Performance

### Defaults

- **Don't memoize preemptively.** `useMemo`/`useCallback` only when:
  - Profiler shows actual problem, OR
  - Value is passed to `memo`d child that re-renders frequently, OR
  - Value is dependency of another hook (effect/memo).
- **Lazy-load route components.** Always.
- **Lazy-load heavy non-critical components** (charts, editors, modals).
- **Virtualize lists with >100 items.** TanStack Virtual or react-window.
- **Debounce text inputs** that trigger expensive operations (>200ms).
- **Image optimization mandatory** — proper sizes, formats (WebP/AVIF), lazy attribute.

### Bundle awareness

- **Check bundle size on every PR** (CI step with size-limit or bundlephobia).
- **Tree-shake aggressively** — no `import * as` from large libraries.
- **No moment.js, no full lodash, no axios when fetch suffices.**

---

## Accessibility

**Target: WCAG 2.1 AA minimum.**

### Mandatory

- **Semantic HTML.** Use `<button>` for buttons, `<a>` for links, `<nav>`, `<main>`, `<article>`, etc.
- **Every form input has a label.** Visible label preferred; `aria-label` only when visual label is contextual.
- **Keyboard navigation works.** Tab order, focus visible, no traps.
- **Focus management on route change** (focus main heading or container).
- **Color contrast >= 4.5:1** for body text.
- **No `div onClick`.** Use `<button>` and reset styling with Tailwind.
- **Loading states announced** via `aria-live` for screen readers.
- **Error messages associated with inputs** via `aria-describedby`.

### Recommended

- Test with keyboard only on every PR.
- Run `axe-core` (via `@axe-core/playwright`) on critical pages in E2E.
- Test with screen reader (VoiceOver / NVDA) on major releases.

---

## Security

### Frontend security baseline

- **Never store JWT in localStorage.** Use memory + HTTP-only refresh cookie.
- **Never log secrets, tokens, or PII** even in dev.
- **Sanitize HTML** — never `dangerouslySetInnerHTML` without sanitizer (DOMPurify).
- **Validate URL params** before using them — they are user input.
- **Env vars**: only `VITE_` / `NEXT_PUBLIC_` prefixed are public. Never put secrets there.
- **Dependency audit**: `pnpm audit` in CI. Block high/critical without explicit waiver.
- **CSP header** at the deployment level (configure on host).
- **No `eval`, no `new Function`.** Lint-banned.

### Auth flow rules

- Access token in memory (Zustand store, not localStorage).
- Refresh token in HTTP-only secure cookie set by backend.
- Auto-refresh on 401, with single-flight (avoid concurrent refresh requests).
- Logout clears all client state (`queryClient.clear()`, store reset).

---

## NEVER List

These are absolute. AI must not generate code that violates these without explicit user override.

1. `any` type — use `unknown` + narrow
2. Class components — use functions + hooks
3. Default exports for components, hooks, or schemas
4. `useEffect` for derived state — derive in render
5. `useEffect` for data fetching — use TanStack Query
6. `useState` for server data — use TanStack Query
7. Storing JWT in `localStorage` or `sessionStorage`
8. `dangerouslySetInnerHTML` without DOMPurify
9. Inline styles for non-dynamic values — use Tailwind/CSS
10. `console.log` left in committed code (use logger or remove)
11. Disabling lint rules without comment explaining why
12. `// @ts-ignore` (use `// @ts-expect-error` with comment, or fix)
13. Non-null assertion (`!`) without proof comment
14. `as` casting except `as const` or after Zod parse
15. Prop drilling >2 levels — use composition or context
16. Boolean prop flags >3 — split component
17. Components >200 lines — split
18. Functions >50 lines — split
19. Files >400 lines — split
20. Magic numbers/strings — extract to constants
21. Mutating props or state directly
22. Async logic in `useEffect` without cleanup/abort
23. `index.ts` barrel files for components (cripples bundlers and refactor tools)
24. Catch-all `utils.ts` files
25. `enum` (use `as const` object)
26. Direct `fetch`/`ky` calls in components — go through `api/` -> `hooks/`
27. API responses used without Zod validation
28. TODO/FIXME without ticket reference and date
29. Dead code (unused imports, functions, variables) — delete
30. Commented-out code — delete (git remembers)

---

## ALWAYS List

1. Validate API responses with Zod at boundary
2. Validate URL search params with Zod
3. Validate form inputs with Zod
4. Co-locate types with components (unless shared by 3+)
5. Loading + error + empty states for every async UI
6. Skeleton over spinner for loading states matching final layout
7. Disable submit during form submission
8. Named exports
9. Function declarations for components (not arrow functions assigned to const)
10. Discriminated unions for variant types
11. Branded types for IDs across domains
12. `as const` for literal types and config objects
13. `noValidate` on forms (we own validation)
14. Accessible labels for all form inputs
15. Semantic HTML elements (no `div` for buttons/links)
16. `key` on list items uses stable ID, not index (unless list is static)
17. Error boundary per route
18. Lazy-load route components
19. Memoize only when measured or required for correctness
20. Cleanup in `useEffect` (abort, unsubscribe, clearTimeout)
21. Single Zod schema as source of truth (type, validation, parser)
22. Toast for transient feedback, dialog for blocking confirmation
23. Friendly error messages with next-step action
24. Run lint + typecheck + tests before claiming done
25. Update tests when behavior changes
26. Update CLAUDE.md if a new pattern emerges (or propose update)

---

## Decision Rubrics

### "Should this be a custom hook?"

Yes if:
- It uses other hooks AND
- It's used in 2+ components OR contains non-trivial logic that obscures the component.

No if:
- It's pure logic with no hooks -> make it a utility in `lib/`.
- It's used once and is short -> keep inline.

### "Should this be in context?"

Yes if:
- 3+ components in a subtree need it AND
- It changes infrequently OR consumers tolerate re-renders.

No if:
- Only 1-2 components need it -> pass props.
- It changes frequently and many consumers re-render -> use a store with selectors.

### "Should I extract this into a component?"

Yes if:
- It's reused in 2+ places, OR
- The parent component exceeds 200 lines, OR
- The JSX has its own state/effects that can be encapsulated.

No if:
- It's a one-off and small -> keep inline.
- Extraction would require >5 props to recreate the same behavior -> keep inline.

### "Memoize or not?"

Memoize if:
- React Profiler shows it's a bottleneck, OR
- It's a dependency of another hook (correctness), OR
- It's passed to a `memo`'d child that re-renders frequently.

Don't memoize if:
- "Just to be safe" — `useMemo` itself has cost.
- Computation is trivial (simple arithmetic, string concat).

### "Server state or client state?"

Server state if:
- The data lives on a server you don't fully control timing for.
- Other clients can change it.
- It must be refetched, cached, or synchronized.

Client state if:
- It's UI-only (modal open, selected tab, form draft).
- It does not need to survive a refresh.

---

## Communication Protocol

### When AI must STOP and ASK the user

- Architectural change that affects 3+ files outside the current task scope.
- Adding a new dependency (npm package).
- Modifying global config (tsconfig, eslint, vite config).
- Deleting code that is not obviously dead.
- A rule in this file conflicts with the requested task.
- The task is ambiguous in a way that would change the implementation significantly.

### When AI may PROCEED without asking

- Following established patterns in the codebase.
- Fixing obvious bugs in scope.
- Adding tests for new code.
- Refactoring within a single file for clarity (without changing behavior).
- Renaming local variables for clarity.

### When AI must REPORT after completion

- All file changes with brief rationale.
- Tests added/updated.
- Lint/typecheck/test results (run them — don't skip).
- Any TODO left and why.
- Any rule from this file that was bent and why.

---

## Definition of Done

A task is **done** only when ALL of the following are true:

- [ ] Code compiles with no TypeScript errors.
- [ ] `pnpm lint` passes with no warnings (or warnings are documented).
- [ ] Relevant tests pass (`pnpm test`).
- [ ] New behavior has tests (unit, component, or E2E as appropriate).
- [ ] No `console.log`, `TODO` without ticket, or commented-out code.
- [ ] No new `any`, `as`, `!`, or `@ts-ignore` introduced.
- [ ] Loading, error, and empty states handled for new UI.
- [ ] Accessibility checked: keyboard nav, labels, contrast.
- [ ] No new dependencies without user approval.
- [ ] CLAUDE.md updated if a new pattern was introduced.

If any item is incomplete, AI must say so explicitly — never claim done with caveats hidden.
