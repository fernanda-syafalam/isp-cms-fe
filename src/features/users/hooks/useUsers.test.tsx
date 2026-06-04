import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/helpers'

import { useCreateUser, useUsersList } from './useUsers'

describe('useUsersList', () => {
  it('loads the first page of users from the API', async () => {
    const { result } = renderHook(() => useUsersList({ limit: 10 }), {
      wrapper: TestProviders,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(10)
    // 12 fixtures, page size 10 -> a second page exists.
    expect(result.current.data?.nextCursor).not.toBeNull()
  })
})

describe('useCreateUser', () => {
  it('creates a user and returns the parsed record', async () => {
    const { result } = renderHook(() => useCreateUser(), {
      wrapper: TestProviders,
    })

    result.current.mutate({
      email: 'new@example.com',
      fullName: 'New Person',
      password: 'a-very-long-password',
      role: 'staff',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.email).toBe('new@example.com')
    expect(result.current.data?.role).toBe('staff')
  })
})
