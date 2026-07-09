import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { useResellerCommissionTotal, useResellersList } from './useResellers'

// GET /v1/resellers is admin/staff-only, so a mitra must never fire it (a 403
// on every session start). The list page redirects a mitra to their own
// storefront and passes `enabled: role !== 'mitra'` to this hook to skip the
// fetch entirely. These tests pin that behavior.
describe('useResellersList', () => {
  it('does not fetch when disabled (the mitra case)', async () => {
    const { result } = renderHook(() => useResellersList({}, { enabled: false }), {
      wrapper: TestProviders,
    })

    // Disabled queries stay idle: the queryFn never runs, so no request is made.
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()

    // Give it a tick to prove it stays idle rather than kicking off a fetch.
    await new Promise((r) => setTimeout(r, 20))
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('fetches when enabled (admin/staff)', async () => {
    const { result } = renderHook(() => useResellersList({}, { enabled: true }), {
      wrapper: TestProviders,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items.length).toBeGreaterThan(0)
  })

  it('fetches by default when no options are passed', async () => {
    const { result } = renderHook(() => useResellersList({}), {
      wrapper: TestProviders,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items.length).toBeGreaterThan(0)
  })
})

// The "Total komisi" KPI must reflect the TRUE sum of commission entries across
// the whole ledger, not a truncated first-page (200-row) sum (flow-audit Low).
describe('useResellerCommissionTotal', () => {
  const RESELLER_ID = 'a3a3a3a3-1111-4111-8111-000000000000'

  // A ledger long enough to span multiple 200-row pages, with topups mixed in
  // that must be excluded from the commission total.
  const LEDGER_SIZE = 500
  const COMMISSION_AMOUNT = 1000
  const TOPUP_AMOUNT = 7000
  const isTopup = (i: number) => i % 5 === 0
  const EXPECTED_COMMISSION_TOTAL =
    Array.from({ length: LEDGER_SIZE }, (_, i) => i).filter((i) => !isTopup(i)).length *
    COMMISSION_AMOUNT

  function seedLedger() {
    const all = Array.from({ length: LEDGER_SIZE }, (_, i) => ({
      id: `eeeeeeee-1111-4111-8111-${String(i).padStart(12, '0')}`,
      resellerId: RESELLER_ID,
      type: isTopup(i) ? 'topup' : 'commission',
      amount: isTopup(i) ? TOPUP_AMOUNT : COMMISSION_AMOUNT,
      note: '',
      balanceAfter: 0,
      at: '2026-01-01T00:00:00.000Z',
    }))
    server.use(
      http.get('*/api/resellers/:id/ledger', ({ request }) => {
        const url = new URL(request.url)
        const limit = Number(url.searchParams.get('limit') ?? String(LEDGER_SIZE))
        const offset = Number(url.searchParams.get('offset') ?? '0')
        return HttpResponse.json({ items: all.slice(offset, offset + limit), total: all.length })
      }),
    )
  }

  it('sums every commission entry across all ledger pages, not just the first 200', async () => {
    seedLedger()

    const { result } = renderHook(() => useResellerCommissionTotal(RESELLER_ID), {
      wrapper: TestProviders,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // A truncated first-page (200-row) sum would be far below this.
    expect(result.current.data).toBe(EXPECTED_COMMISSION_TOTAL)
  })
})
