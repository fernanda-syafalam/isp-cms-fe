import { CheckCircle2Icon, MoreHorizontalIcon } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCan } from '@/features/auth'
import type { WorkOrder } from '@/schemas/workorder'

import { useCompleteWorkOrder } from '../hooks/useWorkOrders'

export function WorkOrderRowActions({ workOrder }: { workOrder: WorkOrder }) {
  const [open, setOpen] = useState(false)
  const canManage = useCan('network.manage')
  const complete = useCompleteWorkOrder()

  const canComplete =
    canManage && (workOrder.status === 'scheduled' || workOrder.status === 'in_progress')
  if (!canComplete) return null

  const isInstall = workOrder.type === 'install'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi baris">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <CheckCircle2Icon className="size-4" />
            Selesaikan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
