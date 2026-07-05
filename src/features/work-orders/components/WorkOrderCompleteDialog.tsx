import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type CompleteWorkOrderInput, CompleteWorkOrderInputSchema } from '@/schemas/workorder'
import type { WorkOrder } from '@/schemas/workorder'

import { useCompleteWorkOrder } from '../hooks/useWorkOrders'
import { WorkOrderCompleteFields } from './WorkOrderCompleteFields'

type Props = {
  workOrder: WorkOrder
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Field-completion form (P3.B.3). Every field is optional so a technician can
// complete with a full evidence set OR just tap "Selesaikan" for a quick close
// (an empty submit posts no body).
export function WorkOrderCompleteDialog({ workOrder, open, onOpenChange }: Props) {
  const complete = useCompleteWorkOrder()
  const form = useForm<CompleteWorkOrderInput>({
    resolver: zodResolver(CompleteWorkOrderInputSchema),
    defaultValues: {},
  })
  const isInstall = workOrder.type === 'install'

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await complete.mutateAsync({ id: workOrder.id, input: values })
      form.reset({})
      onOpenChange(false)
    } catch {
      // the mutation hook surfaces a toast
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selesaikan {workOrder.code}</DialogTitle>
          <DialogDescription>
            {isInstall
              ? `Menyelesaikan akan mengaktifkan "${workOrder.customerName}", provisioning koneksi, dan membuat tagihan pertama. Bukti lapangan opsional.`
              : 'Lengkapi bukti lapangan (opsional), lalu tandai selesai.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <WorkOrderCompleteFields form={form} />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={complete.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={complete.isPending}>
              {complete.isPending ? 'Menyelesaikan…' : 'Selesaikan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
