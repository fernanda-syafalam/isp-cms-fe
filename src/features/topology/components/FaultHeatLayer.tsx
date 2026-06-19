import { CircleMarker, Pane, Tooltip } from 'react-leaflet'

import type { FaultConfidence } from '../lib/faults'
import type { FaultHotspot } from '../lib/faultHeat'

// Halo colors mirror the marker/status palette (graph.ts STATUS_COLOR) so the
// map reads consistently: a confirmed outage is the same red as a down node, a
// likely one the same amber as unknown. The FaultDiagnosis card in the aside is
// the accessible text alternative (it spells out each root + count + confidence),
// so the color here is reinforcement, never the only signal.
const TONE: Record<FaultConfidence, { fill: string; fillOpacity: number }> = {
  confirmed: { fill: '#dc2626', fillOpacity: 0.4 },
  likely: { fill: '#d97706', fillOpacity: 0.3 },
}

type Props = {
  hotspots: FaultHotspot[]
}

// Translucent "impact halos" over the outage roots, radius scaled by blast size
// (see toFaultHotspots). Rendered in a low pane so cables and markers stay on
// top; the permanent center label shows the dark-customer count as a numeric
// readout (so the hot zone is legible without relying on color alone).
export function FaultHeatLayer({ hotspots }: Props) {
  if (hotspots.length === 0) return null
  return (
    <Pane name="fault-heat" style={{ zIndex: 350 }}>
      {hotspots.map((h) => {
        const tone = TONE[h.confidence]
        return (
          <CircleMarker
            key={h.id}
            center={[h.lat, h.lng]}
            radius={h.radiusPx}
            pathOptions={{
              color: tone.fill,
              fillColor: tone.fill,
              fillOpacity: tone.fillOpacity,
              weight: 1.5,
              opacity: 0.6,
            }}
          >
            <Tooltip permanent direction="center" className="topology-heat-label">
              {h.downCount}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </Pane>
  )
}
