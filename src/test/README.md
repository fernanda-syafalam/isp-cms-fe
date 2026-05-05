# test/

Test infrastructure (not the tests themselves — those are co-located next to source files).

- `setup.ts` — Vitest setup. Wires `@testing-library/jest-dom` matchers and starts the MSW server.
- `msw/handlers.ts` — default MSW handlers for unit/component tests.
- `msw/server.ts` — node MSW server.

## Conventions

- Co-locate component/unit tests: `Button.tsx` ↔ `Button.test.tsx`.
- E2E tests live under `tests/e2e/` (Playwright).
- Mock at the network layer (MSW) — never mock individual functions unless absolutely necessary.
