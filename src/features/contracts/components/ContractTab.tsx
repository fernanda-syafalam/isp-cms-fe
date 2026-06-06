import { FileSignatureIcon, PrinterIcon, SendIcon } from 'lucide-react'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/auth'
import { statusLabel } from '@/lib/status-label'
import type { Customer } from '@/schemas/customer'
import type { ContractStatus } from '@/schemas/contract'

import {
  useContract,
  useCreateContract,
  useSendContract,
  useSignContract,
} from '../hooks/useContract'
import { PrintableContract } from './PrintableContract'

const STATUS_TONE: Record<ContractStatus, StatusTone> = {
  draft: 'neutral',
  sent: 'info',
  signed: 'success',
}

export function ContractTab({ customer }: { customer: Customer }) {
  const canEdit = useCan('customers.manage')
  const { data: contract, isLoading } = useContract(customer.id)
  const create = useCreateContract(customer.id)
  const send = useSendContract(customer.id)
  const sign = useSignContract(customer.id)

  if (isLoading) return <Skeleton className="h-64 w-full" />

  if (!contract) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <FileSignatureIcon className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Belum ada kontrak berlangganan.</p>
          {canEdit ? (
            <Button size="sm" disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? 'Membuat…' : 'Buat kontrak (PKS)'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={STATUS_TONE[contract.status]} label={statusLabel(contract.status)} />
        <span className="font-mono text-muted-foreground text-sm">{contract.number}</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canEdit && contract.status === 'draft' ? (
            <Button
              variant="outline"
              size="sm"
              disabled={send.isPending}
              onClick={() => send.mutate()}
            >
              <SendIcon className="size-4" />
              Kirim untuk TTD
            </Button>
          ) : null}
          {canEdit && contract.status === 'sent' ? (
            <Button size="sm" disabled={sign.isPending} onClick={() => sign.mutate()}>
              <FileSignatureIcon className="size-4" />
              Tandai ditandatangani
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <PrinterIcon className="size-4" />
            Cetak
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        <div id="print-document">
          <PrintableContract contract={contract} customerAddress={customer.address} />
        </div>
      </div>
    </div>
  )
}
