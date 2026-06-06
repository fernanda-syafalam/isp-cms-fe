import {
  MoreHorizontalIcon,
  PackageOpenIcon,
  PencilIcon,
  Trash2Icon,
  TriangleAlertIcon,
  Undo2Icon,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCan } from '@/features/auth'
import type { InventoryItem } from '@/schemas/inventory'

import { useDeleteInventory, useMoveInventory } from '../hooks/useInventory'
import { AssignInventoryDialog } from './AssignInventoryDialog'
import { EditInventoryDialog } from './EditInventoryDialog'

export function InventoryRowActions({ item }: { item: InventoryItem }) {
  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [brokenOpen, setBrokenOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const canManage = useCan('network.manage')
  const canDelete = useCan('records.delete')
  const remove = useDeleteInventory()
  const move = useMoveInventory(item.id)

  const canAssign = canManage && item.status === 'warehouse'
  const canReturn = canManage && item.status !== 'warehouse'
  const canMarkBroken = canManage && item.status !== 'broken'

  if (!canManage && !canDelete) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi baris">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {canManage ? (
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <PencilIcon className="size-4" />
              Edit
            </DropdownMenuItem>
          ) : null}
          {canAssign ? (
            <DropdownMenuItem onSelect={() => setAssignOpen(true)}>
              <PackageOpenIcon className="size-4" />
              Keluarkan (pasang)
            </DropdownMenuItem>
          ) : null}
          {canReturn ? (
            <DropdownMenuItem onSelect={() => setReturnOpen(true)}>
              <Undo2Icon className="size-4" />
              Kembalikan ke gudang
            </DropdownMenuItem>
          ) : null}
          {canMarkBroken ? (
            <DropdownMenuItem onSelect={() => setBrokenOpen(true)}>
              <TriangleAlertIcon className="size-4" />
              Tandai rusak
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
        </DropdownMenuContent>
      </DropdownMenu>

      {canManage ? (
        <EditInventoryDialog item={item} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}
      {canAssign ? (
        <AssignInventoryDialog item={item} open={assignOpen} onOpenChange={setAssignOpen} />
      ) : null}

      <AlertDialog open={returnOpen} onOpenChange={setReturnOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kembalikan ke gudang?</AlertDialogTitle>
            <AlertDialogDescription>
              Item "{item.serial}" akan dikembalikan ke gudang dan dilepas dari pelanggan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => move.mutate({ type: 'return' })}>
              Kembalikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={brokenOpen} onOpenChange={setBrokenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai rusak?</AlertDialogTitle>
            <AlertDialogDescription>
              Item "{item.serial}" akan ditandai rusak dan keluar dari stok terpakai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => move.mutate({ type: 'broken' })}
            >
              Tandai rusak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item?</AlertDialogTitle>
            <AlertDialogDescription>
              Item "{item.serial}" akan dihapus permanen dari inventaris.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => remove.mutate(item.id)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
