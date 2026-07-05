import {
  CalendarClockIcon,
  CheckCircle2Icon,
  PlayIcon,
  UserPlusIcon,
  XCircleIcon,
} from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RowActions } from '@/components/shared/row-actions'
import { useCan } from '@/features/auth'
import type { WorkOrder } from '@/schemas/workorder'

import {
  useAssignWorkOrder,
  useCancelWorkOrder,
  useRescheduleWorkOrder,
  useStartWorkOrder,
} from '../hooks/useWorkOrders'
import { WorkOrderCompleteDialog } from './WorkOrderCompleteDialog'

export function WorkOrderRowActions({ workOrder }: { workOrder: WorkOrder }) {
  const [open, setOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [technician, setTechnician] = useState(workOrder.technician ?? '')
  const [scheduledAt, setScheduledAt] = useState(workOrder.scheduledAt.slice(0, 10))
  const canManage = useCan('network.manage')
  const start = useStartWorkOrder()
  const cancel = useCancelWorkOrder()
  const assign = useAssignWorkOrder()
  const reschedule = useRescheduleWorkOrder()

  const isOpen = workOrder.status === 'scheduled' || workOrder.status === 'in_progress'
  // No actions for a done/cancelled order, or without the manage permission.
  if (!canManage || !isOpen) return null

  const handleAssign = () => {
    assign.mutate({ id: workOrder.id, technician }, { onSuccess: () => setAssignOpen(false) })
  }
  const handleReschedule = () => {
    reschedule.mutate(
      { id: workOrder.id, scheduledAt },
      { onSuccess: () => setRescheduleOpen(false) },
    )
  }

  return (
    <>
      <RowActions>
        {workOrder.status === 'scheduled' ? (
          <DropdownMenuItem onSelect={() => start.mutate(workOrder.id)} disabled={start.isPending}>
            <PlayIcon className="size-4" />
            Mulai
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={() => setAssignOpen(true)}>
          <UserPlusIcon className="size-4" />
          Tugaskan teknisi
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setRescheduleOpen(true)}>
          <CalendarClockIcon className="size-4" />
          Jadwal ulang
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setOpen(true)}>
          <CheckCircle2Icon className="size-4" />
          Selesaikan
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => setCancelOpen(true)}>
          <XCircleIcon className="size-4" />
          Batalkan
        </DropdownMenuItem>
      </RowActions>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tugaskan teknisi</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="wo-technician">Nama teknisi</Label>
            <Input
              id="wo-technician"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder="mis. Teknisi Andi"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={assign.isPending || technician.trim().length === 0}
              onClick={handleAssign}
            >
              {assign.isPending ? 'Menyimpan…' : 'Tugaskan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jadwal ulang work order</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="wo-schedule">Tanggal instalasi</Label>
            <Input
              id="wo-schedule"
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={reschedule.isPending || scheduledAt.length === 0}
              onClick={handleReschedule}
            >
              {reschedule.isPending ? 'Menyimpan…' : 'Simpan jadwal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <WorkOrderCompleteDialog workOrder={workOrder} open={open} onOpenChange={setOpen} />
    </>
  )
}
