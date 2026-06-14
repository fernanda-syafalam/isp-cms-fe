import type { NetworkNode } from '@/schemas/topology'

import { STATUS_LABEL, TYPE_LABEL } from './graph'

// Flatten topology nodes into CSV rows for an inventory export / field handover
// sheet. Indonesian headers (user-facing artifact); empty cells for fields that
// don't apply to a node type. The uplink is resolved to the parent's name.
export function nodesToCsvRows(
  nodes: NetworkNode[],
  byId: Map<string, NetworkNode>,
): Array<Record<string, unknown>> {
  return nodes.map((n) => {
    const m = n.meta
    const parent = n.parentId ? byId.get(n.parentId) : undefined
    return {
      Nama: n.name,
      Tipe: TYPE_LABEL[n.type],
      Status: STATUS_LABEL[n.status],
      Layanan: m?.lifecycle ?? '',
      Pemeliharaan: m?.maintenance ? 'ya' : '',
      Uplink: parent?.name ?? '',
      Lat: n.lat,
      Lng: n.lng,
      Core: m?.coreNo ?? '',
      'Port terpakai': m?.portsUsed ?? '',
      'Port total': m?.portsTotal ?? '',
      'RX (dBm)': m?.rxPowerDbm ?? '',
      Telepon: m?.phone ?? '',
      ONU: m?.onuSerial ?? '',
      IP: m?.ipAddress ?? '',
    }
  })
}
