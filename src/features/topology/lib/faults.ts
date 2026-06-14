import type { NetworkNode } from '@/schemas/topology'

import { downstreamIds, impactedCustomerIds, indexById, uplinkPath } from './graph'

export type FaultConfidence = 'confirmed' | 'likely'

export type ProbableFault = {
  node: NetworkNode
  /** Dark (impacted) customers in this node's subtree. */
  downCount: number
  /** Total customers in this node's subtree. */
  totalCount: number
  confidence: FaultConfidence
}

// A "likely" upstream fault needs enough dark customers, and they must dominate
// the node's served base — a couple of dead ONUs is a CPE issue, not a feeder.
const MIN_LIKELY_DOWN = 3
const LIKELY_RATIO = 0.6

// Correlate dark customers to the probable upstream root, the diagnosis a NOC
// does by hand. Two confidence levels:
//   - confirmed: an infra node (OLT/ODC/ODP) that is itself down — its whole
//     subtree is dark by definition.
//   - likely: an ODP that still reports up but where most of its customers are
//     dark — points to its feeder / the ODP itself despite the green status.
// Results roll up: a node explained by a confirmed outage upstream is dropped,
// so a down OLT yields one entry, not one per ODP beneath it. A lone dead ONU
// is intentionally NOT reported (no upstream root) — that is a CPE matter.
export function localizeFaults(nodes: NetworkNode[]): ProbableFault[] {
  const byId = indexById(nodes)

  // Customers under planned maintenance are dark on purpose — drop them from the
  // signal so a maintenance window never raises an outage alarm (and never makes
  // a sibling look "likely" by inflating dark counts upstream).
  const maintained = new Set<string>()
  for (const n of nodes) {
    if (!n.meta?.maintenance) continue
    if (n.type === 'customer') maintained.add(n.id)
    for (const id of downstreamIds(n.id, nodes)) {
      if (byId.get(id)?.type === 'customer') maintained.add(id)
    }
  }
  const dark = new Set([...impactedCustomerIds(nodes)].filter((id) => !maintained.has(id)))
  if (dark.size === 0) return []

  const candidates: ProbableFault[] = []
  for (const n of nodes) {
    if (n.type !== 'olt' && n.type !== 'odc' && n.type !== 'odp') continue
    if (n.meta?.maintenance) continue // planned work, not a fault
    let total = 0
    let down = 0
    for (const id of downstreamIds(n.id, nodes)) {
      if (byId.get(id)?.type !== 'customer') continue
      total++
      if (dark.has(id)) down++
    }
    if (total === 0 || down === 0) continue
    const confirmed = n.status === 'down'
    const likely =
      !confirmed && n.type === 'odp' && down >= MIN_LIKELY_DOWN && down / total >= LIKELY_RATIO
    if (confirmed || likely) {
      candidates.push({
        node: n,
        downCount: down,
        totalCount: total,
        confidence: confirmed ? 'confirmed' : 'likely',
      })
    }
  }

  // Drop any candidate already explained by a confirmed outage upstream.
  const confirmedIds = new Set(
    candidates.filter((c) => c.confidence === 'confirmed').map((c) => c.node.id),
  )
  const rolled = candidates.filter((c) => {
    const ancestors = uplinkPath(c.node, byId).slice(1) // exclude self
    return !ancestors.some((a) => confirmedIds.has(a.id))
  })

  // Confirmed first, then by blast size (most dark customers).
  return rolled.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      return a.confidence === 'confirmed' ? -1 : 1
    }
    return b.downCount - a.downCount
  })
}
