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
import type { Reseller } from '@/schemas/reseller'

import { useUpdateReseller } from '../hooks/useResellers'
import { EditResellerDialog } from './EditResellerDialog'

export function ResellerRowActions({ reseller }: { reseller: Reseller }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const canManage = useCan('resellers.manage')
  const canDelete = useCan('records.delete')
  const update = useUpdateReseller(reseller.id)

  const canDeactivate = canDelete && reseller.status === 'active'
  if (!canManage && !canDeactivate) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi baris">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {canManage ? (
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <PencilIcon className="size-4" />
              Edit
            </DropdownMenuItem>
          ) : null}
          {canDeactivate ? (
            <DropdownMenuItem
              onSelect={() => setDeactivateOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <BanIcon className="size-4" />
              Nonaktifkan
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canManage ? (
        <EditResellerDialog reseller={reseller} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan reseller?</AlertDialogTitle>
            <AlertDialogDescription>
              Reseller "{reseller.name}" akan dinonaktifkan dan tidak menerima komisi baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => update.mutate({ status: 'inactive' })}
            >
              Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
