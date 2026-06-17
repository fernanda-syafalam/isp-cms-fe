import type { ColumnDef } from '@tanstack/react-table'
import { PencilIcon } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { formatDateTime } from '@/lib/format'
import type {
  NotificationEvent,
  NotificationLog,
  NotificationTemplate,
} from '@/schemas/notification'

import {
  useNotificationLog,
  useNotificationTemplates,
  useUpdateNotificationTemplate,
} from '../hooks/useNotifications'
import { EditTemplateDialog } from './EditTemplateDialog'
import { TestSendDialog } from './TestSendDialog'

const EVENT_LABEL: Record<NotificationEvent, string> = {
  invoice_created: 'Tagihan terbit',
  due_soon: 'Jatuh tempo (H-3)',
  overdue: 'Terlambat',
  isolir: 'Isolir',
  paid: 'Lunas',
  ticket_update: 'Update tiket',
}

// Static column defs (no component state): sortable keys (at/to/templateName/
// status) match the backend send-log sort whitelist; `to` maps to the recipient
// column server-side. `body` is a non-sortable preview, not a sort target.
const LOG_COLUMNS: ColumnDef<NotificationLog>[] = [
  {
    accessorKey: 'at',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Waktu" />,
    meta: { title: 'Waktu' },
    cell: ({ row }) => formatDateTime(row.original.at),
  },
  {
    accessorKey: 'to',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tujuan" />,
    meta: { title: 'Tujuan' },
  },
  {
    accessorKey: 'templateName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Template" />,
    meta: { title: 'Template' },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: 'Status' },
    cell: ({ row }) => (
      <StatusBadge
        tone={row.original.status === 'sent' ? 'success' : 'danger'}
        label={row.original.status === 'sent' ? 'Terkirim' : 'Gagal'}
      />
    ),
  },
  {
    accessorKey: 'body',
    header: 'Isi',
    meta: { title: 'Isi' },
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-md text-muted-foreground text-sm">
        {row.original.body}
      </span>
    ),
  },
]

export function NotificationsPage() {
  const templates = useNotificationTemplates()
  const canManage = useCan('settings.manage')
  const logTable = useTableQuery({ pageSize: 20 })
  const log = useNotificationLog({
    q: logTable.params.q,
    sort: logTable.params.sort,
    order: logTable.params.order,
    limit: logTable.params.limit,
    offset: logTable.params.offset,
  })
  const logTotal = log.data?.total ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifikasi WhatsApp"
        description="Template pesan otomatis & riwayat pengiriman."
        actions={templates.data ? <TestSendDialog templates={templates.data.items} /> : null}
      />

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Template</TabsTrigger>
          <TabsTrigger value="log">Riwayat kirim</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          {templates.isLoading || !templates.data ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ) : templates.isError ? (
            <p className="text-destructive" role="alert">
              Gagal memuat template.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.data.items.map((tpl) => (
                <TemplateCard key={tpl.id} template={tpl} canManage={canManage} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="log">
          <DataTable
            columns={LOG_COLUMNS}
            data={log.data?.items}
            isLoading={log.isLoading}
            isError={log.isError}
            emptyMessage="Belum ada pesan terkirim."
            searchPlaceholder="Cari tujuan / template…"
            server={{
              pageIndex: logTable.pageIndex,
              pageSize: logTable.pageSize,
              rowCount: logTotal,
              sorting: logTable.sorting,
              search: logTable.search,
              onPaginationChange: logTable.onPaginationChange,
              onSortingChange: logTable.onSortingChange,
              onSearchChange: logTable.onSearchChange,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TemplateCard({
  template,
  canManage,
}: {
  template: NotificationTemplate
  canManage: boolean
}) {
  const [editOpen, setEditOpen] = useState(false)
  const update = useUpdateNotificationTemplate(template.id)

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{template.name}</p>
            <StatusBadge tone="info" label={EVENT_LABEL[template.event]} />
          </div>
          <span className="flex items-center gap-2 text-muted-foreground text-xs">
            <Checkbox
              checked={template.enabled}
              disabled={!canManage || update.isPending}
              onCheckedChange={(v) => update.mutate({ enabled: v === true })}
              aria-label={`Aktifkan template ${template.name}`}
            />
            Aktif
          </span>
        </div>
        <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-muted-foreground text-sm">
          {template.body}
        </p>
        {canManage ? (
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <PencilIcon className="size-4" />
            Edit
          </Button>
        ) : null}
      </CardContent>
      {canManage ? (
        <EditTemplateDialog template={template} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}
    </Card>
  )
}
