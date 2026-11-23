import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { TestProviders, resetAuthStore } from '@/test/helpers'
import { useAuthStore } from '@/features/auth/store/authStore'

import { useRoleStore } from '../store/roleStore'
import { useEffectiveRole, useRoleStatus } from './useRole'

afterEach(() => {
  resetAuthStore()
  useRoleStore.setState({ override: null })
  vi.unstubAllEnvs()
})

function wrapper({ children }: { children: React.ReactNode }) {
  return <TestProviders>{children}</TestProviders>
}

describe('useEffectiveRole', () => {
  it('ignores the demo role override in a non-dev (production) build', async () => {
    vi.stubEnv('DEV', false)
    // A leftover/forged override must NOT influence the effective role.
    useRoleStore.setState({ override: 'customer' })
    useAuthStore.setState({ accessToken: 'token' })

    const { result } = renderHook(() => useEffectiveRole(), { wrapper })

    // The real user (from /auth/me) is an admin; the override is disregarded.
    await waitFor(() => expect(result.current).toBe('admin'))
  })

  it('applies the demo role override in a dev build', async () => {
    vi.stubEnv('DEV', true)
    useRoleStore.setState({ override: 'customer' })
    useAuthStore.setState({ accessToken: 'token' })

    const { result } = renderHook(() => useEffectiveRole(), { wrapper })

    expect(result.current).toBe('customer')
  })
})

describe('useRoleStatus', () => {
  it('is resolving while /auth/me is pending, then settles with the real role', async () => {
    vi.stubEnv('DEV', false)
    useAuthStore.setState({ accessToken: 'token' })

    const { result } = renderHook(() => useRoleStatus(), { wrapper })

    expect(result.current.isResolving).toBe(true)
    await waitFor(() => expect(result.current.isResolving).toBe(false))
    expect(result.current.role).toBe('admin')
  })

  it('is not resolving with a dev role override', () => {
    vi.stubEnv('DEV', true)
    useRoleStore.setState({ override: 'customer' })
    useAuthStore.setState({ accessToken: 'token' })

    const { result } = renderHook(() => useRoleStatus(), { wrapper })

    expect(result.current).toEqual({ role: 'customer', isResolving: false })
  })

  it('is not resolving when there is no token (query disabled)', () => {
    vi.stubEnv('DEV', false)

    const { result } = renderHook(() => useRoleStatus(), { wrapper })

    expect(result.current.isResolving).toBe(false)
  })
})
