import type { QueryClient } from '@tanstack/react-query'
import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { Building2Icon, LayoutDashboardIcon, MenuIcon, UsersIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserMenu, useIsAuthenticated } from '@/features/auth'

type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { to: '/tenants', label: 'Tenants', icon: Building2Icon },
  { to: '/users', label: 'Users', icon: UsersIcon },
]

function RootLayout() {
  const isAuthed = useIsAuthenticated()

  // Unauthenticated routes (login) render full-bleed — just the brand-free
  // canvas with a theme toggle in the corner. The login page owns its layout.
  if (!isAuthed) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <div className="absolute right-4 top-4 z-10">
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
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Building2Icon className="size-4" />
      </span>
      <span>Clinic Controller</span>
    </Link>
  )
}

function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Brand />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>
    </aside>
  )
}

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.to === '/' }}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&.active]:bg-accent [&.active]:text-foreground"
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  )
}

function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
      <MobileNav />
      <div className="md:hidden">
        <Brand />
      </div>
      <div className="ml-auto flex items-center gap-1">
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
          <Button variant="ghost" size="icon" aria-label="Open navigation">
            <MenuIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {NAV_ITEMS.map((item) => {
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
