import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { DataTable } from '@/components/shared/table/data-table'
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
import type { SimpleQueue } from '@/schemas/mikrotik'

import { useDeleteQueue, useQueues } from '../hooks/useMikrotik'
import { QueueFormDialog } from './QueueFormDialog'

export function QueuesTab({ routerId }: { routerId: string }) {
  const canManage = useCan('network.manage')
  const { data, isLoading, isError } = useQueues(routerId)
  const remove = useDeleteQueue(routerId)

  const [addOpen, setAddOpen] = useState(false)
  const [editQueue, setEditQueue] = useState<SimpleQueue | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<SimpleQueue | null>(null)

  const columns = useMemo<ColumnDef<SimpleQueue>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        meta: { title: 'Nama' },
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'target',
        header: 'Target',
        meta: { title: 'Target' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.target}</span>,
      },
      {
        accessorKey: 'maxLimit',
        header: 'Max limit',
        meta: { title: 'Max limit' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.maxLimit}</span>,
      },
      {
        id: 'actions',
        meta: { align: 'right' },
        enableHiding: false,
        cell: ({ row }) => {
          if (!canManage) return null
          const q = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi baris">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => setEditQueue(q)}>
                  <PencilIcon className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setConfirmDelete(q)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2Icon className="size-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [canManage],
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada queue."
        searchPlaceholder="Cari queue…"
        actions={
          canManage ? (
            <Button size="sm" className="h-8" onClick={() => setAddOpen(true)}>
              Tambah queue
            </Button>
          ) : null
        }
      />

      {canManage ? (
        <QueueFormDialog routerId={routerId} open={addOpen} onOpenChange={setAddOpen} />
      ) : null}
      {editQueue ? (
        <QueueFormDialog
          routerId={routerId}
          queue={editQueue}
          open
          onOpenChange={(o) => {
            if (!o) setEditQueue(null)
          }}
        />
      ) : null}

      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus queue?</AlertDialogTitle>
            <AlertDialogDescription>
              Queue "{confirmDelete?.name}" akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) remove.mutate(confirmDelete.id)
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
