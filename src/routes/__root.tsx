import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { UserMenu, useIsAuthenticated } from '@/features/auth'

type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const isAuthed = useIsAuthenticated()

  return (
    <div className="min-h-full">
      <header className="border-b bg-card">
        <nav className="mx-auto flex max-w-6xl items-center gap-6 p-4">
          <Link to="/" className="font-semibold">
            Clinic Controller
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground [&.active]:text-foreground"
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          {isAuthed ? (
            <Link
              to="/tenants"
              className="text-sm text-muted-foreground hover:text-foreground [&.active]:text-foreground"
            >
              Tenants
            </Link>
          ) : null}
          <div className="ml-auto">
            {isAuthed ? (
              <UserMenu />
            ) : (
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
