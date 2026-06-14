import { getRouteApi } from '@tanstack/react-router'

import type { NodeStatus, NodeType } from '@/schemas/topology'

export type TopologyView = 'map' | 'list'
export type TopologyBase = 'map' | 'satellite'
export type TopologyLayer = 'logical' | 'physical'
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
  layer?: TopologyLayer
  sel?: string
}

// Serialize the current view state into a URL search object. Exported for unit
// testing the contract: default values (map view, satellite base, "all"
// filters, logical layer) are omitted so URLs stay clean, and the legacy
// `focus` param is dropped (selection now lives in `sel`).
export function toSearch(
  view: TopologyView,
  base: TopologyBase,
  type: TopologyTypeFilter,
  status: TopologyStatusFilter,
  layer: TopologyLayer,
  sel: string | null,
): TopologySearchState {
  return {
    ...(view !== 'map' ? { view } : {}),
    ...(base !== 'satellite' ? { base } : {}),
    ...(type !== 'all' ? { type } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(layer !== 'logical' ? { layer } : {}),
    ...(sel ? { sel } : {}),
  }
}

const routeApi = getRouteApi('/_auth/network/topology')

type TopologySearch = {
  view: TopologyView
  base: TopologyBase
  layer: TopologyLayer
  typeFilter: TopologyTypeFilter
  statusFilter: TopologyStatusFilter
  selectedId: string | null
  setView: (v: TopologyView) => void
  setBase: (b: TopologyBase) => void
  setLayer: (l: TopologyLayer) => void
  setTypeFilter: (t: TopologyTypeFilter) => void
  setStatusFilter: (s: TopologyStatusFilter) => void
  setSelectedId: (id: string | null) => void
}

// Reads/writes the deep-linkable view state (view, base map, physical/logical
// layer, type/status filters, selected node) from the URL. Selection uses
// `replace: true` so clicking around nodes doesn't flood browser history;
// filter/view/layer changes push a new entry so back returns to the prior view.
// Transient UI (edit/add mode, the search query text) is NOT here.
export function useTopologySearch(): TopologySearch {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const view: TopologyView = search.view ?? 'map'
  const base: TopologyBase = search.base ?? 'satellite'
  const layer: TopologyLayer = search.layer ?? 'logical'
  const typeFilter: TopologyTypeFilter = search.type ?? 'all'
  const statusFilter: TopologyStatusFilter = search.status ?? 'all'
  // `sel` is canonical; fall back to the legacy `focus` deep-link.
  const selectedId = search.sel ?? search.focus ?? null

  return {
    view,
    base,
    layer,
    typeFilter,
    statusFilter,
    selectedId,
    // resetScroll:false — these are in-page state changes (selecting a node,
    // toggling a filter), NOT page navigations; without it, clicking a node on
    // the map would jump the page back to the top.
    setView: (v) =>
      navigate({
        search: toSearch(v, base, typeFilter, statusFilter, layer, selectedId),
        resetScroll: false,
      }),
    setBase: (b) =>
      navigate({
        search: toSearch(view, b, typeFilter, statusFilter, layer, selectedId),
        resetScroll: false,
      }),
    setLayer: (l) =>
      navigate({
        search: toSearch(view, base, typeFilter, statusFilter, l, selectedId),
        resetScroll: false,
      }),
    setTypeFilter: (t) =>
      navigate({
        search: toSearch(view, base, t, statusFilter, layer, selectedId),
        resetScroll: false,
      }),
    setStatusFilter: (s) =>
      navigate({
        search: toSearch(view, base, typeFilter, s, layer, selectedId),
        resetScroll: false,
      }),
    setSelectedId: (id) =>
      navigate({
        search: toSearch(view, base, typeFilter, statusFilter, layer, id),
        replace: true,
        resetScroll: false,
      }),
  }
}
