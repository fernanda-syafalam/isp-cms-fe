import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpResponse, delay, http } from 'msw'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'

import { server } from '@/test/msw/server'
import { TestProviders, resetAuthStore } from '@/test/helpers'
import { useAuthStore } from '@/features/auth/store/authStore'

import { RoleGuard } from './RoleGuard'

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
})

afterEach(() => {
  resetAuthStore()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function renderAt(path: string) {
  const rootRoute = createRootRoute()
  const guard = createRoute({ getParentRoute: () => rootRoute, id: '_auth', component: RoleGuard })
  const staff = createRoute({
    getParentRoute: () => guard,
    path: '/staff',
    component: () => <p>staff page</p>,
  })
  const home = createRoute({
    getParentRoute: () => guard,
    path: '/',
    component: () => <p>home page</p>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([guard.addChildren([staff, home])]),
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(
    <TestProviders>
      <RouterProvider router={router} />
    </TestProviders>,
  )
  return router
}

function meReturns(role: 'admin' | 'staff') {
  server.use(
    http.get('*/api/auth/me', () =>
      HttpResponse.json({
        id: '99999999-9999-4999-8999-999999999999',
        email: 'u@example.com',
        fullName: 'Test User',
        role,
        resellerId: null,
      }),
    ),
  )
}

describe('RoleGuard', () => {
  it('waits for /auth/me instead of redirecting, rendering the loading fallback', async () => {
    vi.stubEnv('DEV', false)
    useAuthStore.setState({ accessToken: 'token' })
    server.use(
      http.get('*/api/auth/me', async () => {
        await delay('infinite')
        return HttpResponse.json({})
      }),
    )

    const router = renderAt('/staff')

    expect(await screen.findByText('Memuat halaman…')).toBeTruthy()
    expect(router.state.location.pathname).toBe('/staff')
    expect(screen.queryByText('staff page')).toBeNull()
  })

  it('renders the outlet for a resolved admin on an admin-only route', async () => {
    vi.stubEnv('DEV', false)
    useAuthStore.setState({ accessToken: 'token' })
    meReturns('admin')

    const router = renderAt('/staff')

    expect(await screen.findByText('staff page')).toBeTruthy()
    expect(router.state.location.pathname).toBe('/staff')
  })

  it('redirects a resolved staff user away from an admin-only route', async () => {
    vi.stubEnv('DEV', false)
    useAuthStore.setState({ accessToken: 'token' })
    meReturns('staff')

    const router = renderAt('/staff')

    expect(await screen.findByText('home page')).toBeTruthy()
    expect(router.state.location.pathname).toBe('/')
  })
})
