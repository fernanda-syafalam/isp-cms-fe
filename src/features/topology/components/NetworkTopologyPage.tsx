import { ListTreeIcon, MapIcon, TriangleAlertIcon } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/auth'
import { cn } from '@/lib/cn'
import type { NetworkNode, NodeStatus } from '@/schemas/topology'

import { useGeolocation } from '../hooks/useGeolocation'
import { useTopology, useDeleteNode, useUpdateNode } from '../hooks/useTopology'
import { useTopologySearch } from '../hooks/useTopologySearch'
import {
  buildForest,
  downstreamIds,
  impactedCustomerIds,
  indexById,
  nearestFreeOdp,
  segmentMeters,
  uplinkPath,
} from '../lib/graph'
import { LocateControl } from './LocateControl'
import { NodeFormDialog } from './NodeFormDialog'
import { TopologyAside } from './TopologyAside'
import { TopologyControls } from './TopologyControls'
import type { TopologyControlsProps } from './TopologyControlsBody'
import { TopologyFilterSheet } from './TopologyFilterSheet'
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
  const [geoEnabled, setGeoEnabled] = useState(false)
  // The node the map should fly to. Set when selecting from the list/tree (the
  // map may be framed elsewhere); a marker click does NOT fly (it's on screen).
  const [flyToTarget, setFlyToTarget] = useState<NetworkNode | null>(null)
  // Node form: { node } for edit, { latLng } for add, null when closed.
  const [form, setForm] = useState<
    { node: NetworkNode } | { latLng: { lat: number; lng: number } } | null
  >(null)

  const { position: userPosition, isLocating } = useGeolocation(geoEnabled)

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

  // Distance from the technician to the selected node (straight line).
  const distanceMeters =
    userPosition && selected ? segmentMeters(userPosition, selected) : undefined
  // When located with nothing selected, suggest the nearest ODP that has a free
  // port — the "where can I hook up from here?" shortcut.
  const nearestOdp = userPosition && !selected ? nearestFreeOdp(userPosition, all) : null

  // Stable callbacks so the memoized markers don't rebuild on every GPS fix.
  const setSelectedIdRef = useRef(setSelectedId)
  setSelectedIdRef.current = setSelectedId
  const updateNodeRef = useRef(updateNode)
  updateNodeRef.current = updateNode
  const handleMarkerSelect = useCallback((id: string) => setSelectedIdRef.current(id), [])
  const handleMarkerMove = useCallback(
    (id: string, lat: number, lng: number) =>
      updateNodeRef.current.mutate({ id, input: { lat, lng } }),
    [],
  )

  // Select + fly: used by the list/tree where the picked node may be off-screen.
  const selectAndFly = (id: string) => {
    setSelectedId(id)
    setFlyToTarget(byId.get(id) ?? null)
  }

  // Search/affordance pick: select it, fly the map to it, and collapse the query.
  const handlePick = (node: NetworkNode) => {
    setSelectedId(node.id)
    setFlyToTarget(node)
    setQuery('')
  }

  const handleDelete = () => {
    if (selected) deleteNode.mutate(selected.id)
    setSelectedId(null)
  }

  const controlsProps: TopologyControlsProps = {
    nodes: all,
    filters: { typeFilter, statusFilter, base, query },
    set: {
      type: setTypeFilter,
      status: setStatusFilter,
      base: setBase,
      query: setQuery,
    },
    counts,
    edit: {
      canEdit,
      editMode,
      addMode,
      toggleEdit: () => {
        setEditMode((v) => !v)
        setAddMode(false)
      },
      toggleAdd: () => setAddMode((v) => !v),
    },
    onPick: handlePick,
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        title="Topologi Jaringan"
        description="Peta infrastruktur OLT → ODC → ODP → Tiang → Pelanggan. Klik node untuk menelusuri jalur uplink."
        actions={
          <div className="inline-flex rounded-md border border-border p-0.5">
            <Button
              variant={view === 'map' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 sm:h-7"
              onClick={() => setView('map')}
            >
              <MapIcon className="size-4" />
              Peta
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 sm:h-7"
              onClick={() => setView('list')}
            >
              <ListTreeIcon className="size-4" />
              Daftar
            </Button>
          </div>
        }
      />

      <TopologyControls {...controlsProps} />
      <TopologyFilterSheet {...controlsProps} />

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
            className="ml-auto h-9 sm:h-7"
            onClick={() => setStatusFilter(statusFilter === 'down' ? 'all' : 'down')}
          >
            {statusFilter === 'down' ? 'Tampilkan semua' : 'Fokus node down'}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div
          className={cn(
            'relative h-[70dvh] rounded-lg border bg-card',
            view === 'map' ? 'overflow-hidden' : 'overflow-y-auto',
          )}
        >
          {isLoading || !data ? (
            <Skeleton className="h-full w-full" />
          ) : view === 'map' ? (
            <>
              <TopologyMap
                nodes={visible}
                byId={visibleById}
                base={base}
                selectedId={selectedId}
                activeIds={activeIds}
                highlightIds={highlightIds}
                flyToTarget={flyToTarget}
                userPosition={userPosition}
                refitKey={refitKey}
                editMode={editMode}
                addMode={addMode}
                onSelect={handleMarkerSelect}
                onMove={handleMarkerMove}
                onMapClick={(lat, lng) => {
                  setForm({ latLng: { lat, lng } })
                  setAddMode(false)
                }}
              />
              <LocateControl
                active={geoEnabled}
                isLocating={isLocating}
                onToggle={() => setGeoEnabled((v) => !v)}
              />
            </>
          ) : (
            <TopologyTree
              forest={forest}
              selectedId={selectedId}
              highlightIds={highlightIds}
              onSelect={selectAndFly}
            />
          )}
        </div>
        <aside className="space-y-4">
          <TopologyAside
            selected={selected}
            byId={byId}
            nodes={all}
            editMode={editMode}
            distanceMeters={distanceMeters}
            nearestOdp={nearestOdp}
            onClear={() => setSelectedId(null)}
            onEdit={() => {
              if (selected) setForm({ node: selected })
            }}
            onDelete={handleDelete}
            onPickNearest={handlePick}
          />
        </aside>
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
