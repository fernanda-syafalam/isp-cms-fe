# BE-derived contract fixtures (ADR-0011)

Each `*.json` here is a representative response body for one **list endpoint**,
derived from the **real backend** (`isp-cms-be`) response DTO — **not** from the
FE zod schema and **not** from the MSW handler.

The parity test (`../contract.parity.test.ts`) parses each fixture with the FE
zod schema the matching `src/api/*.ts` function uses. Because the fixture comes
from the BE contract, this catches the class of drift where the FE schema and
the BE DTO disagree (e.g. a missing `summary` block or a renamed field).

## Why not derive the fixture from the FE schema or from MSW?

Both would be vacuous:

- Deriving from the FE schema makes `feSchema.parse(fixture)` pass by
  construction — it can never catch drift.
- MSW handlers (`src/test/msw/handlers.ts`) are built to match the FE, so they
  encode the FE shape, not the BE's. Validating against them proves nothing
  about the real backend.

The fixture must reflect the BE. If the BE drops or renames a field, a correctly
re-derived fixture stops satisfying the FE schema and the test goes red.

## How each fixture was derived

For endpoint `GET /v1/<x>`, read the BE response DTO on `origin/main`:

```
isp-cms-be/src/modules/<module>/dto/<x>-response.dto.ts
```

The list envelope is `<X>ListResponseSchema` (`items` + `total` + `summary`).
Copy the exact field set, types, nullability and enum values from the
`*ResponseSchema` (item) and the `*SummarySchema` (summary). For endpoints whose
controller does **not** apply `@ZodSerializerDto`, the wire shape is what the
`*.repository.ts` / `*.service.ts` `list()` actually returns — read that instead
of trusting the DTO comment. Use realistic but synthetic values (valid UUIDs,
ISO datetimes, `YYYY-MM-DD` dates).

## Manual sync point (the one honest cost — ADR-0001: no shared package)

There is no generated client across the two repos, so these fixtures are the
**hand-maintained mirror** of the BE contract. When a BE list DTO changes:

1. Re-derive the affected `*.json` from the BE DTO / repository (steps above).
2. Run the parity test: `pnpm test src/test/contract` (or
   `./node_modules/.bin/vitest run src/test/contract/contract.parity.test.ts`).
3. If a previously **aligned** endpoint now fails, that is real drift — fix the
   FE schema (and/or the BE) so the contract matches again; do not paper over it
   by editing the fixture to match the FE.
4. If a **known-drift** endpoint now **passes**, the BE closed the gap: move its
   entry from `KNOWN_DRIFT` to `ALIGNED` in `../registry.ts`.

## Currently known-open drift (see `../registry.ts` → `KNOWN_DRIFT`)

These BE endpoints do not yet return a field the FE schema requires:

| Endpoint              | FE requires                | BE returns (origin/main)            |
| --------------------- | -------------------------- | ----------------------------------- |
| `GET /v1/invoices`    | `summary.byStatus`         | no `byStatus`                       |
| `GET /v1/branches`    | `summary.byStatus`         | no `byStatus`                       |
| `GET /v1/odp`         | `summary.available`        | no `available`                      |
| `GET /v1/sla-credits` | `summary.total`, `.void`   | only `activeAmount/pending/applied` |
| `GET /v1/vouchers`    | `summary.expired`          | no `expired`                        |
| `GET /v1/customers`   | `items[].billingAnchorDay` | item omits `billingAnchorDay`       |
