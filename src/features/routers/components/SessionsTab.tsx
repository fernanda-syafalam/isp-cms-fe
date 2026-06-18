import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { PlugIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

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
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import type { PppSession } from '@/schemas/mikrotik'

import { useDisconnectSession, useSessions } from '../hooks/useMikrotik'

// Stateless display columns. Customer + profile are denormalized onto each
// session server-side, so this tab no longer fetches the secrets endpoint.
// Sortable keys match the backend whitelist (username, address, customerName,
// profileName); uptime is a human string and is intentionally not sortable.
const DISPLAY_COLUMNS: ColumnDef<PppSession>[] = [
  {
    accessorKey: 'username',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
    meta: { title: 'Username' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.username}</span>,
  },
  {
    accessorKey: 'customerName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pelanggan" />,
    meta: { title: 'Pelanggan' },
    cell: ({ row }) => {
      const { customerId, customerName } = row.original
      if (!customerName) return <span className="text-muted-foreground">—</span>
      return customerId ? (
        <Link
          to="/customers/$customerId"
          params={{ customerId }}
          className="font-medium hover:underline"
        >
          {customerName}
        </Link>
      ) : (
        customerName
      )
    },
  },
  {
    accessorKey: 'profileName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Profil" />,
    meta: { title: 'Profil' },
    cell: ({ row }) => row.original.profileName || <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'address',
    header: ({ column }) => <DataTableColumnHeader column={column} title="IP" />,
    meta: { title: 'IP' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.address}</span>,
  },
  {
    accessorKey: 'uptime',
    header: 'Uptime',
    meta: { title: 'Uptime' },
    enableSorting: false,
  },
  {
    accessorKey: 'callerId',
    header: 'MAC',
    meta: { title: 'MAC' },
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.callerId}</span>,
  },
]

export function SessionsTab({ routerId }: { routerId: string }) {
  const canManage = useCan('network.manage')
  const table = useTableQuery({ pageSize: 20 })
  const { data, isLoading, isError } = useSessions(routerId, table.params)
  const disconnect = useDisconnectSession(routerId)
  const [confirm, setConfirm] = useState<PppSession | null>(null)

  const total = data?.total ?? 0

  const columns = useMemo<ColumnDef<PppSession>[]>(() => {
    if (!canManage) return DISPLAY_COLUMNS
    return [
      ...DISPLAY_COLUMNS,
      {
        id: 'actions',
        meta: { align: 'right' },
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-destructive"
            onClick={() => setConfirm(row.original)}
          >
            <PlugIcon className="size-4" />
            Putus
          </Button>
        ),
      },
    ]
  }, [canManage])

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          table.search ? `Tidak ada sesi cocok dengan "${table.search}".` : 'Tidak ada sesi aktif.'
        }
        searchPlaceholder="Cari username / IP / pelanggan…"
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
      />

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => {
          if (!o) setConfirm(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Putus sesi?</AlertDialogTitle>
            <AlertDialogDescription>
              Sesi "{confirm?.username}" ({confirm?.address}) akan diputus dari router.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (confirm) disconnect.mutate(confirm.id)
              }}
            >
              Putus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
