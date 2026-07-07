import { describe, expect, it } from 'vitest'

import { ALIGNED, KNOWN_DRIFT } from './registry'

// FE↔BE list-schema parity (ADR-0011).
//
// For every list endpoint the FE consumes, we parse a BE-DERIVED fixture (a
// representative body that mirrors the real `isp-cms-be` response DTO on
// origin/main — NOT the MSW handler, which is built to match the FE and would
// make this vacuous) with the FE zod schema the `api/*.ts` function actually
// uses. If the FE schema rejects a shape the BE really returns, that is a
// contract drift and this suite fails, naming the endpoint and the zod path.
//
// How to regenerate a fixture when a BE DTO changes: see ./fixtures/README.md.

function issuePaths(error: { issues: readonly { path: readonly PropertyKey[] }[] }): string[] {
  return error.issues.map((issue) => issue.path.map(String).join('.'))
}

describe('FE↔BE list-schema parity (ADR-0011)', () => {
  describe('aligned endpoints — BE-derived fixture must satisfy the FE schema', () => {
    for (const entry of ALIGNED) {
      it(`${entry.endpoint} parses with its FE list schema`, () => {
        const result = entry.feSchema.safeParse(entry.beFixture)
        if (!result.success) {
          const detail = result.error.issues
            .map((issue) => `${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`)
            .join('; ')
          throw new Error(
            `${entry.endpoint}: FE schema rejected the BE-derived fixture — contract drift. ${detail}`,
          )
        }
        expect(result.success).toBe(true)
      })
    }
  })

  // Any entry here has a real, still-open FE↔BE drift. Each test locks the
  // drift: it stays green while the BE gap exists and turns RED once the BE
  // returns the missing field and the fixture is re-derived — the cue to move
  // the entry into ALIGNED. Currently EMPTY: BE PR #115 closed the last six, so
  // every list endpoint is ALIGNED. This block re-arms automatically the moment
  // a new drift is registered.
  describe('known drift — BE-derived fixture is expected to FAIL the FE schema (follow-up)', () => {
    it('has no outstanding drift (all list endpoints aligned)', () => {
      expect(KNOWN_DRIFT).toHaveLength(0)
    })

    for (const entry of KNOWN_DRIFT) {
      it(`${entry.endpoint} still misses ${entry.missingPaths.join(', ')} → ${entry.followUp}`, () => {
        const result = entry.feSchema.safeParse(entry.beFixture)

        // If this flips to success, the BE closed the gap: move the entry to
        // ALIGNED and delete it from KNOWN_DRIFT.
        expect(result.success).toBe(false)

        if (!result.success) {
          const paths = issuePaths(result.error)
          for (const missing of entry.missingPaths) {
            expect(paths).toContain(missing)
          }
        }
      })
    }
  })
})
