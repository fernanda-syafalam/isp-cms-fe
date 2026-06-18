import { BellRingIcon, PlayIcon, PowerOffIcon } from 'lucide-react'

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
import { useCan } from '@/features/auth'

import { useIsolirOverdue, useRemindOverdue, useRunBilling } from '../hooks/useBilling'
import { SchedulerDialog } from './SchedulerDialog'

export function BillingActions() {
  const canRun = useCan('billing.run')
  const runBilling = useRunBilling()
  const remind = useRemindOverdue()
  const isolir = useIsolirOverdue()

  if (!canRun) return null

  return (
    <>
      <SchedulerDialog />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" disabled={runBilling.isPending}>
            <PlayIcon className="size-4" />
            <span className="hidden sm:inline">Jalankan Billing</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Jalankan billing periode ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Membuat tagihan periode berjalan untuk semua pelanggan aktif yang belum ditagih (jatuh
              tempo 10 hari). Pelanggan yang sudah punya tagihan periode ini dilewati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => runBilling.mutate()}>Jalankan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" disabled={remind.isPending}>
            <BellRingIcon className="size-4" />
            <span className="hidden sm:inline">Kirim pengingat</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim pengingat ke semua penunggak?</AlertDialogTitle>
            <AlertDialogDescription>
              Mengirim pengingat pembayaran via WhatsApp ke semua pelanggan dengan tagihan jatuh
              tempo (overdue). Gunakan ini sebelum isolir massal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => remind.mutate(undefined)}>
              Kirim pengingat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" disabled={isolir.isPending}>
            <PowerOffIcon className="size-4" />
            <span className="hidden sm:inline">Isolir massal</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Isolir semua penunggak?</AlertDialogTitle>
            <AlertDialogDescription>
              Tagihan yang lewat jatuh tempo ditandai overdue (denda Rp25.000), lalu semua pelanggan
              aktif yang menunggak akan diisolir. Tindakan ini bisa dibalik lewat aktivasi /
              pembayaran.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => isolir.mutate()}>
              Isolir massal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
