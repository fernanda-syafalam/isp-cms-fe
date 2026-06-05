import type { ColumnDef } from '@tanstack/react-table'
import { BanIcon, MoreHorizontalIcon, PencilIcon, PlayIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCan } from '@/features/auth'
import type { PppSecret } from '@/schemas/mikrotik'

import { useDeleteSecret, useProfiles, useSecrets, useUpdateSecret } from '../hooks/useMikrotik'
import { SecretFormDialog } from './SecretFormDialog'

export function SecretsTab({ routerId }: { routerId: string }) {
  const canManage = useCan('network.manage')
  const { data, isLoading, isError } = useSecrets(routerId)
  const { data: profilesData } = useProfiles(routerId)
  const update = useUpdateSecret(routerId)
  const remove = useDeleteSecret(routerId)

  const [addOpen, setAddOpen] = useState(false)
  const [editSecret, setEditSecret] = useState<PppSecret | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PppSecret | null>(null)

  const profiles = profilesData?.items ?? []

  const columns = useMemo<ColumnDef<PppSecret>[]>(
    () => [
      {
        accessorKey: 'username',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
        meta: { title: 'Username' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.username}</span>,
      },
      {
        accessorKey: 'profileName',
        header: 'Profil',
        meta: { title: 'Profil' },
      },
      {
        accessorKey: 'customerName',
        header: 'Pelanggan',
        meta: { title: 'Pelanggan' },
        cell: ({ row }) => row.original.customerName ?? '—',
      },
      {
        accessorKey: 'disabled',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) =>
          row.original.disabled ? (
            <StatusBadge tone="neutral" label="Nonaktif" />
          ) : (
            <StatusBadge tone="success" label="Aktif" />
          ),
      },
      {
        id: 'actions',
        meta: { align: 'right' },
        enableHiding: false,
        cell: ({ row }) => {
          if (!canManage) return null
          const s = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi baris">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => setEditSecret(s)}>
                  <PencilIcon className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    update.mutate({
                      id: s.id,
                      input: { disabled: !s.disabled },
                    })
                  }
                >
                  {s.disabled ? <PlayIcon className="size-4" /> : <BanIcon className="size-4" />}
                  {s.disabled ? 'Aktifkan' : 'Nonaktifkan'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setConfirmDelete(s)}
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
    [canManage, update],
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada PPPoE secret."
        searchPlaceholder="Cari username / pelanggan…"
        actions={
          canManage ? (
            <Button size="sm" className="h-8" onClick={() => setAddOpen(true)}>
              Tambah secret
            </Button>
          ) : null
        }
      />

      {canManage ? (
        <SecretFormDialog
          routerId={routerId}
          profiles={profiles}
          open={addOpen}
          onOpenChange={setAddOpen}
        />
      ) : null}
      {editSecret ? (
        <SecretFormDialog
          routerId={routerId}
          profiles={profiles}
          secret={editSecret}
          open
          onOpenChange={(o) => {
            if (!o) setEditSecret(null)
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
            <AlertDialogTitle>Hapus secret?</AlertDialogTitle>
            <AlertDialogDescription>
              Secret "{confirmDelete?.username}" akan dihapus dari router.
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
