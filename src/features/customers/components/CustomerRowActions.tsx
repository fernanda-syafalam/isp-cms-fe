import { BanIcon, MoreHorizontalIcon, PencilIcon } from 'lucide-react'
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
import type { Customer } from '@/schemas/customer'

import { useStopCustomer } from '../hooks/useCustomers'
import { EditCustomerDialog } from './EditCustomerDialog'

export function CustomerRowActions({ customer }: { customer: Customer }) {
  const [editOpen, setEditOpen] = useState(false)
  const [stopOpen, setStopOpen] = useState(false)
  const canEdit = useCan('customers.manage')
  const canDelete = useCan('records.delete')
  const stop = useStopCustomer()

  const canStop = canDelete && customer.status !== 'berhenti'
  if (!canEdit && !canStop) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi baris">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {canEdit ? (
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <PencilIcon className="size-4" />
              Edit
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
        </DropdownMenuContent>
      </DropdownMenu>

      {canEdit ? (
        <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
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
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => stop.mutate(customer.id)}
            >
              Berhentikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
