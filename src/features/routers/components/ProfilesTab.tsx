import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCan } from '@/features/auth'
import type { PppProfile } from '@/schemas/mikrotik'

import { useDeleteProfile, useProfiles } from '../hooks/useMikrotik'
import { ProfileFormDialog } from './ProfileFormDialog'

export function ProfilesTab({ routerId }: { routerId: string }) {
  const canManage = useCan('network.manage')
  const { data, isLoading, isError } = useProfiles(routerId)
  const remove = useDeleteProfile(routerId)

  const [addOpen, setAddOpen] = useState(false)
  const [editProfile, setEditProfile] = useState<PppProfile | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PppProfile | null>(null)

  const columns = useMemo<ColumnDef<PppProfile>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        meta: { title: 'Nama' },
        cell: ({ row }) => (
          <span className="flex items-center gap-2 font-medium">
            {row.original.name}
            {row.original.isIsolir ? (
              <StatusBadge tone="danger" label="Isolir" dot={false} />
            ) : null}
          </span>
        ),
      },
      {
        accessorKey: 'rateLimit',
        header: 'Rate limit',
        meta: { title: 'Rate limit' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.rateLimit}</span>,
      },
      {
        id: 'actions',
        meta: { align: 'right' },
        enableHiding: false,
        cell: ({ row }) => {
          if (!canManage) return null
          const p = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi baris">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => setEditProfile(p)}>
                  <PencilIcon className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setConfirmDelete(p)}
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
        emptyMessage="Belum ada profil."
        searchPlaceholder="Cari profil…"
        actions={
          canManage ? (
            <Button size="sm" className="h-8" onClick={() => setAddOpen(true)}>
              Tambah profil
            </Button>
          ) : null
        }
      />

      {canManage ? (
        <ProfileFormDialog routerId={routerId} open={addOpen} onOpenChange={setAddOpen} />
      ) : null}
      {editProfile ? (
        <ProfileFormDialog
          routerId={routerId}
          profile={editProfile}
          open
          onOpenChange={(o) => {
            if (!o) setEditProfile(null)
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
            <AlertDialogTitle>Hapus profil?</AlertDialogTitle>
            <AlertDialogDescription>
              Profil "{confirmDelete?.name}" akan dihapus. Secret yang masih memakainya perlu
              dipindah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
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
