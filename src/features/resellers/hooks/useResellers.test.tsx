import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/helpers'

import { useResellersList } from './useResellers'

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
