import type { ColumnDef } from '@tanstack/react-table'
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
import { useTableQuery } from '@/hooks/useTableQuery'
import type { PppSecretListItem } from '@/schemas/mikrotik'

import {
  useDeleteSecret,
  useDisconnectSession,
  useProfiles,
  useSecrets,
  useUpdateSecret,
} from '../hooks/useMikrotik'
import { buildActionsColumn, DISPLAY_COLUMNS } from './secretsColumns'
import { SecretFormDialog } from './SecretFormDialog'

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
