import {
  BriefcaseIcon,
  DownloadIcon,
  ListTreeIcon,
  MapIcon,
  PlusIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan, useCurrentUser } from '@/features/auth'
import { cn } from '@/lib/cn'
import { downloadCsv } from '@/lib/csv'
import type { NetworkNode, NodeStatus } from '@/schemas/topology'

import { useGeolocation } from '../hooks/useGeolocation'
import { useTopology, useDeleteNode, useUpdateNode } from '../hooks/useTopology'
import { useTopologyJobs } from '../hooks/useTopologyJobs'
import { useTopologySearch } from '../hooks/useTopologySearch'
import { nodesToCsvRows } from '../lib/export'
import { localizeFaults } from '../lib/faults'
import {
  buildForest,
  downstreamIds,
  impactedCustomerIds,
  indexById,
  nearFullOdps,
  nearestFreeOdp,
  nodeSearchText,
  segmentMeters,
  traceCircuit,
  uplinkPath,
} from '../lib/graph'
import { LocateControl } from './LocateControl'
import { InstallCustomerDialog } from './InstallCustomerDialog'
import { NodeFormDialog } from './NodeFormDialog'
import { TopologyAside } from './TopologyAside'
import { TopologyControls } from './TopologyControls'
import type { TopologyControlsProps } from './TopologyControlsBody'
import { TopologyFilterSheet } from './TopologyFilterSheet'
import { TopologyKpiStrip } from './TopologyKpiStrip'
import { TopologyMap } from './TopologyMap'
import { TopologyTree } from './TopologyTree'

export function NetworkTopologyPage() {
  const { data, isLoading, isError } = useTopology()
  const canEdit = useCan('network.manage')
  const currentUser = useCurrentUser()
  const jobs = useTopologyJobs(currentUser.data?.fullName ?? null)
  const updateNode = useUpdateNode()
  const deleteNode = useDeleteNode()

  // Deep-linkable view state (view/base/filters/selection) lives in the URL.
  const {
    view,
    base,
    layer,
    typeFilter,
    statusFilter,
    selectedId,
    setView,
    setBase,
    setLayer,
    setTypeFilter,
    setStatusFilter,
    setSelectedId,
  } = useTopologySearch()

  // Transient UI state — not worth sharing or persisting in the URL.
  const [query, setQuery] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [geoEnabled, setGeoEnabled] = useState(false)
  const [installOpen, setInstallOpen] = useState(false)
  const [myJobsOnly, setMyJobsOnly] = useState(false)
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

  // Customer nodes whose subscriber has an open work order / ticket (badged on
  // the map); the technician's own jobs (+ their uplink path) scope the filter.
  const jobNodeIds = useMemo(
    () =>
      new Set(
        all
          .filter((n) => n.meta?.customerId && jobs.jobCustomerIds.has(n.meta.customerId))
          .map((n) => n.id),
      ),
    [all, jobs.jobCustomerIds],
  )
  const myJobScopeIds = useMemo(() => {
    const ids = new Set<string>()
    for (const n of all) {
      if (!n.meta?.customerId || !jobs.myJobCustomerIds.has(n.meta.customerId)) continue
      for (const p of uplinkPath(n, byId)) ids.add(p.id)
    }
    return ids
  }, [all, byId, jobs.myJobCustomerIds])

  const visible = useMemo(
    () =>
      all.filter(
        (n) =>
          (typeFilter === 'all' || n.type === typeFilter) &&
          (statusFilter === 'all' || n.status === statusFilter) &&
          (!myJobsOnly || myJobScopeIds.has(n.id)),
      ),
    [all, typeFilter, statusFilter, myJobsOnly, myJobScopeIds],
  )
  const visibleById = useMemo(() => indexById(visible), [visible])
  const forest = useMemo(() => buildForest(visible), [visible])
  const impactedCount = useMemo(() => impactedCustomerIds(all).size, [all])
  // Probable outage roots correlated from the dark customers (the NOC's first
  // question: where's the fault, not which ONUs are red).
  const faults = useMemo(() => localizeFaults(all), [all])
  // ODPs running low on free ports — capacity planning before installs fail.
  const capacity = useMemo(() => nearFullOdps(all), [all])
  // Refit the map when the visible set changes (filters/base/my-jobs) — not on selection.
  const refitKey = `${typeFilter}:${statusFilter}:${base}:${myJobsOnly}`

  const highlightIds = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return new Set<string>()
    return new Set(all.filter((n) => nodeSearchText(n).includes(q)).map((n) => n.id))
  }, [all, query])

  const selected = selectedId ? (byId.get(selectedId) ?? null) : null
  const activeIds = useMemo(() => {
    if (!selected) return null
    const ids = new Set<string>([selected.id])
    for (const n of uplinkPath(selected, byId)) ids.add(n.id)
    for (const id of downstreamIds(selected.id, all)) ids.add(id)
    return ids
  }, [selected, byId, all])

  // Trace the selected customer's circuit: its uplink path lights up in the
  // fiber-core colour (null for infra → plain accent).
  const traceColor = useMemo(
    () => (selected ? traceCircuit(selected, byId).coreHex : null),
    [selected, byId],
  )

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
    filters: { typeFilter, statusFilter, base, layer, query },
    set: {
      type: setTypeFilter,
      status: setStatusFilter,
      base: setBase,
      layer: setLayer,
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

      {!isLoading && all.length > 0 ? (
        <TopologyKpiStrip nodes={all} downCount={counts.down} openJobsCount={jobs.openCount} />
      ) : null}

      <TopologyControls {...controlsProps} />
      <TopologyFilterSheet {...controlsProps} />

      {all.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {jobs.myCount > 0 ? (
            <Button
              variant={myJobsOnly ? 'default' : 'outline'}
              size="sm"
              className="h-9"
              onClick={() => setMyJobsOnly((v) => !v)}
            >
              <BriefcaseIcon className="size-4" />
              {myJobsOnly ? 'Tampilkan semua' : `Pekerjaan saya (${jobs.myCount})`}
            </Button>
          ) : null}
          {canEdit ? (
            <Button size="sm" className="h-9" onClick={() => setInstallOpen(true)}>
              <PlusIcon className="size-4" />
              Pasang pelanggan
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            disabled={visible.length === 0}
            onClick={() => downloadCsv('topologi', nodesToCsvRows(visible, visibleById))}
          >
            <DownloadIcon className="size-4" />
            Ekspor CSV
          </Button>
        </div>
      ) : null}

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
                layer={layer}
                selectedId={selectedId}
                activeIds={activeIds}
                traceColor={traceColor}
                highlightIds={highlightIds}
                jobNodeIds={jobNodeIds}
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
            canManage={canEdit}
            distanceMeters={distanceMeters}
            nearestOdp={nearestOdp}
            faults={faults}
            capacity={capacity}
            onClear={() => setSelectedId(null)}
            onEdit={() => {
              if (selected) setForm({ node: selected })
            }}
            onDelete={handleDelete}
            onPickNearest={handlePick}
            onSelectFault={selectAndFly}
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

      {installOpen ? (
        <InstallCustomerDialog
          open
          onOpenChange={setInstallOpen}
          nodes={all}
          onInstalled={handlePick}
        />
      ) : null}
    </div>
  )
}
