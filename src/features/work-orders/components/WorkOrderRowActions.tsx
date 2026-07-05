import { CheckCircle2Icon, PlayIcon, XCircleIcon } from 'lucide-react'
import { useState } from 'react'

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
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { RowActions } from '@/components/shared/row-actions'
import { useCan } from '@/features/auth'
import type { WorkOrder } from '@/schemas/workorder'

import { useCancelWorkOrder, useCompleteWorkOrder, useStartWorkOrder } from '../hooks/useWorkOrders'

export function WorkOrderRowActions({ workOrder }: { workOrder: WorkOrder }) {
  const [open, setOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const canManage = useCan('network.manage')
  const complete = useCompleteWorkOrder()
  const start = useStartWorkOrder()
  const cancel = useCancelWorkOrder()

  const isOpen = workOrder.status === 'scheduled' || workOrder.status === 'in_progress'
  // No actions for a done/cancelled order, or without the manage permission.
  if (!canManage || !isOpen) return null

  const isInstall = workOrder.type === 'install'

  return (
    <>
      <RowActions>
        {workOrder.status === 'scheduled' ? (
          <DropdownMenuItem onSelect={() => start.mutate(workOrder.id)} disabled={start.isPending}>
            <PlayIcon className="size-4" />
            Mulai
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={() => setOpen(true)}>
          <CheckCircle2Icon className="size-4" />
          Selesaikan
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => setCancelOpen(true)}>
          <XCircleIcon className="size-4" />
          Batalkan
        </DropdownMenuItem>
      </RowActions>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan work order?</AlertDialogTitle>
            <AlertDialogDescription>
              {workOrder.code} akan ditandai dibatalkan dan tidak bisa dilanjutkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tutup</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancel.isPending}
              onClick={() => cancel.mutate(workOrder.id)}
            >
              {cancel.isPending ? 'Membatalkan…' : 'Batalkan WO'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Selesaikan work order?</AlertDialogTitle>
            <AlertDialogDescription>
              {isInstall
                ? `Menyelesaikan ${workOrder.code} akan mengaktifkan "${workOrder.customerName}", melakukan provisioning koneksi, dan membuat tagihan pertama.`
                : `Tandai ${workOrder.code} selesai.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={complete.isPending}
              onClick={() => complete.mutate(workOrder.id)}
            >
              {complete.isPending ? 'Menyelesaikan…' : 'Selesaikan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
