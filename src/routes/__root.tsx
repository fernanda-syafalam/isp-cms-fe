import type { QueryClient } from '@tanstack/react-query'
import { Link, Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router'
import { Building2Icon, MenuIcon } from 'lucide-react'

import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { CommandMenu } from '@/components/shared/command-menu'
import { type NavItem, NAV_GROUPS } from '@/components/shared/nav'
import { Reveal } from '@/components/shared/reveal'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
            <Reveal key={pathname}>
              <Outlet />
            </Reveal>
          </div>
        </main>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Building2Icon className="size-4" />
      </span>
      <span>ISP CMS</span>
    </Link>
  )
}

function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-sidebar-border border-r bg-sidebar md:flex">
      <div className="flex h-16 items-center border-sidebar-border border-b px-6">
        <Brand />
      </div>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 font-medium text-[11px] text-muted-foreground/70 uppercase tracking-wider">
              {group.label}
            </p>
            {group.items.map((item) => (
              <SidebarLink key={item.to} item={item} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

const SIDEBAR_LINK_CLASS =
  'relative flex items-center gap-3 rounded-md px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-sidebar-accent hover:text-foreground [&.active]:bg-sidebar-accent [&.active]:text-foreground [&.active>svg]:text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:opacity-0 before:transition-opacity [&.active]:before:opacity-100'

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.exact ?? false }}
      className={SIDEBAR_LINK_CLASS}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  )
}

function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-border border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <MobileNav />
      <div className="md:hidden">
        <Brand />
      </div>
      <div className="hidden md:block">
        <Breadcrumbs />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <CommandMenu />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}

function MobileNav() {
  return (
    <div className="md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Buka navigasi">
            <MenuIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {group.label}
              </DropdownMenuLabel>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to} className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
