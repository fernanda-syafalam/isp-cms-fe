import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import { AppSidebar } from '@/components/shared/app-sidebar'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { CommandMenu } from '@/components/shared/command-menu'
import { Reveal } from '@/components/shared/reveal'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { UserMenu, useIsAuthenticated } from '@/features/auth'

type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const isAuthed = useIsAuthenticated()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

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
          <Separator orientation="vertical" className="mr-1 h-4" />
          <Breadcrumbs />
          <div className="ml-auto flex items-center gap-2">
            <CommandMenu />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 outline-none md:p-6">
          <Reveal key={pathname}>
            <Outlet />
          </Reveal>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
