import { afterEach, describe, expect, it } from 'vitest'
import { HttpResponse, http } from 'msw'
import { act, renderHook, waitFor } from '@testing-library/react'

import { TEST_USER, TestProviders, makeTestQueryClient, resetAuthStore } from '@/test/helpers'
import { server } from '@/test/msw/server'
import { useAuthStore } from '@/features/auth/store/authStore'

import { useCurrentUser, useIsAuthenticated, useLogin, useLogout } from './useAuth'

afterEach(() => {
  resetAuthStore()
})

describe('useLogin', () => {
  it('persists the session in the store on success', async () => {
    const queryClient = makeTestQueryClient()
    const { result } = renderHook(() => useLogin(), {
      wrapper: ({ children }) => (
        <TestProviders queryClient={queryClient}>{children}</TestProviders>
      ),
    })

    await result.current.mutateAsync({
      email: 'a@b.test',
      password: 'super-secret',
    })

    expect(useAuthStore.getState().accessToken).toBe('test-access-token')
    expect(queryClient.getQueryData(['auth', 'me'])).toMatchObject({
      email: 'admin@example.com',
    })
  })

  it('does not persist anything when the server rejects', async () => {
    server.use(http.post('*/api/auth/login', () => HttpResponse.json({}, { status: 401 })))

    const { result } = renderHook(() => useLogin(), {
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    })

    await expect(
      result.current.mutateAsync({
        email: 'a@b.test',
        password: 'super-secret',
      }),
    ).rejects.toThrow()

    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})

describe('useLogout', () => {
  it('clears the store and the query cache', async () => {
    const queryClient = makeTestQueryClient()
    queryClient.setQueryData(['customers', 'list', {}], {
      items: [],
      total: 0,
    })
    useAuthStore.setState({
      accessToken: 'token',
      user: TEST_USER,
    })

    const { result } = renderHook(() => useLogout(), {
      wrapper: ({ children }) => (
        <TestProviders queryClient={queryClient}>{children}</TestProviders>
      ),
    })

    await result.current.mutateAsync()

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(queryClient.getQueryData(['customers', 'list', {}])).toBeUndefined()
  })

  it('still clears local state when the server logout call fails', async () => {
    server.use(http.post('*/api/auth/logout', () => HttpResponse.json({}, { status: 500 })))
    useAuthStore.setState({
      accessToken: 'token',
      user: TEST_USER,
    })

    const { result } = renderHook(() => useLogout(), {
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    })

    await result.current.mutateAsync().catch(() => {
      // ignore — onSettled clears local state regardless
    })

    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})

describe('useIsAuthenticated and useCurrentUser', () => {
  it('useIsAuthenticated reflects the access token', () => {
    const { result, rerender } = renderHook(() => useIsAuthenticated(), {
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    })
    expect(result.current).toBe(false)

    act(() => {
      useAuthStore.setState({ accessToken: 'token' })
    })
    rerender()
    expect(result.current).toBe(true)
  })

  it('useCurrentUser is disabled until a token exists', async () => {
    const { result, rerender } = renderHook(() => useCurrentUser(), {
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    })

    expect(result.current.fetchStatus).toBe('idle')

    act(() => {
      useAuthStore.setState({ accessToken: 'token' })
    })
    rerender()

    await waitFor(() => {
      expect(result.current.data?.email).toBe('admin@example.com')
    })
  })
})
