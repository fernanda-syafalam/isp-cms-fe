import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/helpers'

import { useCables, useSplitters } from './useCabling'

describe('useCabling', () => {
  it('loads the splitters derived from the topology seed (one per ODC/ODP)', async () => {
    const { result } = renderHook(() => useSplitters(), {
      wrapper: TestProviders,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // 4 ODC (1:4) + 8 ODP (1:8) = 12 splitters
    expect(result.current.data?.items).toHaveLength(12)
  })

  it('loads the derived drop cables', async () => {
    const { result } = renderHook(() => useCables(), {
      wrapper: TestProviders,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items.length).toBeGreaterThan(0)
    expect(result.current.data?.items.every((c) => c.kind === 'drop')).toBe(true)
  })
})
