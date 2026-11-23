import { QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { TEST_USER, makeTestQueryClient, resetAuthStore } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { useIsAuthenticated } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { AccessUnavailable } from './AccessUnavailable'

// Mirrors __root: the dead-end screen only exists while authenticated, so a
// successful logout unmounts it before any per-call mutation callback could run.
function Shell() {
  return useIsAuthenticated() ? <AccessUnavailable /> : null
}

function renderDeadEnd() {
  const rootRoute = createRootRoute({ component: Shell })
  const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login' })
  const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' })
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute, loginRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  act(() => {
    useAuthStore.getState().setSession({ accessToken: 'token', user: TEST_USER })
  })
  render(
    <QueryClientProvider client={makeTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

afterEach(() => {
  resetAuthStore()
})

describe('AccessUnavailable', () => {
  it('logs out and navigates to /login', async () => {
    const user = userEvent.setup({ delay: null })
    const router = renderDeadEnd()

    await user.click(await screen.findByRole('button', { name: 'Keluar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('still navigates to /login when the logout request fails', async () => {
    server.use(http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 500 })))
    const user = userEvent.setup({ delay: null })
    const router = renderDeadEnd()

    await user.click(await screen.findByRole('button', { name: 'Keluar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})
