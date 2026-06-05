import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router'

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
        <div className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          <Reveal key={pathname}>
            <Outlet />
          </Reveal>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
