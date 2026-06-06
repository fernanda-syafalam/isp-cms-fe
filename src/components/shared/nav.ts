import {
  ActivityIcon,
  BarChart3Icon,
  BookTextIcon,
  BoxesIcon,
  Building2Icon,
  CpuIcon,
  GaugeIcon,
  HandCoinsIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MapPinIcon,
  MessageCircleIcon,
  NetworkIcon,
  PackageIcon,
  ReceiptTextIcon,
  RouteIcon,
  RouterIcon,
  ScrollTextIcon,
  ServerIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SmilePlusIcon,
  SmartphoneIcon,
  SplitIcon,
  StoreIcon,
  TargetIcon,
  TicketIcon,
  UsersIcon,
  WalletIcon,
  WrenchIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'

import type { Role } from '@/lib/permissions'

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
    items: [
      { to: '/', label: 'Dasbor', icon: LayoutDashboardIcon, exact: true },
      { to: '/setup', label: 'Panduan Setup', icon: RouteIcon },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { to: '/leads', label: 'Prospek', icon: TargetIcon },
      { to: '/customers', label: 'Pelanggan', icon: UsersIcon },
      { to: '/plans', label: 'Paket Layanan', icon: PackageIcon },
      { to: '/invoices', label: 'Tagihan', icon: ReceiptTextIcon },
      { to: '/payments', label: 'Pembayaran', icon: WalletIcon },
      { to: '/sla-credits', label: 'Kredit SLA', icon: HandCoinsIcon },
      { to: '/vouchers', label: 'Voucher', icon: TicketIcon },
      { to: '/tickets', label: 'Tiket', icon: LifeBuoyIcon },
      { to: '/resellers', label: 'Reseller', icon: StoreIcon },
      { to: '/portal', label: 'Portal Pelanggan', icon: SmartphoneIcon },
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
      { to: '/network/usage', label: 'Pemakaian & FUP', icon: ActivityIcon },
      { to: '/network/monitoring', label: 'Monitoring NOC', icon: GaugeIcon },
      { to: '/network/ftth', label: 'FTTH / ODP', icon: SplitIcon },
      { to: '/network/acs', label: 'ONU (TR-069)', icon: CpuIcon },
      { to: '/coverage', label: 'Cakupan', icon: MapPinIcon },
    ],
  },
  {
    label: 'Analitik',
    items: [
      { to: '/reports', label: 'Laporan', icon: BarChart3Icon },
      { to: '/satisfaction', label: 'Kepuasan & Churn', icon: SmilePlusIcon },
      { to: '/accounting', label: 'Akuntansi (GL)', icon: BookTextIcon },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/staff', label: 'Staf', icon: ShieldCheckIcon },
      { to: '/branches', label: 'Cabang', icon: Building2Icon },
      { to: '/notifications', label: 'Notifikasi WA', icon: MessageCircleIcon },
      { to: '/security', label: 'Keamanan', icon: KeyRoundIcon },
      { to: '/audit', label: 'Log Audit', icon: ScrollTextIcon },
      { to: '/settings', label: 'Pengaturan', icon: SettingsIcon },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

// Roles with a restricted workspace see only these routes; admin/staff (omitted)
// see the full navigation.
const ROLE_ROUTES: Partial<Record<Role, string[]>> = {
  teknisi: [
    '/work-orders',
    '/tickets',
    '/customers',
    '/network/topology',
    '/network/devices',
    '/network/acs',
    '/network/monitoring',
  ],
  mitra: ['/resellers', '/customers', '/leads'],
  customer: ['/portal'],
}

// Where each restricted role lands instead of the ops dashboard. admin/staff
// (omitted) stay on the dashboard at "/".
export const ROLE_HOME: Partial<Record<Role, string>> = {
  teknisi: '/work-orders',
  mitra: '/resellers',
  customer: '/portal',
}

// Navigation groups visible to a role (empty groups dropped).
export function navGroupsForRole(role: Role): NavGroup[] {
  const allow = ROLE_ROUTES[role]
  if (!allow) return NAV_GROUPS
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => allow.includes(item.to)),
  })).filter((group) => group.items.length > 0)
}

// Flat nav items visible to a role (for the ⌘K command menu).
export function navItemsForRole(role: Role): NavItem[] {
  return navGroupsForRole(role).flatMap((g) => g.items)
}
