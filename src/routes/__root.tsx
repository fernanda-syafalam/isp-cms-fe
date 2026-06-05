import type { QueryClient } from '@tanstack/react-query'
import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import {
  BarChart3Icon,
  Building2Icon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MapPinIcon,
  MenuIcon,
  PackageIcon,
  ReceiptTextIcon,
  RouterIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'

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

type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  exact?: boolean
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Ringkasan',
    items: [{ to: '/', label: 'Dasbor', icon: LayoutDashboardIcon, exact: true }],
  },
  {
    label: 'Operasional',
    items: [
      { to: '/customers', label: 'Pelanggan', icon: UsersIcon },
      { to: '/plans', label: 'Paket Layanan', icon: PackageIcon },
      { to: '/invoices', label: 'Tagihan', icon: ReceiptTextIcon },
      { to: '/tickets', label: 'Tiket', icon: LifeBuoyIcon },
    ],
  },
  {
    label: 'Jaringan',
    items: [
      { to: '/network/devices', label: 'Perangkat', icon: RouterIcon },
      { to: '/coverage', label: 'Cakupan', icon: MapPinIcon },
    ],
  },
  {
    label: 'Analitik',
    items: [{ to: '/reports', label: 'Laporan', icon: BarChart3Icon }],
  },
  {
    label: 'Admin',
    items: [{ to: '/staff', label: 'Staf', icon: ShieldCheckIcon }],
  },
]

function RootLayout() {
  const isAuthed = useIsAuthenticated()

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
      <span>ISP CMS</span>
    </Link>
  )
}

function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-border border-r bg-card md:flex">
      <div className="flex h-16 items-center border-border border-b px-6">
        <Brand />
      </div>
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
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

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.exact ?? false }}
      className="flex items-center gap-3 rounded-md px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground [&.active]:bg-primary/10 [&.active]:font-semibold [&.active]:text-primary"
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  )
}

function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-border border-b bg-background/80 px-4 backdrop-blur md:px-8">
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
