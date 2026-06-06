import {
  BarChart3Icon,
  BoxesIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MapPinIcon,
  NetworkIcon,
  PackageIcon,
  ReceiptTextIcon,
  RouterIcon,
  ServerIcon,
  ShieldCheckIcon,
  StoreIcon,
  TicketIcon,
  UsersIcon,
  WalletIcon,
  WrenchIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  exact?: boolean
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

// Single source of truth for primary navigation — consumed by the sidebar,
// the mobile nav, the breadcrumb, and the ⌘K command menu.
export const NAV_GROUPS: NavGroup[] = [
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
      { to: '/payments', label: 'Pembayaran', icon: WalletIcon },
      { to: '/vouchers', label: 'Voucher', icon: TicketIcon },
      { to: '/tickets', label: 'Tiket', icon: LifeBuoyIcon },
      { to: '/resellers', label: 'Reseller', icon: StoreIcon },
    ],
  },
  {
    label: 'Lapangan',
    items: [
      { to: '/work-orders', label: 'Work Order', icon: WrenchIcon },
      { to: '/inventory', label: 'Inventaris', icon: BoxesIcon },
    ],
  },
  {
    label: 'Jaringan',
    items: [
      { to: '/network/topology', label: 'Topologi', icon: NetworkIcon },
      { to: '/network/devices', label: 'Perangkat', icon: RouterIcon },
      { to: '/network/routers', label: 'Router (Mikrotik)', icon: ServerIcon },
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

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)
