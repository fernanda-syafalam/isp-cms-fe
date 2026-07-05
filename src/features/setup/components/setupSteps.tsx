import {
  Building2Icon,
  PackageIcon,
  RouteIcon,
  ServerIcon,
  SettingsIcon,
  UserPlusIcon,
  UsersIcon,
  WrenchIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'

import { formatNumber } from '@/lib/format'
import type { SetupStatus } from '@/schemas/setup'

export type Step = {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  status: string
  done: boolean
  cta: { to: string; label: string }
}

// The eight-step launch flow (docs/FLOWS.md §3.1 order). Every `done` comes from
// the server flag — never faked from a proxy signal — and the status subtext is
// the honest per-step count so the operator sees exactly what is still missing.
export function buildSteps(status: SetupStatus): Step[] {
  const { catalogue, network, branches, settings, staff, onboarding, workOrders, active } = status
  return [
    {
      icon: PackageIcon,
      title: '1. Susun katalog paket',
      description: 'Buat paket layanan (kecepatan, harga, profil rate-limit) sebagai dasar jualan.',
      status: `${formatNumber(catalogue.plansCount)} paket`,
      done: catalogue.done,
      cta: { to: '/plans', label: 'Kelola paket' },
    },
    {
      icon: ServerIcon,
      title: '2. Siapkan jaringan',
      description:
        'Hubungkan router Mikrotik lalu siapkan profil PPPoE dan IP pool untuk provisioning.',
      status: `${formatNumber(network.routersCount)} router, ${formatNumber(network.profilesCount)} profil, ${formatNumber(network.poolsCount)} pool`,
      done: network.done,
      cta: { to: '/network/routers', label: 'Kelola router' },
    },
    {
      icon: Building2Icon,
      title: '3. Daftarkan cabang',
      description: 'Tambahkan cabang/POP sebagai unit operasional dan lokasi layanan.',
      status: `${formatNumber(branches.branchesCount)} cabang`,
      done: branches.done,
      cta: { to: '/branches', label: 'Kelola cabang' },
    },
    {
      icon: SettingsIcon,
      title: '4. Lengkapi profil perusahaan',
      description:
        'Isi identitas perusahaan (nama, alamat, pajak) untuk penagihan dan dokumen resmi.',
      status: settings.companyName
        ? `Perusahaan: ${settings.companyName}`
        : 'Nama perusahaan belum diisi',
      done: settings.done,
      cta: { to: '/settings', label: 'Buka pengaturan' },
    },
    {
      icon: UsersIcon,
      title: '5. Undang tim',
      description: 'Tambahkan staf (operasional, billing, NOC) beserta perannya masing-masing.',
      status: `${formatNumber(staff.staffCount)} anggota tim`,
      done: staff.done,
      cta: { to: '/staff', label: 'Kelola tim' },
    },
    {
      icon: UserPlusIcon,
      title: '6. Onboarding pelanggan',
      description: 'Daftarkan pelanggan, pilih paket, tandai lokasi di peta, jadwalkan instalasi.',
      status: `${formatNumber(onboarding.instalasiCount)} instalasi, ${formatNumber(onboarding.aktifCount)} aktif`,
      done: onboarding.done,
      cta: { to: '/customers/onboarding', label: 'Mulai onboarding' },
    },
    {
      icon: WrenchIcon,
      title: '7. Selesaikan instalasi (Work Order)',
      description: 'Teknisi menuntaskan WO: pelanggan aktif, ONU terpasang, secret PPPoE dibuat.',
      status: `${formatNumber(workOrders.installDoneCount)} instalasi selesai`,
      done: workOrders.done,
      cta: { to: '/work-orders', label: 'Buka work order' },
    },
    {
      icon: RouteIcon,
      title: '8. Pelanggan aktif & tertagih',
      description: 'Pelanggan tampil di topologi (hijau), tagihan pertama terbit, siap ditagih.',
      status: `${formatNumber(active.activeCount)} pelanggan aktif`,
      done: active.done,
      cta: { to: '/customers', label: 'Lihat pelanggan' },
    },
  ]
}
