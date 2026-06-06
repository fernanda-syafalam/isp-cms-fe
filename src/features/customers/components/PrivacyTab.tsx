import { DownloadIcon, ShieldCheckIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { StatusBadge } from '@/components/shared/status-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCan } from '@/features/auth'
import { formatDateTime } from '@/lib/format'
import type { Customer } from '@/schemas/customer'
import type { Invoice } from '@/schemas/invoice'
import type { Ticket } from '@/schemas/ticket'

import { useRecordConsent, useRequestDataDeletion } from '../hooks/useCustomers'
import { KycDialog } from './KycDialog'

type Props = {
  customer: Customer
  invoices: Invoice[] | undefined
  tickets: Ticket[] | undefined
}

export function PrivacyTab({ customer, invoices, tickets }: Props) {
  const canEdit = useCan('customers.manage')
  const canDelete = useCan('records.delete')
  const consent = useRecordConsent(customer.id)
  const deletion = useRequestDataDeletion(customer.id)
  const [kycOpen, setKycOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Data Subject Access Request — download everything we hold on this customer.
  const handleExport = () => {
    const bundle = {
      customer,
      invoices: invoices ?? [],
      tickets: tickets ?? [],
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-${customer.customerNo}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Persetujuan (UU PDP)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <StatusBadge
              tone={customer.consentAt ? 'success' : 'warning'}
              label={customer.consentAt ? 'Diberikan' : 'Belum'}
            />
            {customer.consentAt ? (
              <span className="text-muted-foreground text-sm">
                {formatDateTime(customer.consentAt)}
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">
            Persetujuan pemrosesan data pribadi pelanggan sesuai UU No. 27/2022.
          </p>
          {canEdit && !customer.consentAt ? (
            <Button size="sm" disabled={consent.isPending} onClick={() => consent.mutate()}>
              <ShieldCheckIcon className="size-4" />
              Catat persetujuan
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">KYC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground text-xs">NIK / KTP</dt>
              <dd className="font-mono">{customer.ktp ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground text-xs">NPWP</dt>
              <dd className="font-mono">{customer.npwp ?? '—'}</dd>
            </div>
          </dl>
          {canEdit ? (
            <Button variant="outline" size="sm" onClick={() => setKycOpen(true)}>
              Edit KYC
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Hak subjek data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <DownloadIcon className="size-4" />
            Ekspor data (DSAR)
          </Button>
          {canDelete ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={deletion.isPending}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon className="size-4" />
              Ajukan hapus data
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {canEdit ? <KycDialog customer={customer} open={kycOpen} onOpenChange={setKycOpen} /> : null}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajukan penghapusan data?</AlertDialogTitle>
            <AlertDialogDescription>
              Permintaan penghapusan data pribadi "{customer.fullName}" akan dicatat untuk
              ditindaklanjuti sesuai UU PDP. Data historis penagihan tetap disimpan sesuai kewajiban
              retensi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletion.mutate()}>Ajukan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
