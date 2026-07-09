import { DownloadIcon, PlugZapIcon, PowerOffIcon } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { downloadCsv } from '@/lib/csv'
import type { Customer } from '@/schemas/customer'

import type { useBulkCustomerStatus } from '../hooks/useCustomers'
import { toCsvRow } from './customersColumns'

type Props = {
  selected: Customer[]
  canNetwork: boolean
  bulkStatus: ReturnType<typeof useBulkCustomerStatus>
}

// Bulk-row actions for the customer table: isolate active rows, reactivate
// isolated rows (network permission), and export the current selection.
export function CustomersBulkActions({ selected, canNetwork, bulkStatus }: Props) {
  const toIsolate = selected.filter((c) => c.status === 'aktif')
  const toActivate = selected.filter((c) => c.status === 'isolir')

  return (
    <>
      {canNetwork && toIsolate.length > 0 ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive"
              disabled={bulkStatus.isPending}
            >
              <PowerOffIcon className="size-4" />
              Isolir ({toIsolate.length})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Isolir {toIsolate.length} pelanggan?</AlertDialogTitle>
              <AlertDialogDescription>
                Koneksi {toIsolate.length} pelanggan terpilih akan diputus (isolir) dan tidak dapat
                mengakses internet sampai diaktifkan kembali. Tindakan ini bisa dibalik lewat
                aktivasi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() =>
                  bulkStatus.mutate({
                    ids: toIsolate.map((c) => c.id),
                    action: 'isolate',
                  })
                }
              >
                Isolir ({toIsolate.length})
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
      {canNetwork && toActivate.length > 0 ? (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={bulkStatus.isPending}
          onClick={() =>
            bulkStatus.mutate({
              ids: toActivate.map((c) => c.id),
              action: 'activate',
            })
          }
        >
          <PlugZapIcon className="size-4" />
          Aktifkan ({toActivate.length})
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => downloadCsv('pelanggan-terpilih', selected.map(toCsvRow))}
      >
        <DownloadIcon className="size-4" />
        Export terpilih
      </Button>
    </>
  )
}
