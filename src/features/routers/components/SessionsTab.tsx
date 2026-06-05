import type { ColumnDef } from '@tanstack/react-table'
import { PlugIcon } from 'lucide-react'
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
import { useCan } from '@/features/auth'
import type { PppSession } from '@/schemas/mikrotik'

import { useDisconnectSession, useSessions } from '../hooks/useMikrotik'

export function SessionsTab({ routerId }: { routerId: string }) {
  const canManage = useCan('network.manage')
  const { data, isLoading, isError } = useSessions(routerId)
  const disconnect = useDisconnectSession(routerId)
  const [confirm, setConfirm] = useState<PppSession | null>(null)

  const columns = useMemo<ColumnDef<PppSession>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'Username',
        meta: { title: 'Username' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.username}</span>,
      },
      {
        accessorKey: 'address',
        header: 'IP',
        meta: { title: 'IP' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.address}</span>,
      },
      { accessorKey: 'uptime', header: 'Uptime', meta: { title: 'Uptime' } },
      {
        accessorKey: 'callerId',
        header: 'MAC',
        meta: { title: 'MAC' },
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.callerId}</span>,
      },
      {
        id: 'actions',
        meta: { align: 'right' },
        enableHiding: false,
        cell: ({ row }) =>
          canManage ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive"
              onClick={() => setConfirm(row.original)}
            >
              <PlugIcon className="size-4" />
              Putus
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
        emptyMessage="Tidak ada sesi aktif."
        searchPlaceholder="Cari username / IP…"
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
              className="bg-destructive text-white hover:bg-destructive/90"
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
