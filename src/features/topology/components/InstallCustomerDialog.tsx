import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { listCustomers } from '@/api/customers'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { NetworkNode } from '@/schemas/topology'

import { useInstallCustomer, useSplitters } from '../hooks/useCabling'
import { nearestFreeOdp, segmentMeters } from '../lib/graph'
import { InstallAllocation } from './InstallAllocation'
import { SubscriberPicker } from './SubscriberPicker'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: NetworkNode[]
  latLng?: { lat: number; lng: number } | undefined
  onInstalled: (node: NetworkNode) => void
}

// "Pasang pelanggan": pick a registered subscriber that has no topology node yet,
// confirm the target ODP (nearest with a free port by default), preview the
// splitter port + TIA-598 core that will be assigned, and provision the drop.
export function InstallCustomerDialog({ open, onOpenChange, nodes, latLng, onInstalled }: Props) {
  const customersQ = useQuery({
    queryKey: ['customers', 'list', {}],
    queryFn: () => listCustomers(),
  })
  const install = useInstallCustomer()
  const splittersQ = useSplitters()

  const nodeIds = new Set(nodes.map((n) => n.id))
  const available = (customersQ.data?.items ?? []).filter((c) => !nodeIds.has(`${c.id}-node`))
  const freeOdps = nodes.filter(
    (n) => n.type === 'odp' && (n.meta?.portsTotal ?? 0) > (n.meta?.portsUsed ?? 0),
  )
  const point = latLng ?? {
    lat: nodes[0]?.lat ?? -6.5514,
    lng: nodes[0]?.lng ?? 110.6811,
  }

  const [customerId, setCustomerId] = useState<string | null>(null)
  const [odpId, setOdpId] = useState<string>(
    () => nearestFreeOdp(point, nodes)?.node.id ?? freeOdps[0]?.id ?? '',
  )
  const [portNo, setPortNo] = useState<number | null>(null)

  const odp = nodes.find((n) => n.id === odpId)
  // Real free ports of the selected ODP's splitter (the source of truth, not the
  // projected count — which can disagree if ports were freed out of order).
  const splitter = splittersQ.data?.items.find((s) => s.nodeId === odpId)
  const freePorts = splitter?.ports.filter((p) => p.outNodeId === null) ?? []
  // Auto-correct the selection when the ODP changes or the picked port fills up.
  const selectedPort = freePorts.find((p) => p.portNo === portNo) ?? freePorts[0] ?? null
  const dropMeters = odp ? segmentMeters(odp, point) : 0
  const canSubmit = Boolean(customerId && odp && selectedPort) && !install.isPending

  const submit = async () => {
    if (!customerId || !odp || !selectedPort) return
    try {
      const node = await install.mutateAsync({
        customerId,
        odpId: odp.id,
        lat: point.lat,
        lng: point.lng,
        portNo: selectedPort.portNo,
      })
      onInstalled(node)
      onOpenChange(false)
    } catch {
      // useInstallCustomer surfaces the error toast (e.g. full ODP)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pasang pelanggan</DialogTitle>
          <DialogDescription>
            Pilih pelanggan terdaftar yang belum ada di peta, lalu tentukan ODP-nya.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <SubscriberPicker customers={available} value={customerId} onChange={setCustomerId} />

          <div className="space-y-1.5">
            <span className="font-medium text-sm">ODP tujuan</span>
            <Select value={odpId} onValueChange={setOdpId}>
              <SelectTrigger className="w-full" aria-label="ODP tujuan">
                <SelectValue placeholder="Pilih ODP" />
              </SelectTrigger>
              <SelectContent>
                {freeOdps.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name} · sisa {(n.meta?.portsTotal ?? 0) - (n.meta?.portsUsed ?? 0)} port
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <InstallAllocation
            ports={freePorts}
            selectedPort={selectedPort}
            onPortChange={setPortNo}
            loading={splittersQ.isLoading}
            dropMeters={dropMeters}
            hasOdp={Boolean(odp)}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={install.isPending}
          >
            Batal
          </Button>
          <Button type="button" onClick={submit} disabled={!canSubmit}>
            {install.isPending ? 'Memasang…' : 'Pasang'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
