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

import { useInstallCustomer } from '../hooks/useCabling'
import { fiberId, formatLength, nearestFreeOdp, segmentMeters } from '../lib/graph'
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

  const odp = nodes.find((n) => n.id === odpId)
  const nextPort = (odp?.meta?.portsUsed ?? 0) + 1
  const previewCore = fiberId(nextPort).core
  const dropMeters = odp ? segmentMeters(odp, point) : 0
  const canSubmit = Boolean(customerId && odp) && !install.isPending

  const submit = async () => {
    if (!customerId || !odp) return
    try {
      const node = await install.mutateAsync({
        customerId,
        odpId: odp.id,
        lat: point.lat,
        lng: point.lng,
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

          {odp ? (
            <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Alokasi:</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-3 shrink-0 rounded-full border border-border"
                  style={{ background: previewCore.hex }}
                />
                Port #{nextPort} {previewCore.name}
              </span>
              <span className="ml-auto font-mono text-muted-foreground tabular-nums">
                drop ≈ {formatLength(dropMeters)}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Tidak ada ODP dengan port tersisa.</p>
          )}
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
