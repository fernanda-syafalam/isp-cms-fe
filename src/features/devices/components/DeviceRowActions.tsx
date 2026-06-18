import { PencilIcon, Trash2Icon } from 'lucide-react'
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
import { RowActions } from '@/components/shared/row-actions'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useCan } from '@/features/auth'
import type { Device } from '@/schemas/device'

import { useDeleteDevice } from '../hooks/useDevices'
import { EditDeviceDialog } from './EditDeviceDialog'

export function DeviceRowActions({ device }: { device: Device }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const canManage = useCan('network.manage')
  const canDelete = useCan('records.delete')
  const remove = useDeleteDevice()

  if (!canManage && !canDelete) return null

  return (
    <>
      <RowActions>
        {canManage ? (
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon className="size-4" />
            Edit
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2Icon className="size-4" />
            Hapus
          </DropdownMenuItem>
        ) : null}
      </RowActions>

      {canManage ? (
        <EditDeviceDialog device={device} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus perangkat?</AlertDialogTitle>
            <AlertDialogDescription>
              Perangkat "{device.name}" akan dihapus dari armada terkelola. Tindakan ini permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => remove.mutate(device.id)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
