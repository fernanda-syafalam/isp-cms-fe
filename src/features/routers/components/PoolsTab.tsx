import type { ColumnDef } from '@tanstack/react-table'
import { Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { StatusBadge } from '@/components/shared/status-badge'
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
import { useCan } from '@/features/auth'
import type { IpPool } from '@/schemas/mikrotik'

import { useDeletePool, usePools } from '../hooks/useMikrotik'
import { PoolFormDialog } from './PoolFormDialog'

export function PoolsTab({ routerId }: { routerId: string }) {
  const canManage = useCan('network.manage')
  const { data, isLoading, isError } = usePools(routerId)
  const remove = useDeletePool(routerId)

  const [addOpen, setAddOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<IpPool | null>(null)

  const columns = useMemo<ColumnDef<IpPool>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        meta: { title: 'Nama' },
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'ranges',
        header: 'Rentang',
        meta: { title: 'Rentang' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.ranges}</span>,
      },
      {
        accessorKey: 'usedAddresses',
        header: 'Kapasitas',
        meta: { title: 'Kapasitas', align: 'right' },
        cell: ({ row }) => {
          const { usedAddresses, totalAddresses } = row.original
          const full = totalAddresses > 0 && usedAddresses >= totalAddresses
          return (
            <span className="flex items-center justify-end gap-2">
              <span className="font-mono tabular-nums">
                {usedAddresses}/{totalAddresses}
              </span>
              {full ? <StatusBadge tone="danger" label="Penuh" /> : null}
            </span>
          )
        },
      },
      {
        id: 'actions',
        meta: { align: 'right' },
        enableHiding: false,
        cell: ({ row }) =>
          canManage ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Hapus pool"
              onClick={() => setConfirmDelete(row.original)}
            >
              <Trash2Icon className="size-4" />
            </Button>
          ) : null,
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
        emptyMessage="Belum ada IP pool."
        searchPlaceholder="Cari pool…"
        actions={
          canManage ? (
            <Button size="sm" className="h-8" onClick={() => setAddOpen(true)}>
              Tambah pool
            </Button>
          ) : null
        }
      />

      {canManage ? (
        <PoolFormDialog routerId={routerId} open={addOpen} onOpenChange={setAddOpen} />
      ) : null}

      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus IP pool?</AlertDialogTitle>
            <AlertDialogDescription>
              Pool "{confirmDelete?.name}" akan dihapus.
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
