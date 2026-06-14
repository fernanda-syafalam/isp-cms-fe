import { MapPinPlusIcon, PencilIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import type { NetworkNode, NodeStatus, NodeType } from '@/schemas/topology'

import type { TopologyLayer } from '../hooks/useTopologySearch'
import { STATUS_COLOR, STATUS_LABEL } from '../lib/graph'
import { TopologySearchBox } from './TopologySearchBox'

const TYPE_FILTERS: Array<{ value: 'all' | NodeType; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'olt', label: 'OLT' },
  { value: 'odc', label: 'ODC' },
  { value: 'odp', label: 'ODP' },
  { value: 'pole', label: 'Tiang' },
  { value: 'customer', label: 'Pelanggan' },
]
const STATUS_FILTERS: Array<{ value: 'all' | NodeStatus; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'unknown', label: 'Unknown' },
]

export type TopologyControlsProps = {
  nodes: NetworkNode[]
  filters: {
    typeFilter: 'all' | NodeType
    statusFilter: 'all' | NodeStatus
    base: 'map' | 'satellite'
    layer: TopologyLayer
    query: string
  }
  set: {
    type: (v: 'all' | NodeType) => void
    status: (v: 'all' | NodeStatus) => void
    base: (v: 'map' | 'satellite') => void
    layer: (v: TopologyLayer) => void
    query: (v: string) => void
  }
  counts: Record<NodeStatus, number>
  edit: {
    canEdit: boolean
    editMode: boolean
    addMode: boolean
    toggleEdit: () => void
    toggleAdd: () => void
  }
  onPick: (node: NetworkNode) => void
}

// `compact` controls density so the SAME body is small inside the desktop card
// and 44px-tappable inside the mobile filter sheet (independent of viewport, so
// a tablet's sheet still gets large targets).
type Props = TopologyControlsProps & { compact: boolean }

export function TopologyControlsBody({
  nodes,
  filters,
  set,
  counts,
  edit,
  onPick,
  compact,
}: Props) {
  const tap = compact ? 'h-7' : 'h-11'
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <FilterGroup
          label="Status"
          options={STATUS_FILTERS}
          value={filters.statusFilter}
          onChange={set.status}
          compact={compact}
        />
        <FilterGroup
          label="Tipe"
          options={TYPE_FILTERS}
          value={filters.typeFilter}
          onChange={set.type}
          compact={compact}
        />
        <div className="ml-auto flex items-center gap-2">
          {(['up', 'down', 'unknown'] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-sm">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ background: STATUS_COLOR[s] }}
              />
              {STATUS_LABEL[s]}: <span className="font-semibold tabular-nums">{counts[s]}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex overflow-hidden rounded-md border">
          {(['map', 'satellite'] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => set.base(b)}
              className={cn(
                'px-3 text-sm transition-colors',
                compact ? 'py-1' : 'py-2.5',
                filters.base === b ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {b === 'map' ? 'Map' : 'Satelit'}
            </button>
          ))}
        </div>
        <div className="inline-flex overflow-hidden rounded-md border">
          {(['logical', 'physical'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => set.layer(l)}
              className={cn(
                'px-3 text-sm transition-colors',
                compact ? 'py-1' : 'py-2.5',
                filters.layer === l ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {l === 'logical' ? 'Logis' : 'Fisik (kabel)'}
            </button>
          ))}
        </div>
        <TopologySearchBox
          nodes={nodes}
          query={filters.query}
          onQueryChange={set.query}
          onPick={onPick}
        />
        {edit.canEdit ? (
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={edit.editMode ? 'default' : 'outline'}
              className={tap}
              onClick={edit.toggleEdit}
            >
              <PencilIcon className="size-4" />
              {edit.editMode ? 'Mode Edit aktif' : 'Mode Edit'}
            </Button>
            {edit.editMode ? (
              <Button
                type="button"
                size="sm"
                variant={edit.addMode ? 'default' : 'outline'}
                className={tap}
                onClick={edit.toggleAdd}
              >
                <MapPinPlusIcon className="size-4" />
                {edit.addMode ? 'Klik peta…' : 'Tambah node'}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {edit.editMode ? (
        <p className="text-muted-foreground text-xs">
          Geser titik untuk memindahkan posisi
          {edit.addMode ? ' · klik peta untuk menambah node baru' : ''} · klik node lalu Edit/Hapus
          di panel.
        </p>
      ) : null}
    </div>
  )
}

type FilterGroupProps<T extends string> = {
  label: string
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  compact: boolean
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  compact,
}: FilterGroupProps<T>) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground text-sm">{label}:</span>
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="sm"
          variant={value === o.value ? 'default' : 'outline'}
          className={compact ? 'h-7 px-2.5' : 'h-11 px-4'}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}
