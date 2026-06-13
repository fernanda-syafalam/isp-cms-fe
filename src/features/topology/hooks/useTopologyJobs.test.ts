import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/helpers'

import { useTopologyJobs } from './useTopologyJobs'

describe('useTopologyJobs', () => {
  it('indexes open work orders and tickets by customer', async () => {
    const { result } = renderHook(() => useTopologyJobs(null), {
      wrapper: TestProviders,
    })

    await waitFor(() => expect(result.current.openCount).toBeGreaterThan(0))
    // A null technician name matches nobody.
    expect(result.current.myCount).toBe(0)
  })

  it('flags the current technician jobs as a subset of all open jobs', async () => {
    const { result } = renderHook(() => useTopologyJobs('Teknisi Budi'), {
      wrapper: TestProviders,
    })

    await waitFor(() => expect(result.current.openCount).toBeGreaterThan(0))
    expect(result.current.myCount).toBeGreaterThan(0)
    for (const id of result.current.myJobCustomerIds) {
      expect(result.current.jobCustomerIds.has(id)).toBe(true)
    }
  })
})
