import { MapPinPlusIcon, PencilIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import type { NodeStatus, NodeType } from '@/schemas/topology'

import { STATUS_COLOR, STATUS_LABEL } from '../lib/graph'

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

type Props = {
  filters: {
    typeFilter: 'all' | NodeType
    statusFilter: 'all' | NodeStatus
    base: 'map' | 'satellite'
    query: string
  }
  set: {
    type: (v: 'all' | NodeType) => void
    status: (v: 'all' | NodeStatus) => void
    base: (v: 'map' | 'satellite') => void
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
}

export function TopologyControls({ filters, set, counts, edit }: Props) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <FilterGroup
            label="Status"
            options={STATUS_FILTERS}
            value={filters.statusFilter}
            onChange={set.status}
          />
          <FilterGroup
            label="Tipe"
            options={TYPE_FILTERS}
            value={filters.typeFilter}
            onChange={set.type}
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
                  'px-3 py-1 text-sm transition-colors',
                  filters.base === b ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                )}
              >
                {b === 'map' ? 'Map' : 'Satelit'}
              </button>
            ))}
          </div>
          <Input
            value={filters.query}
            onChange={(e) => set.query(e.target.value)}
            placeholder="Cari nama / ID node…"
            className="h-8 max-w-xs"
            aria-label="Cari node"
          />
          {edit.canEdit ? (
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={edit.editMode ? 'default' : 'outline'}
                className="h-8"
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
                  className="h-8"
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
            {edit.addMode ? ' · klik peta untuk menambah node baru' : ''} · klik node lalu
            Edit/Hapus di panel.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

type FilterGroupProps<T extends string> = {
  label: string
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}

function FilterGroup<T extends string>({ label, options, value, onChange }: FilterGroupProps<T>) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground text-sm">{label}:</span>
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="sm"
          variant={value === o.value ? 'default' : 'outline'}
          className="h-7 px-2.5"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}
