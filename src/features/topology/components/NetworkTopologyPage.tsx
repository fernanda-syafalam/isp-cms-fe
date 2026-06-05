import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import type { NodeStatus, NodeType } from '@/schemas/topology'

import { useTopology } from '../hooks/useTopology'
import {
  STATUS_COLOR,
  STATUS_LABEL,
  TYPE_LABEL,
  downstreamIds,
  indexById,
  uplinkPath,
} from '../lib/graph'
import { NodeDetailPanel } from './NodeDetailPanel'
import { TopologyMap } from './TopologyMap'

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

export function NetworkTopologyPage() {
  const { data, isLoading, isError } = useTopology()
  const [base, setBase] = useState<'map' | 'satellite'>('satellite')
  const [typeFilter, setTypeFilter] = useState<'all' | NodeType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | NodeStatus>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const all = useMemo(() => data?.items ?? [], [data])
  const byId = useMemo(() => indexById(all), [all])

  const counts = useMemo(() => {
    const c = { up: 0, down: 0, unknown: 0 }
    for (const n of all) c[n.status]++
    return c
  }, [all])

  const visible = useMemo(
    () =>
      all.filter(
        (n) =>
          (typeFilter === 'all' || n.type === typeFilter) &&
          (statusFilter === 'all' || n.status === statusFilter),
      ),
    [all, typeFilter, statusFilter],
  )
  const visibleById = useMemo(() => indexById(visible), [visible])

  const highlightIds = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return new Set<string>()
    return new Set(
      all.filter((n) => `${n.name} ${n.id}`.toLowerCase().includes(q)).map((n) => n.id),
    )
  }, [all, query])

  const selected = selectedId ? (byId.get(selectedId) ?? null) : null
  const activeIds = useMemo(() => {
    if (!selected) return null
    const ids = new Set<string>([selected.id])
    for (const n of uplinkPath(selected, byId)) ids.add(n.id)
    for (const id of downstreamIds(selected.id, all)) ids.add(id)
    return ids
  }, [selected, byId, all])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topologi Jaringan"
        description="Peta infrastruktur OLT → ODC → ODP → Tiang → Pelanggan. Klik node untuk menelusuri jalur uplink."
      />

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <FilterGroup
              label="Status"
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <FilterGroup
              label="Tipe"
              options={TYPE_FILTERS}
              value={typeFilter}
              onChange={setTypeFilter}
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
                  onClick={() => setBase(b)}
                  className={cn(
                    'px-3 py-1 text-sm transition-colors',
                    base === b ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                  )}
                >
                  {b === 'map' ? 'Map' : 'Satelit'}
                </button>
              ))}
            </div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama / ID node…"
              className="h-8 max-w-xs"
              aria-label="Cari node"
            />
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <p className="text-destructive" role="alert">
          Gagal memuat topologi.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[70vh] overflow-hidden rounded-lg border bg-card">
          {isLoading || !data ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <TopologyMap
              nodes={visible}
              byId={visibleById}
              base={base}
              selectedId={selectedId}
              activeIds={activeIds}
              highlightIds={highlightIds}
              onSelect={setSelectedId}
            />
          )}
        </div>
        <div className="space-y-4">
          {selected ? (
            <NodeDetailPanel
              node={selected}
              byId={byId}
              nodes={all}
              onClear={() => setSelectedId(null)}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-muted-foreground text-sm">
                <p className="font-medium text-foreground">Cara baca peta</p>
                <ul className="mt-2 space-y-1.5">
                  <li>Warna titik = status (hijau Up, merah Down, amber Unknown).</li>
                  <li>Ukuran titik = tipe (OLT terbesar → Pelanggan terkecil).</li>
                  <li>Garis = koneksi ke induk (uplink).</li>
                  <li>Klik titik untuk menyorot jalur uplink + hitung pelanggan downstream.</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
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
