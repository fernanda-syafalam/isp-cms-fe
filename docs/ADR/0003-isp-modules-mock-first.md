# ADR-0003: ISP CMS Modules, Mock-First Frontend

- **Date**: 2026-06-05
- **Status**: Accepted
- **Deciders**: sanjit@xprogroup.com.au

## Context

`isp-cms-fe` is becoming the admin dashboard for an internal ISP operator (see
`docs/FEATURES.md`). The backend (`isp-cms-be`) currently exposes only
`/v1/auth` and `/v1/users`; the ISP domain modules (customers, plans, invoices,
devices, tickets, coverage, reports) have no endpoints yet. We need the
frontend to make progress — define screens, navigation, and the data contract —
without being blocked on the backend.

## Decision

Build the ISP modules **mock-first**:

> 1. Each module's shape is defined as a **Zod schema** in `src/schemas/<m>.ts`
>    — the single source of truth for both the TypeScript type and runtime
>    validation.
> 2. API functions in `src/api/<m>.ts` call the HTTP client and **Zod-parse**
>    the response, exactly as they will against the real backend.
> 3. **MSW handlers** (`src/test/msw/handlers.ts`) serve realistic fixtures for
>    those endpoints in dev and test, so the UI is fully exercisable offline.
> 4. The **Staff** module is the exception: it is wired to the real
>    `/v1/users` endpoint (these are the internal accounts).
> 5. When the backend ships an endpoint, we delete its MSW handler — the api/
>    hook/component layers do not change.

The FE-owned contract is documented in `docs/FEATURES.md` §4 and is what the
backend must implement.

## Alternatives considered

- **Wait for the backend** — blocks all UI/UX work; rejected.
- **Hardcode fixtures inside components** — bypasses the api/Zod boundary, so
  the switch to real endpoints would touch every component; rejected (violates
  the constitution's "validate at boundary" + "no fetch in components").
- **Generate types from a backend OpenAPI spec** — no spec exists yet; revisit
  in Phase B (matches workspace ADR-0001's deferred-codegen note).

## Consequences

### Positive

- UI, navigation, and the data contract progress immediately and are testable.
- Swapping mock → real is a per-endpoint deletion of an MSW handler; the typed
  api layer already validates the same shape.
- Forces the contract to be explicit and reviewed before the backend commits.

### Negative

- The contract lives on the FE until the backend catches up; drift is possible.
  Mitigation: `docs/FEATURES.md` §4 is the agreed shape, and the backend PR
  must match it (workspace paired-PR rule).
- Mock fixtures can hide pagination/perf realities; revisit when wiring live.

## Validation

Holds while: every module's response is Zod-parsed in `src/api/*`, no component
calls the network directly, and removing an MSW handler is sufficient to point a
module at the real backend. Supersede when all modules are live and MSW is only
used for tests.
