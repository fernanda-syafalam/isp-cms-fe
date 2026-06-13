import { getRouteApi } from '@tanstack/react-router'

import type { NodeStatus, NodeType } from '@/schemas/topology'

export type TopologyView = 'map' | 'list'
export type TopologyBase = 'map' | 'satellite'
export type TopologyTypeFilter = 'all' | NodeType
export type TopologyStatusFilter = 'all' | NodeStatus

// URL-backed search object. Default values are omitted entirely (not written as
// `undefined`) so a clean URL stays clean and exactOptionalPropertyTypes is
// satisfied. `focus` is intentionally dropped here — once the user interacts,
// the selection lives in `sel`.
type TopologySearchState = {
  view?: TopologyView
  base?: TopologyBase
  type?: TopologyTypeFilter
  status?: TopologyStatusFilter
  sel?: string
}

// Serialize the current view state into a URL search object. Exported for unit
// testing the contract: default values (map view, satellite base, "all"
// filters) are omitted so URLs stay clean, and the legacy `focus` param is
// dropped (selection now lives in `sel`).
export function toSearch(
  view: TopologyView,
  base: TopologyBase,
  type: TopologyTypeFilter,
  status: TopologyStatusFilter,
  sel: string | null,
): TopologySearchState {
  return {
    ...(view !== 'map' ? { view } : {}),
    ...(base !== 'satellite' ? { base } : {}),
    ...(type !== 'all' ? { type } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(sel ? { sel } : {}),
  }
}

const routeApi = getRouteApi('/_auth/network/topology')

type TopologySearch = {
  view: TopologyView
  base: TopologyBase
  typeFilter: TopologyTypeFilter
  statusFilter: TopologyStatusFilter
  selectedId: string | null
  setView: (v: TopologyView) => void
  setBase: (b: TopologyBase) => void
  setTypeFilter: (t: TopologyTypeFilter) => void
  setStatusFilter: (s: TopologyStatusFilter) => void
  setSelectedId: (id: string | null) => void
}

// Reads/writes the deep-linkable view state (view, base map, type/status
// filters, selected node) from the URL. Selection uses `replace: true` so
// clicking around nodes doesn't flood browser history; filter/view changes push
// a new entry so the back button returns to the prior filter. Transient UI
// (edit/add mode, the search query text) is NOT here — it stays local state.
export function useTopologySearch(): TopologySearch {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const view: TopologyView = search.view ?? 'map'
  const base: TopologyBase = search.base ?? 'satellite'
  const typeFilter: TopologyTypeFilter = search.type ?? 'all'
  const statusFilter: TopologyStatusFilter = search.status ?? 'all'
  // `sel` is canonical; fall back to the legacy `focus` deep-link.
  const selectedId = search.sel ?? search.focus ?? null

  return {
    view,
    base,
    typeFilter,
    statusFilter,
    selectedId,
    setView: (v) =>
      navigate({
        search: toSearch(v, base, typeFilter, statusFilter, selectedId),
      }),
    setBase: (b) =>
      navigate({
        search: toSearch(view, b, typeFilter, statusFilter, selectedId),
      }),
    setTypeFilter: (t) => navigate({ search: toSearch(view, base, t, statusFilter, selectedId) }),
    setStatusFilter: (s) => navigate({ search: toSearch(view, base, typeFilter, s, selectedId) }),
    setSelectedId: (id) =>
      navigate({
        search: toSearch(view, base, typeFilter, statusFilter, id),
        replace: true,
      }),
  }
}
