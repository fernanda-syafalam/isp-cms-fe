import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { resellerKeys } from './keys'

// The key factory exists to make prefix invalidation drift-proof. The reseller
// ledger is the sharpest case: the query key carries a trailing filter object,
// but a ledger write invalidates the FILTER-LESS base. These tests pin both the
// hierarchical shape and the real invalidation-matching behavior via TanStack's
// own matcher — so a mistyped segment can never silently break cache refresh.
describe('resellerKeys hierarchy', () => {
  it('nests lists/detail/ledger under the root so broad invalidation matches', () => {
    expect(resellerKeys.all).toEqual(['resellers'])
    expect(resellerKeys.lists()).toEqual(['resellers', 'list'])
    expect(resellerKeys.list({})).toEqual(['resellers', 'list', {}])
    expect(resellerKeys.detail('r1')).toEqual(['resellers', 'detail', 'r1'])
    expect(resellerKeys.ledgerBase('r1')).toEqual(['resellers', 'detail', 'r1', 'ledger'])
    expect(resellerKeys.ledger('r1', {})).toEqual(['resellers', 'detail', 'r1', 'ledger', {}])
    // The base MUST be a strict prefix of the filtered key (the invariant).
    const base = resellerKeys.ledgerBase('r1')
    const filtered = resellerKeys.ledger('r1', {})
    expect(filtered.slice(0, base.length)).toEqual(base)
  })

  it('ledgerBase(id) invalidation prefix-matches that reseller ledger, and only theirs', () => {
    const qc = new QueryClient()
    const aKey = resellerKeys.ledger('r1', { limit: 10, offset: 0 })
    const bKey = resellerKeys.ledger('r2', { limit: 10, offset: 0 })
    qc.setQueryData(aKey, { items: [], total: 0 })
    qc.setQueryData(bKey, { items: [], total: 0 })

    // What useAddLedgerEntry does on success for reseller r1.
    qc.invalidateQueries({ queryKey: resellerKeys.ledgerBase('r1') })

    expect(qc.getQueryState(aKey)?.isInvalidated).toBe(true)
    // A different reseller's ledger must not be caught by the prefix.
    expect(qc.getQueryState(bKey)?.isInvalidated).toBe(false)
  })
})
