import type { StrandAssignment } from '@/schemas/cable'
import type { Splitter } from '@/schemas/splitter'
import type { NetworkNode, NodeMeta } from '@/schemas/topology'

import { ratioCount } from './graph'

export type CablingProjectionInput = {
  splitters: Splitter[]
  strands: StrandAssignment[]
}

// Recompose a strand's tube+core into the global fiber number the UI renders via
// fiberId()/fiberCore() — the exact inverse of fiberId(), so a customer's tube
// and core colors are preserved when projected back onto the node.
function strandGlobalNo(strand: StrandAssignment): number {
  return (strand.tubeNo - 1) * 12 + strand.coreNo
}

// Cabling is the source of truth; node.meta is a projection of it. This MERGES
// the cabling-derived fields (splitter/portsTotal/portsUsed for ODC/ODP, coreNo
// for a customer) onto each node's existing meta — every pass-through fact
// (model, ipAddress, uptimePct, planName, phone, onuSerial, ponPort, rxPowerDbm,
// customerId) is preserved. `portsUsed` therefore reflects true occupancy and is
// never hand-maintained. Runs in the GET /api/topology handler so the api/hooks/
// components see an unchanged NetworkNode shape (a real backend computes this).
export function projectNodeMeta(
  nodes: NetworkNode[],
  cabling: CablingProjectionInput,
): NetworkNode[] {
  const splitterByNode = new Map<string, Splitter>()
  for (const s of cabling.splitters) splitterByNode.set(s.nodeId, s)
  const dropStrandByCustomer = new Map<string, StrandAssignment>()
  for (const st of cabling.strands) {
    if (st.customerId) dropStrandByCustomer.set(st.customerId, st)
  }

  return nodes.map((node) => {
    const splitter = splitterByNode.get(node.id)
    const customerId = node.meta?.customerId
    const strand = customerId ? dropStrandByCustomer.get(customerId) : undefined
    if (!splitter && !strand) return node

    const meta: NodeMeta = { ...node.meta }
    if (splitter) {
      meta.splitter = splitter.ratio
      meta.portsTotal = ratioCount(splitter.ratio)
      meta.portsUsed = splitter.ports.filter((p) => p.outNodeId !== null).length
    }
    if (strand) meta.coreNo = strandGlobalNo(strand)
    return { ...node, meta }
  })
}
