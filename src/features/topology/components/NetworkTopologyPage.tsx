import { ListTreeIcon, MapIcon, TriangleAlertIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/auth'
import { cn } from '@/lib/cn'
import type { NetworkNode, NodeStatus } from '@/schemas/topology'

import { useTopology, useDeleteNode, useUpdateNode } from '../hooks/useTopology'
import { useTopologySearch } from '../hooks/useTopologySearch'
import {
  FIBER_CORES,
  buildForest,
  downstreamIds,
  impactedCustomerIds,
  indexById,
  uplinkPath,
} from '../lib/graph'
import { NodeDetailPanel } from './NodeDetailPanel'
import { NodeFormDialog } from './NodeFormDialog'
import { TopologyControls } from './TopologyControls'
import { TopologyMap } from './TopologyMap'
import { TopologyTree } from './TopologyTree'

export function NetworkTopologyPage() {
  const { data, isLoading, isError } = useTopology()
  const canEdit = useCan('network.manage')
  const updateNode = useUpdateNode()
  const deleteNode = useDeleteNode()

  // Deep-linkable view state (view/base/filters/selection) lives in the URL.
  const {
    view,
    base,
    typeFilter,
    statusFilter,
    selectedId,
    setView,
    setBase,
    setTypeFilter,
    setStatusFilter,
    setSelectedId,
  } = useTopologySearch()

  // Transient UI state — not worth sharing or persisting in the URL.
  const [query, setQuery] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [addMode, setAddMode] = useState(false)
  // The node the map should fly to. Set when selecting from the list/tree (the
  // map may be framed elsewhere); a marker click does NOT fly (it's on screen).
  const [flyToTarget, setFlyToTarget] = useState<NetworkNode | null>(null)
  // Node form: { node } for edit, { latLng } for add, null when closed.
  const [form, setForm] = useState<
    { node: NetworkNode } | { latLng: { lat: number; lng: number } } | null
  >(null)

  const all = useMemo(() => data?.items ?? [], [data])
  const byId = useMemo(() => indexById(all), [all])

  const counts = useMemo(() => {
    const c: Record<NodeStatus, number> = { up: 0, down: 0, unknown: 0 }
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
  const forest = useMemo(() => buildForest(visible), [visible])
  const impactedCount = useMemo(() => impactedCustomerIds(all).size, [all])
  // Refit the map when the visible set changes (filters/base) — not on selection.
  const refitKey = `${typeFilter}:${statusFilter}:${base}`

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

  // Select + fly: used by the list/tree where the picked node may be off-screen.
  const selectAndFly = (id: string) => {
    setSelectedId(id)
    setFlyToTarget(byId.get(id) ?? null)
  }

  const handleDelete = () => {
    if (selected) deleteNode.mutate(selected.id)
    setSelectedId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topologi Jaringan"
        description="Peta infrastruktur OLT → ODC → ODP → Tiang → Pelanggan. Klik node untuk menelusuri jalur uplink."
        actions={
          <div className="inline-flex rounded-md border border-border p-0.5">
            <Button
              variant={view === 'map' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7"
              onClick={() => setView('map')}
            >
              <MapIcon className="size-4" />
              Peta
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7"
              onClick={() => setView('list')}
            >
              <ListTreeIcon className="size-4" />
              Daftar
            </Button>
          </div>
        }
      />

      <TopologyControls
        filters={{ typeFilter, statusFilter, base, query }}
        set={{
          type: setTypeFilter,
          status: setStatusFilter,
          base: setBase,
          query: setQuery,
        }}
        counts={counts}
        edit={{
          canEdit,
          editMode,
          addMode,
          toggleEdit: () => {
            setEditMode((v) => !v)
            setAddMode(false)
          },
          toggleAdd: () => setAddMode((v) => !v),
        }}
      />

      {isError ? (
        <p className="text-destructive" role="alert">
          Gagal memuat topologi.
        </p>
      ) : null}

      {impactedCount > 0 ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm"
          role="alert"
        >
          <TriangleAlertIcon className="size-5 shrink-0 text-destructive" />
          <span className="text-destructive">
            <span className="font-semibold">≈ {impactedCount} pelanggan</span> berpotensi terdampak
            gangguan jaringan saat ini.
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-7"
            onClick={() => setStatusFilter(statusFilter === 'down' ? 'all' : 'down')}
          >
            {statusFilter === 'down' ? 'Tampilkan semua' : 'Fokus node down'}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div
          className={cn(
            'h-[70vh] rounded-lg border bg-card',
            view === 'map' ? 'overflow-hidden' : 'overflow-y-auto',
          )}
        >
          {isLoading || !data ? (
            <Skeleton className="h-full w-full" />
          ) : view === 'map' ? (
            <TopologyMap
              nodes={visible}
              byId={visibleById}
              base={base}
              selectedId={selectedId}
              activeIds={activeIds}
              highlightIds={highlightIds}
              flyToTarget={flyToTarget}
              refitKey={refitKey}
              editMode={editMode}
              addMode={addMode}
              onSelect={setSelectedId}
              onMove={(id, lat, lng) => updateNode.mutate({ id, input: { lat, lng } })}
              onMapClick={(lat, lng) => {
                setForm({ latLng: { lat, lng } })
                setAddMode(false)
              }}
            />
          ) : (
            <TopologyTree
              forest={forest}
              selectedId={selectedId}
              highlightIds={highlightIds}
              onSelect={selectAndFly}
            />
          )}
        </div>
        <div className="space-y-4">
          {selected ? (
            <NodeDetailPanel
              node={selected}
              byId={byId}
              nodes={all}
              editMode={editMode}
              onClear={() => setSelectedId(null)}
              onEdit={() => setForm({ node: selected })}
              onDelete={handleDelete}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-muted-foreground text-sm">
                <p className="font-medium text-foreground">Legenda peta</p>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full bg-green-600" />
                    <span className="size-2.5 shrink-0 rotate-45 rounded-[2px] bg-red-600" />
                    <span className="size-2.5 shrink-0 rounded-full border-2 border-amber-600" />
                    Status node: Up / Down / Unknown
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-6 shrink-0 rounded-full bg-green-600/60" />
                    <span className="h-1 w-6 shrink-0 rounded-full bg-red-600" />
                    Kabel feeder (OLT→ODP) = warna status node.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-3 shrink-0 rounded-full bg-blue-600" />
                    <span className="h-1 w-3 shrink-0 rounded-full bg-orange-500" />
                    <span className="h-1 w-3 shrink-0 rounded-full bg-green-600" />
                    Drop pelanggan = warna core fiber (TIA-598); merah bila down.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-3 shrink-0 rounded-full bg-muted-foreground/30 ring-2 ring-amber-500" />
                    <span className="size-3 shrink-0 rounded-full bg-muted-foreground/30 ring-2 ring-red-600" />
                    Cincin = kapasitas port (≥70% amber, ≥90% merah).
                  </li>
                  <li>Ukuran titik = tipe (OLT terbesar → Pelanggan terkecil).</li>
                  <li>Klik titik: sorot jalur uplink, detail teknis, & blast-radius.</li>
                </ul>
              </CardContent>
            </Card>
          )}
          <FiberReference />
        </div>
      </div>

      {form ? (
        <NodeFormDialog
          open
          onOpenChange={(o) => {
            if (!o) setForm(null)
          }}
          nodes={all}
          {...('node' in form ? { node: form.node } : { latLng: form.latLng })}
        />
      ) : null}
    </div>
  )
}

// Field reference: the TIA-598-C 12-color fiber code (tube + core use the same
// sequence). A collapsible card so a technician can read colors on-site.
function FiberReference() {
  return (
    <Card>
      <CardContent className="pt-6">
        <details>
          <summary className="cursor-pointer font-medium text-foreground text-sm">
            Referensi warna fiber (TIA-598)
          </summary>
          <p className="mt-2 text-muted-foreground text-xs">
            Urutan core & tube identik; di atas 12 diulang dengan garis hitam.
          </p>
          <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {FIBER_CORES.map((c, i) => (
              <li key={c.name} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right font-mono text-muted-foreground tabular-nums">
                  {i + 1}
                </span>
                <span
                  className="size-3 shrink-0 rounded-full border border-border"
                  style={{ background: c.hex }}
                />
                <span>{c.name}</span>
              </li>
            ))}
          </ol>
        </details>
      </CardContent>
    </Card>
  )
}
