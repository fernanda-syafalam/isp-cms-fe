import { ActivityIcon, ClipboardListIcon, GaugeIcon, TriangleAlertIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import type { NetworkNode } from '@/schemas/topology'

type Props = {
  nodes: NetworkNode[]
  downCount: number
  openJobsCount: number
}

// At-a-glance health for NOC + field prioritization. The down and ODP cards
// deep-link to the matching filtered map (URL state from PR1); the RX and jobs
// cards are informational.
export function TopologyKpiStrip({ nodes, downCount, openJobsCount }: Props) {
  let odpFull = 0
  let worstRx: number | null = null
  for (const n of nodes) {
    const m = n.meta
    if (n.type === 'odp' && m?.portsTotal && (m.portsUsed ?? 0) / m.portsTotal >= 0.9) odpFull++
    if (typeof m?.rxPowerDbm === 'number') {
      worstRx = worstRx === null ? m.rxPowerDbm : Math.min(worstRx, m.rxPowerDbm)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="Node down"
        value={downCount}
        icon={TriangleAlertIcon}
        accent={downCount > 0 ? 'amber' : 'primary'}
        hint="Fokuskan peta"
        to="/network/topology"
        search={{ status: 'down' }}
      />
      <KpiCard
        label="ODP hampir penuh"
        value={odpFull}
        icon={GaugeIcon}
        accent={odpFull > 0 ? 'amber' : 'primary'}
        hint="≥ 90% port terpakai"
        to="/network/topology"
        search={{ type: 'odp' }}
      />
      <KpiCard
        label="Redaman terburuk"
        value={worstRx === null ? '—' : `${worstRx} dBm`}
        icon={ActivityIcon}
        accent={worstRx !== null && worstRx <= -27 ? 'amber' : 'primary'}
        hint="RX power minimum"
      />
      <KpiCard
        label="Pekerjaan terbuka"
        value={openJobsCount}
        icon={ClipboardListIcon}
        hint="WO & tiket aktif"
      />
    </div>
  )
}
