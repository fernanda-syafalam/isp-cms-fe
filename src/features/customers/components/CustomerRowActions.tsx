import { ArrowLeftRightIcon, BanIcon, EyeIcon, PencilIcon } from 'lucide-react'
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

import { useStopCustomer } from '../hooks/useCustomers'
import { ChangePlanDialog } from './ChangePlanDialog'
import { EditCustomerDialog } from './EditCustomerDialog'

type Props = {
  customer: Customer
  /**
   * Opens the quick-view drawer for this customer. When provided, a keyboard-
   * reachable "Lihat cepat" item is added to the menu so keyboard/SR users can
   * open the same drawer the mouse row-click opens (the row `<tr>` click is
   * mouse-only). Omitted where the menu is not on a list row (e.g. the drawer
   * itself), so no item is shown there.
   */
  onQuickView?: () => void
}

export function CustomerRowActions({ customer, onQuickView }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [stopOpen, setStopOpen] = useState(false)
  const canEdit = useCan('customers.manage')
  const canDelete = useCan('records.delete')
  const stop = useStopCustomer()

  const canStop = canDelete && customer.status !== 'berhenti'
  if (!canEdit && !canStop && !onQuickView) return null

  return (
    <>
      <RowActions contentClassName="w-40">
        {onQuickView ? (
          <DropdownMenuItem onSelect={() => onQuickView()}>
            <EyeIcon className="size-4" />
            Lihat cepat
          </DropdownMenuItem>
        ) : null}
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
