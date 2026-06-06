import {
  ActivityIcon,
  BarChart3Icon,
  BoxesIcon,
  CpuIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MapPinIcon,
  MessageCircleIcon,
  NetworkIcon,
  PackageIcon,
  ReceiptTextIcon,
  RouterIcon,
  ScrollTextIcon,
  ServerIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SplitIcon,
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
    items: [{ to: '/reports', label: 'Laporan', icon: BarChart3Icon }],
  },
  {
    label: 'Admin',
    items: [
      { to: '/staff', label: 'Staf', icon: ShieldCheckIcon },
      { to: '/notifications', label: 'Notifikasi WA', icon: MessageCircleIcon },
      { to: '/audit', label: 'Log Audit', icon: ScrollTextIcon },
      { to: '/settings', label: 'Pengaturan', icon: SettingsIcon },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)
