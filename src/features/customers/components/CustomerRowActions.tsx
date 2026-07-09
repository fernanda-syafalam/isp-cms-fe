import {
  ArrowLeftRightIcon,
  BanIcon,
  MapPinIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
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
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { RowActions } from '@/components/shared/row-actions'
import { useCan } from '@/features/auth'
import type { Customer } from '@/schemas/customer'

import { useResumeCustomer, useStopCustomer, useSuspendCustomer } from '../hooks/useCustomers'
import { ChangePlanDialog } from './ChangePlanDialog'
import { EditCustomerDialog } from './EditCustomerDialog'
import { RelocateCustomerDialog } from './RelocateCustomerDialog'

export function CustomerRowActions({ customer }: { customer: Customer }) {
  const [editOpen, setEditOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [relocateOpen, setRelocateOpen] = useState(false)
  const [stopOpen, setStopOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const canEdit = useCan('customers.manage')
  const canDelete = useCan('records.delete')
  const stop = useStopCustomer()
  const suspend = useSuspendCustomer()
  const resume = useResumeCustomer()

  const canStop = canDelete && customer.status !== 'berhenti'
  const canRelocate = canEdit && customer.status !== 'berhenti'
  const canSuspend = canEdit && customer.status === 'aktif'
  const canResume = canEdit && customer.status === 'isolir'
  if (!canEdit && !canStop) return null

  return (
    <>
      <RowActions contentClassName="w-40">
        {canEdit ? (
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon className="size-4" />
            Edit
          </DropdownMenuItem>
        ) : null}
        {canEdit ? (
          <DropdownMenuItem onSelect={() => setPlanOpen(true)}>
            <ArrowLeftRightIcon className="size-4" />
            Ganti paket
          </DropdownMenuItem>
        ) : null}
        {canRelocate ? (
          <DropdownMenuItem onSelect={() => setRelocateOpen(true)}>
            <MapPinIcon className="size-4" />
            Mutasi alamat
          </DropdownMenuItem>
        ) : null}
        {canSuspend ? (
          <DropdownMenuItem onSelect={() => setSuspendOpen(true)}>
            <PauseIcon className="size-4" />
            Berhenti sementara
          </DropdownMenuItem>
        ) : null}
        {canResume ? (
          <DropdownMenuItem onSelect={() => resume.mutate(customer.id)}>
            <PlayIcon className="size-4" />
            Aktifkan kembali
          </DropdownMenuItem>
        ) : null}
        {canStop ? (
          <DropdownMenuItem
            onSelect={() => setStopOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <BanIcon className="size-4" />
            Berhentikan
          </DropdownMenuItem>
        ) : null}
      </RowActions>

      {canEdit ? (
        <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}
      {canEdit ? (
        <ChangePlanDialog customer={customer} open={planOpen} onOpenChange={setPlanOpen} />
      ) : null}
      {canRelocate ? (
        <RelocateCustomerDialog
          customer={customer}
          open={relocateOpen}
          onOpenChange={setRelocateOpen}
        />
      ) : null}

      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Berhenti sementara?</AlertDialogTitle>
            <AlertDialogDescription>
              Pelanggan "{customer.fullName}" akan dijeda sementara dan koneksinya dinonaktifkan.
              Tindakan ini bisa dibalik lewat aktivasi kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => suspend.mutate(customer.id)}>
              Berhenti sementara
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={stopOpen} onOpenChange={setStopOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Berhentikan pelanggan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pelanggan "{customer.fullName}" akan ditandai berhenti dan koneksinya dinonaktifkan.
              Tindakan ini bisa diubah lewat aktivasi ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => stop.mutate(customer.id)}>
              Berhentikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
