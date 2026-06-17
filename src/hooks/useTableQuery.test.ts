import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTableQuery } from './useTableQuery'

describe('useTableQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('derives limit/offset from the page state', () => {
    const { result } = renderHook(() => useTableQuery({ pageSize: 20 }))
    expect(result.current.params).toMatchObject({
      limit: 20,
      offset: 0,
      q: undefined,
      sort: undefined,
      order: undefined,
    })

    act(() => result.current.onPaginationChange({ pageIndex: 2, pageSize: 20 }))
    expect(result.current.params).toMatchObject({ limit: 20, offset: 40 })
  })

  it('debounces search and resets to the first page immediately', () => {
    const { result } = renderHook(() => useTableQuery({ pageSize: 10, searchDelayMs: 300 }))
    act(() => result.current.onPaginationChange({ pageIndex: 3, pageSize: 10 }))
    expect(result.current.pageIndex).toBe(3)

    act(() => result.current.onSearchChange('budi'))
    // Page resets at once; the query term is still debounced.
    expect(result.current.pageIndex).toBe(0)
    expect(result.current.params.q).toBeUndefined()

    act(() => vi.advanceTimersByTime(300))
    expect(result.current.params).toMatchObject({ q: 'budi', offset: 0 })
  })

  it('maps the first sort column to sort/order and resets the page', () => {
    const { result } = renderHook(() => useTableQuery())
    act(() => result.current.onPaginationChange({ pageIndex: 2, pageSize: 20 }))
    act(() => result.current.onSortingChange([{ id: 'fullName', desc: true }]))

    expect(result.current.pageIndex).toBe(0)
    expect(result.current.params).toMatchObject({
      sort: 'fullName',
      order: 'desc',
    })
  })

  it('resets to the first page when the page size changes', () => {
    const { result } = renderHook(() => useTableQuery({ pageSize: 10 }))
    act(() => result.current.onPaginationChange({ pageIndex: 4, pageSize: 10 }))
    act(() => result.current.onPaginationChange({ pageIndex: 4, pageSize: 50 }))

    expect(result.current.pageIndex).toBe(0)
    expect(result.current.params).toMatchObject({ limit: 50, offset: 0 })
  })
})
