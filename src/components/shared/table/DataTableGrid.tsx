import { flexRender, type Row, type Table as TanstackTable } from '@tanstack/react-table'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/cn'

import { SKELETON_ROW_KEYS, alignClass, skeletonAlign } from './data-table-shared'

type Props<T> = {
  table: TanstackTable<T>
  rows: Row<T>[]
  isLoading: boolean
  onRowClick?: (row: T) => void
}

// Desktop body (md+): the full sortable/selectable table. Hidden on phones,
// which use DataTableCardList instead.
export function DataTableGrid<T>({ table, rows, isLoading, onRowClick }: Props<T>) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      header.column.getCanSort()
                        ? sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : 'none'
                        : undefined
                    }
                    className={alignClass(header.column.columnDef.meta?.align)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading
            ? SKELETON_ROW_KEYS.map((key) => (
                <TableRow key={key} className="hover:bg-transparent">
                  {table.getAllLeafColumns().map((col) => (
                    <TableCell key={col.id} className={alignClass(col.columnDef.meta?.align)}>
                      <Skeleton
                        className={cn('h-4 w-24', skeletonAlign(col.columnDef.meta?.align))}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  onClick={
                    onRowClick
                      ? (e) => {
                          // Leave the row's own links/buttons/checkbox/menu to
                          // their handlers; only a "blank" row click opens.
                          if (
                            e.target instanceof HTMLElement &&
                            e.target.closest('a,button,input,[role="menuitem"],[role="checkbox"]')
                          )
                            return
                          onRowClick(row.original)
                        }
                      : undefined
                  }
                  className={cn(
                    'transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(alignClass(cell.column.columnDef.meta?.align))}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}
