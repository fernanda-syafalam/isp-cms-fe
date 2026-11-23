import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { useRoleStore } from '@/features/auth'
import { useAuthStore } from '@/features/auth/store/authStore'
import { TEST_USER, makeTestQueryClient, resetAuthStore } from '@/test/helpers'

import { routeTree } from '../routeTree.gen'

afterEach(() => {
  resetAuthStore()
  act(() => useRoleStore.getState().setOverride(null))
})

describe('logout from the no-access screen (real route tree)', () => {
  it('ends on /login and drops the dev role override', async () => {
    const queryClient = makeTestQueryClient()
    act(() => {
      useAuthStore.getState().setSession({ accessToken: 'token', user: TEST_USER })
      useRoleStore.getState().setOverride('mitra')
    })
    const router = createRouter({
      routeTree,
      context: { queryClient },
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    const user = userEvent.setup({ delay: null })
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    await user.click(await screen.findByRole('button', { name: 'Keluar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(useRoleStore.getState().override).toBeNull()
  })
})
