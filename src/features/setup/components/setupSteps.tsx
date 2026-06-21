import { PlugZapIcon, RouteIcon, ServerIcon, UserPlusIcon, WrenchIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { formatNumber } from '@/lib/format'

export type Step = {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  status: string
  done: boolean
  cta: { to: string; label: string }
}

type Counts = {
  routerCount: number
  installing: number
  active: number
  scheduledInstalls: number
  completedInstalls: number
}

// The five-step launch flow, with live status text derived from the data so a
// demo can run "set up Mikrotik → win a customer" end-to-end in order.
export function buildSteps({
  routerCount,
  installing,
  active,
  scheduledInstalls,
  completedInstalls,
}: Counts): Step[] {
  return [
    {
      icon: PlugZapIcon,
      title: '1. Hubungkan router Mikrotik',
      description: 'Sambungkan RouterOS via API (uji koneksi → identity/model/versi) lalu simpan.',
      status: `${formatNumber(routerCount)} router terhubung`,
      done: routerCount > 0,
      cta: { to: '/network/routers', label: 'Kelola router' },
    },
    {
      icon: ServerIcon,
      title: '2. Siapkan profil & IP pool',
      description: 'Profil PPPoE (rate-limit per paket) + IP pool sebagai dasar provisioning.',
      status: 'Profil per paket siap',
      done: routerCount > 0,
      cta: { to: '/network/routers', label: 'Buka detail router' },
    },
    {
      icon: UserPlusIcon,
      title: '3. Onboarding pelanggan',
      description:
        'Daftar pelanggan, pilih paket, tandai titik lokasi di peta, jadwalkan instalasi.',
      status: `${formatNumber(installing)} dalam proses instalasi`,
      done: installing > 0 || active > 0,
      cta: { to: '/customers/onboarding', label: 'Mulai onboarding' },
    },
    {
      icon: WrenchIcon,
      title: '4. Selesaikan instalasi (Work Order)',
      description:
        'Teknisi menyelesaikan WO: pelanggan aktif, ONU dari gudang dipasang, secret PPPoE dibuat.',
      status: `${formatNumber(completedInstalls)} selesai · ${formatNumber(scheduledInstalls)} terjadwal`,
      done: completedInstalls > 0,
      cta: { to: '/work-orders', label: 'Buka work order' },
    },
    {
      icon: RouteIcon,
      title: '5. Pelanggan aktif & tertagih',
      description: 'Pelanggan muncul di topologi (hijau), tagihan pertama terbit, siap ditagih.',
      status: `${formatNumber(active)} pelanggan aktif`,
      done: active > 0,
      cta: { to: '/customers', label: 'Lihat pelanggan' },
    },
  ]
}
