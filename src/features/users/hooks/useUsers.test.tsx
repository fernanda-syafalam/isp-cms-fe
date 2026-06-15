import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { listUsers } from '@/api/users'
import { TestProviders } from '@/test/helpers'

import { useCreateUser, useUpdateUser, useUsersList } from './useUsers'

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

describe('useUpdateUser', () => {
  it("changes an existing staff member's name and role", async () => {
    const target = (await listUsers({ limit: 1 })).items[0]
    if (!target) throw new Error('seed has no users')

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: TestProviders,
    })
    result.current.mutate({
      id: target.id,
      input: { fullName: 'Renamed Staff', role: 'admin' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.fullName).toBe('Renamed Staff')
    expect(result.current.data?.role).toBe('admin')

    const after = (await listUsers({ limit: 100 })).items.find((u) => u.id === target.id)
    expect(after?.fullName).toBe('Renamed Staff')
  })
})
