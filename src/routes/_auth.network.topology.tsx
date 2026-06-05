import { createFileRoute } from '@tanstack/react-router'

// Route definition only — the component (and its Leaflet dependency) lives in
// _auth.network.topology.lazy.tsx so the map is code-split out of the
// critical-path bundle (ADR-0004).
export const Route = createFileRoute('/_auth/network/topology')({})
