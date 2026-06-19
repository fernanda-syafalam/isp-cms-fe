import type { QueryClient } from '@tanstack/react-query'
import { Link, Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router'
import { BellIcon } from 'lucide-react'
import { useEffect } from 'react'

import { AppSidebar } from '@/components/shared/app-sidebar'
import { CommandMenu } from '@/components/shared/command-menu'
import { isRouteAllowed } from '@/components/shared/nav'
import { Reveal } from '@/components/shared/reveal'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useEffectiveRole, useIsAuthenticated } from '@/features/auth'

type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const isAuthed = useIsAuthenticated()
  const role = useEffectiveRole()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // The bell only shows where the notifications route is reachable (admin/staff).
  const canNotify = isRouteAllowed(role, '/notifications')

  // Move focus to the main region on route change so screen-reader + keyboard
  // users land on the new page's content. #main-content only exists when authed,
  // so the optional chain is a harmless no-op on the login screen.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger — re-focus main on each navigation
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [pathname])

  if (!isAuthed) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <Outlet />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:font-medium focus:text-primary-foreground focus:text-sm focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Lewati ke konten utama
      </a>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-border border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          {/* Leading global search (⌘K) mirrors the reference shell; page
              context comes from the PageHeader title + sidebar active state. */}
          <div className="min-w-0 flex-1 sm:max-w-md">
            <CommandMenu />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            {canNotify ? (
              <Button asChild variant="ghost" size="icon" aria-label="Notifikasi">
                <Link to="/notifications">
                  <BellIcon className="size-4" />
                </Link>
              </Button>
            ) : null}
            <ThemeToggle />
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {/* Content width policy: full-bleed up to 2xl, then centered so
              ultra-wide monitors don't stretch tables/forms past readability. */}
          <Reveal key={pathname} className="mx-auto w-full max-w-screen-2xl p-4 md:p-6">
            <Outlet />
          </Reveal>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
