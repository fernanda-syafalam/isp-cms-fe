import { ListTreeIcon, MapIcon, TriangleAlertIcon } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

import { useNetworkTopology } from '../hooks/useNetworkTopology'
import { InstallPlacementHint } from './InstallPlacementHint'
import { TopologyActionBar } from './TopologyActionBar'
import { TopologyControls } from './TopologyControls'
import { TopologyDialogs } from './TopologyDialogs'
import { TopologyFilterSheet } from './TopologyFilterSheet'
import { TopologyKpiStrip } from './TopologyKpiStrip'
import { TopologyStage } from './TopologyStage'

export function NetworkTopologyPage() {
  const t = useNetworkTopology()

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        title="Topologi Jaringan"
        description="Peta infrastruktur OLT → ODC → ODP → Tiang → Pelanggan. Klik node untuk menelusuri jalur uplink."
        actions={
          <div className="inline-flex rounded-md border border-border p-0.5">
            <Button
              variant={t.view === 'map' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 sm:h-7"
              onClick={() => t.setView('map')}
            >
              <MapIcon className="size-4" />
              Peta
            </Button>
            <Button
              variant={t.view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 sm:h-7"
              onClick={() => t.setView('list')}
            >
              <ListTreeIcon className="size-4" />
              Daftar
            </Button>
          </div>
        }
      />

      {!t.isLoading && t.all.length > 0 ? (
        <TopologyKpiStrip nodes={t.all} downCount={t.counts.down} openJobsCount={t.openJobsCount} />
      ) : null}

      <TopologyControls {...t.controlsProps} />
      <TopologyFilterSheet {...t.controlsProps} />

      {t.all.length > 0 ? <TopologyActionBar toolbar={t.toolbar} /> : null}

      {t.isError ? (
        <p className="text-destructive" role="alert">
          Gagal memuat topologi.
        </p>
      ) : null}

      {t.impactedCount > 0 ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm"
          role="alert"
        >
          <TriangleAlertIcon className="size-5 shrink-0 text-destructive" />
          <span className="text-destructive">
            <span className="font-semibold">≈ {t.impactedCount} pelanggan</span> berpotensi
            terdampak gangguan jaringan saat ini.
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-9 sm:h-7"
            onClick={t.onToggleDownFilter}
          >
            {t.statusFilter === 'down' ? 'Tampilkan semua' : 'Fokus node down'}
          </Button>
        </div>
      ) : null}

      {t.installMode ? (
        <InstallPlacementHint
          canUseGps={t.canUseGps}
          onUseGps={t.onUseGps}
          onCancel={t.onCancelInstall}
        />
      ) : null}

      <TopologyStage {...t} />

      <TopologyDialogs {...t} />
    </div>
  )
}
