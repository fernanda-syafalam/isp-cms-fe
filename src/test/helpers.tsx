import type { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render, type RenderOptions } from '@testing-library/react'

import { useAuthStore } from '@/features/auth/store/authStore'
import { UserSchema, type User } from '@/schemas/auth'

// Single source of truth for the user fixture used across tests.
// Parsed through Zod so it stays consistent with the contract.
export const TEST_USER: User = UserSchema.parse({
  id: '99999999-9999-4999-8999-999999999999',
  email: 'admin@example.com',
  fullName: 'Test Admin',
  role: 'admin',
})

// Each test gets a fresh QueryClient so cache state cannot leak across tests.
// Disable retries to keep failure tests deterministic and fast.
export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

type ProviderProps = {
  children: ReactNode
  queryClient?: QueryClient | undefined
}

export function TestProviders({ children, queryClient }: ProviderProps) {
  const client = queryClient ?? makeTestQueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  queryClient?: QueryClient
}

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { queryClient, ...rest } = options
  return render(ui, {
    wrapper: ({ children }) => <TestProviders queryClient={queryClient}>{children}</TestProviders>,
    ...rest,
  })
}

// Reset auth store between tests — Zustand stores live for the test process,
// so leaving stale state in there causes cross-test pollution.
export function resetAuthStore(): void {
  useAuthStore.setState({ accessToken: null, user: null })
}

type RenderWithRouterOptions = {
  // Which portal URL the memory history starts at — selects which registered
  // route renders the component under test.
  initialPath?: string
  queryClient?: QueryClient
}

// Render a component that uses <Link>/router hooks inside a real (in-memory)
// TanStack Router. Registers the portal navigation targets so Link can resolve
// hrefs; the component under test mounts at `initialPath` (default '/portal').
export function renderWithRouter(ui: ReactElement, options: RenderWithRouterOptions = {}) {
  const { initialPath = '/portal', queryClient } = options
  const atPortal = initialPath === '/portal'
  const rootRoute = createRootRoute()
  const portalRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/portal',
    component: () => (atPortal ? ui : null),
  })
  const printRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/portal/invoices/$invoiceId/print',
    component: () => (atPortal ? null : ui),
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([portalRoute, printRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  return render(<RouterProvider router={router} />, {
    wrapper: ({ children }) => <TestProviders queryClient={queryClient}>{children}</TestProviders>,
  })
}
