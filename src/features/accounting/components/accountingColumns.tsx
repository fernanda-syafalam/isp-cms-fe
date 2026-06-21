import type { ColumnDef } from '@tanstack/react-table'

import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatCurrency, formatDate } from '@/lib/format'
import type { JournalLine } from '@/schemas/accounting'

export const toCsvRow = (l: JournalLine) => ({
  Tanggal: l.date.slice(0, 10),
  Kode: l.accountCode,
  Akun: l.accountName,
  Keterangan: l.description,
  Debit: l.debit,
  Kredit: l.credit,
})

// Static column defs (no component state). Sortable keys (date/accountCode/
// accountName/debit/credit) match the backend sort whitelist; Keterangan is a
// free-text column (searchable, not sortable).
export const journalColumns: ColumnDef<JournalLine>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
    meta: { title: 'Tanggal' },
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: 'accountCode',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
    meta: { title: 'Kode' },
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.accountCode}</span>,
  },
  {
    accessorKey: 'accountName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Akun" />,
    meta: { title: 'Akun' },
  },
  {
    accessorKey: 'description',
    header: 'Keterangan',
    meta: { title: 'Keterangan' },
    cell: ({ row }) => <span className="text-sm">{row.original.description}</span>,
  },
  {
    accessorKey: 'debit',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Debit" />,
    meta: { title: 'Debit', align: 'right' },
    cell: ({ row }) =>
      row.original.debit > 0 ? (
        <span className="font-mono tabular-nums">{formatCurrency(row.original.debit)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'credit',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kredit" />,
    meta: { title: 'Kredit', align: 'right' },
    cell: ({ row }) =>
      row.original.credit > 0 ? (
        <span className="font-mono tabular-nums">{formatCurrency(row.original.credit)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
]
