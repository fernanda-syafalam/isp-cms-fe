import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { TestProviders, resetAuthStore } from '@/test/helpers'
import { useAuthStore } from '@/features/auth/store/authStore'

import { useRoleStore } from '../store/roleStore'
import { useEffectiveRole } from './useRole'

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
