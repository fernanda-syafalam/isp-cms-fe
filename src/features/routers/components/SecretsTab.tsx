import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import {
  BanIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
  UnplugIcon,
} from 'lucide-react'
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
import { useTableQuery } from '@/hooks/useTableQuery'
import type { PppSecretListItem } from '@/schemas/mikrotik'

import {
  useDeleteSecret,
  useDisconnectSession,
  useProfiles,
  useSecrets,
  useUpdateSecret,
} from '../hooks/useMikrotik'
import { SecretFormDialog } from './SecretFormDialog'

// Stateless display columns (no component callbacks) — hoisted so they are not
// rebuilt per render. The live connection state (online/address/uptime) is
// denormalized onto each list item server-side, so this tab no longer fetches
// the sessions endpoint. Sortable keys match the backend whitelist
// (username, profileName, customerName, disabled).
const DISPLAY_COLUMNS: ColumnDef<PppSecretListItem>[] = [
  {
    accessorKey: 'username',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
    meta: { title: 'Username' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.username}</span>,
  },
  {
    accessorKey: 'profileName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Profil" />,
    meta: { title: 'Profil' },
  },
  {
    accessorKey: 'customerName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pelanggan" />,
    meta: { title: 'Pelanggan' },
    cell: ({ row }) =>
      row.original.customerId ? (
        <Link
          to="/customers/$customerId"
          params={{ customerId: row.original.customerId }}
          className="font-medium hover:underline"
        >
          {row.original.customerName}
        </Link>
      ) : (
        (row.original.customerName ?? '—')
      ),
  },
  {
    accessorKey: 'disabled',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: 'Status' },
    cell: ({ row }) =>
      row.original.disabled ? (
        <StatusBadge tone="neutral" label="Nonaktif" />
      ) : (
        <StatusBadge tone="success" label="Aktif" />
      ),
  },
  {
    id: 'connection',
    header: 'Koneksi',
    meta: { title: 'Koneksi' },
    enableSorting: false,
    cell: ({ row }) => {
      const { online, address, uptime } = row.original
      if (!online) return <StatusBadge tone="neutral" label="Offline" />
      return (
        <div className="flex flex-col gap-0.5">
          <StatusBadge tone="success" label="Online" />
          <span className="font-mono text-muted-foreground text-xs">
            {address} · {uptime}
          </span>
        </div>
      )
    },
  },
]

type ActionHandlers = {
  onEdit: (secret: PppSecretListItem) => void
  onToggleDisabled: (secret: PppSecretListItem) => void
  onDisconnect: (sessionId: string) => void
  onDelete: (secret: PppSecretListItem) => void
}

function buildActionsColumn(handlers: ActionHandlers): ColumnDef<PppSecretListItem> {
  return {
    id: 'actions',
    meta: { align: 'right' },
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const s = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi baris">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => handlers.onEdit(s)}>
              <PencilIcon className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handlers.onToggleDisabled(s)}>
              {s.disabled ? <PlayIcon className="size-4" /> : <BanIcon className="size-4" />}
              {s.disabled ? 'Aktifkan' : 'Nonaktifkan'}
            </DropdownMenuItem>
            {s.sessionId ? (
              <DropdownMenuItem
                onSelect={() => {
                  if (s.sessionId) handlers.onDisconnect(s.sessionId)
                }}
              >
                <UnplugIcon className="size-4" />
                Putus sesi
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => handlers.onDelete(s)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon className="size-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
}

export function SecretsTab({ routerId }: { routerId: string }) {
  const canManage = useCan('network.manage')
  const table = useTableQuery({ pageSize: 20 })
  const { data, isLoading, isError } = useSecrets(routerId, table.params)
  const { data: profilesData } = useProfiles(routerId)
  const update = useUpdateSecret(routerId)
  const remove = useDeleteSecret(routerId)
  const disconnect = useDisconnectSession(routerId)

  const [addOpen, setAddOpen] = useState(false)
  const [editSecret, setEditSecret] = useState<PppSecretListItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PppSecretListItem | null>(null)

  const profiles = profilesData?.items ?? []
  const total = data?.total ?? 0

  const columns = useMemo<ColumnDef<PppSecretListItem>[]>(() => {
    if (!canManage) return DISPLAY_COLUMNS
    return [
      ...DISPLAY_COLUMNS,
      buildActionsColumn({
        onEdit: setEditSecret,
        onToggleDisabled: (s) => update.mutate({ id: s.id, input: { disabled: !s.disabled } }),
        onDisconnect: (sessionId) => disconnect.mutate(sessionId),
        onDelete: setConfirmDelete,
      }),
    ]
  }, [canManage, update, disconnect])

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          table.search
            ? `Tidak ada secret cocok dengan "${table.search}".`
            : 'Belum ada PPPoE secret.'
        }
        searchPlaceholder="Cari username / pelanggan…"
        server={{
          pageIndex: table.pageIndex,
          pageSize: table.pageSize,
          rowCount: total,
          sorting: table.sorting,
          search: table.search,
          onPaginationChange: table.onPaginationChange,
          onSortingChange: table.onSortingChange,
          onSearchChange: table.onSearchChange,
        }}
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
