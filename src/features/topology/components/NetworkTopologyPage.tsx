import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/auth'
import type { NetworkNode, NodeStatus, NodeType } from '@/schemas/topology'

import { useDeleteNode, useTopology, useUpdateNode } from '../hooks/useTopology'
import { downstreamIds, indexById, uplinkPath } from '../lib/graph'
import { NodeDetailPanel } from './NodeDetailPanel'
import { NodeFormDialog } from './NodeFormDialog'
import { TopologyControls } from './TopologyControls'
import { TopologyMap } from './TopologyMap'

export function NetworkTopologyPage() {
  const { data, isLoading, isError } = useTopology()
  const canEdit = useCan('network.manage')
  const updateNode = useUpdateNode()
  const deleteNode = useDeleteNode()

  const [base, setBase] = useState<'map' | 'satellite'>('satellite')
  const [typeFilter, setTypeFilter] = useState<'all' | NodeType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | NodeStatus>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [addMode, setAddMode] = useState(false)
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

  const handleDelete = () => {
    if (selected) deleteNode.mutate(selected.id)
    setSelectedId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topologi Jaringan"
        description="Peta infrastruktur OLT → ODC → ODP → Tiang → Pelanggan. Klik node untuk menelusuri jalur uplink."
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
              editMode={editMode}
              addMode={addMode}
              onSelect={setSelectedId}
              onMove={(id, lat, lng) => updateNode.mutate({ id, input: { lat, lng } })}
              onMapClick={(lat, lng) => {
                setForm({ latLng: { lat, lng } })
                setAddMode(false)
              }}
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
