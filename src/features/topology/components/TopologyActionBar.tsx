import { BriefcaseIcon, CableIcon, DownloadIcon, FlameIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { NetworkTopology } from '../hooks/useNetworkTopology'

// The secondary action toolbar under the controls: my-jobs scope, fault-heat
// toggle, install placement, add cable, and CSV export. Only the affordances
// the data/role allow are shown.
export function TopologyActionBar({ toolbar }: { toolbar: NetworkTopology['toolbar'] }) {
  const { jobs, heat, install } = toolbar
  return (
    <div className="flex flex-wrap items-center gap-2">
      {jobs.count > 0 ? (
        <Button
          variant={jobs.only ? 'default' : 'outline'}
          size="sm"
          className="h-9"
          onClick={jobs.onToggle}
        >
          <BriefcaseIcon className="size-4" />
          {jobs.only ? 'Tampilkan semua' : `Pekerjaan saya (${jobs.count})`}
        </Button>
      ) : null}
      {heat.count > 0 ? (
        <Button
          variant={heat.show ? 'secondary' : 'outline'}
          size="sm"
          className="h-9"
          aria-pressed={heat.show}
          onClick={heat.onToggle}
        >
          <FlameIcon className="size-4" />
          Sebaran gangguan
        </Button>
      ) : null}
      {install.canEdit ? (
        <Button
          variant={install.mode ? 'secondary' : 'default'}
          size="sm"
          className="h-9"
          aria-pressed={install.mode}
          onClick={install.onToggle}
        >
          <PlusIcon className="size-4" />
          {install.mode ? 'Klik peta…' : 'Pasang pelanggan'}
        </Button>
      ) : null}
      {install.canEdit ? (
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          disabled={toolbar.nodeCount === 0}
          onClick={toolbar.onAddCable}
        >
          <CableIcon className="size-4" />
          Tambah kabel
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        className="h-9"
        disabled={toolbar.exportDisabled}
        onClick={toolbar.onExport}
      >
        <DownloadIcon className="size-4" />
        Ekspor CSV
      </Button>
    </div>
  )
}
