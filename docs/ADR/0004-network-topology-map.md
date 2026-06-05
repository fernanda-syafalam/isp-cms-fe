# ADR-0004: Network topology map via Leaflet (keyless tiles)

**Status:** Accepted
**Date:** 2026-06-05
**Author:** sanjit@xprogroup.com.au
**Deciders:** ASHNET engineering

## Context

Operators need to see and trace the physical network topology
(OLT → ODC → ODP → Tiang/pole → Pelanggan) on a geographic map with
satellite imagery, similar to the existing e-Billing "Data Mapping" screen.
Constraints: no external API key / billing, the size-limit budget (Main JS
280 kB gzip), and the mock-first architecture (ADR-0003).

## Decision Drivers

- No API key / billing (keyless tiles).
- Bundle budget — the map library must not bloat the critical-path bundle.
- Ability to draw topology links (parent → child) and trace an uplink path.
- Mock-first: data comes from MSW, no real backend yet.

## Considered Options

1. **Leaflet + react-leaflet** with OSM (street) + Esri World Imagery
   (satellite) tiles — keyless, ~45 kB gzip, lazy-loadable, native polylines.
2. **MapLibre GL** — modern vector rendering but ~220 kB gzip and still needs a
   tile style/source (often keyed).
3. **Google Maps** (`@vis.gl/react-google-maps`) — matches the reference UI but
   **requires an API key + billing**, failing the keyless constraint.

## Decision

Choose **Option 1 (Leaflet + react-leaflet)**. The map route
(`/network/topology`) is **code-split** (a `.lazy.tsx` route like
`reports`/dashboard) so Leaflet and its CSS land in an on-demand chunk, not the
main bundle. Markers use `CircleMarker` (SVG) — no image assets, avoiding
Leaflet's default-icon path problem and rendering identically in light/dark.

Topology is modelled as a self-contained mock collection `NetworkNode`
(`{ id, name, type, status, lat, lng, parentId }`); edges are derived from
`parentId`. The Customer schema is **not** changed. The page renders markers
(colour = status, radius = type) + polylines (child → parent); clicking a node
highlights its uplink path to the OLT and counts downstream customers.

## Consequences

### Positive

- No key, no billing, no recurring cost; satellite imagery via Esri (attributed).
- Bundle budget safe — Leaflet is isolated in the lazy map chunk.
- Topology links + uplink trace are straightforward with Leaflet polylines.

### Negative

- Not a pixel-for-pixel Google Maps look-and-feel.
- New runtime dependencies (`leaflet`, `react-leaflet`) + dev `@types/leaflet`.

### Neutral

- Edit/drag of points, marker clustering, and live status are deferred (MVP is
  read-only).

## Implementation Notes

- `schemas/topology.ts`, `api/topology.ts`, `features/topology/*`.
- Route split: `_auth.network.topology.tsx` (definition) +
  `_auth.network.topology.lazy.tsx` (component).
- Mock: `TOPOLOGY_FIXTURES` + `GET /api/topology` in `test/msw/handlers.ts`.

## Validation

- `pnpm size` stays green (Leaflet not in the main chunk).
- Map renders markers + links; clicking a node traces its uplink and shows the
  downstream customer count; Map/Satelit toggle and type/status filters work.
