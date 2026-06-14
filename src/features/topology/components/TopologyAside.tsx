import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import type { NetworkNode } from '@/schemas/topology'

import type { OdpCapacity } from '../lib/graph'
import type { ProbableFault } from '../lib/faults'
import { useSplitters } from '../hooks/useCabling'
import { CapacityPanel } from './CapacityPanel'
import { ClosureDetail } from './ClosureDetail'
import { DropRouteControls } from './DropRouteControls'
import { FaultDiagnosis } from './FaultDiagnosis'
import { FiberReference } from './FiberReference'
import { MaintenanceButton } from './MaintenanceButton'
import { NodeDetailPanel } from './NodeDetailPanel'
import { NodeHistory } from './NodeHistory'
import { SplitterPorts } from './SplitterPorts'
import { TopologyLegend } from './TopologyLegend'

type Props = {
  selected: NetworkNode | null
  byId: Map<string, NetworkNode>
  nodes: NetworkNode[]
  editMode: boolean
  canManage: boolean
  distanceMeters?: number | undefined
  nearestOdp: { node: NetworkNode; meters: number } | null
  faults: ProbableFault[]
  capacity: OdpCapacity[]
  onClear: () => void
  onEdit: () => void
  onDelete: () => void
  onPickNearest: (node: NetworkNode) => void
  onSelectFault: (id: string) => void
}

// The right-hand region. On desktop it's the side column (node detail, or the
// legend when nothing is selected). On mobile (where there is no room for a
// column) the legend + fiber reference stack below the map and the node detail
// slides up in a bottom Sheet on selection — thumb-reachable in the field. One
// NodeDetailPanel instance is reused across both layouts.
export function TopologyAside({
  selected,
  byId,
  nodes,
  editMode,
  canManage,
  distanceMeters,
  nearestOdp,
  faults,
  capacity,
  onClear,
  onEdit,
  onDelete,
  onPickNearest,
  onSelectFault,
}: Props) {
  const isMobile = useIsMobile()
  const legend = <TopologyLegend nearestOdp={nearestOdp} onPickNearest={onPickNearest} />
  // Probable outage roots stay visible above everything else — even with a node
  // selected — so an active fault is never out of sight in the field.
  const faultCard = <FaultDiagnosis faults={faults} onSelect={onSelectFault} />
  // Capacity planning is a "nothing selected" overview, shown with the legend.
  const capacityCard = <CapacityPanel items={capacity} onSelect={onSelectFault} />
  // An ODC/ODP carries a splitter; show its per-port occupancy beside the panel.
  const splitters = useSplitters().data?.items
  const splitter =
    selected && (selected.type === 'odc' || selected.type === 'odp')
      ? splitters?.find((s) => s.nodeId === selected.id)
      : undefined
  const splitterCard = splitter ? <SplitterPorts splitter={splitter} byId={byId} /> : null
  // The co-located closure (tray/fiber capacity + its fusion splices).
  const closureCard =
    selected && (selected.type === 'odc' || selected.type === 'odp') ? (
      <ClosureDetail nodeId={selected.id} />
    ) : null
  // Drop-route editor for a selected customer in edit mode (drag handles live on
  // the map; add-bend/straighten here).
  const routeControls =
    selected && selected.type === 'customer' && editMode && canManage ? (
      <DropRouteControls node={selected} />
    ) : null

  if (isMobile) {
    return (
      <>
        {faultCard}
        {capacityCard}
        {legend}
        <FiberReference />
        <Sheet open={selected !== null} onOpenChange={(open) => !open && onClear()}>
          <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Detail node</SheetTitle>
              <SheetDescription>Detail teknis node jaringan yang dipilih.</SheetDescription>
            </SheetHeader>
            {selected ? (
              <NodeDetailPanel
                node={selected}
                byId={byId}
                nodes={nodes}
                editMode={editMode}
                distanceMeters={distanceMeters}
                showClose={false}
                onClear={onClear}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ) : null}
            {selected ? (
              <div className="space-y-4 pb-4">
                {canManage ? (
                  <div className="px-4">
                    <MaintenanceButton node={selected} />
                  </div>
                ) : null}
                {routeControls ? <div className="px-4">{routeControls}</div> : null}
                {splitterCard}
                {closureCard}
                <NodeHistory nodeId={selected.id} />
              </div>
            ) : null}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <>
      {faultCard}
      {selected ? (
        <NodeDetailPanel
          node={selected}
          byId={byId}
          nodes={nodes}
          editMode={editMode}
          distanceMeters={distanceMeters}
          onClear={onClear}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <>
          {capacityCard}
          {legend}
        </>
      )}
      {selected && canManage ? <MaintenanceButton node={selected} /> : null}
      {routeControls}
      {selected ? splitterCard : null}
      {selected ? closureCard : null}
      {selected ? <NodeHistory nodeId={selected.id} /> : null}
      <FiberReference />
    </>
  )
}
