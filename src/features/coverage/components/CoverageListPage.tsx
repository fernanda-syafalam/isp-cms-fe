import type { ColumnDef } from "@tanstack/react-table";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { CoverageFilter } from "@/api/coverage";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/table/data-table";
import { DataTableColumnHeader } from "@/components/shared/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { useTableQuery } from "@/hooks/useTableQuery";
import { downloadCsv } from "@/lib/csv";
import { getErrorMessage } from "@/lib/errors";
import { formatNumber, formatPercent } from "@/lib/format";
import { statusLabel } from "@/lib/status-label";
import type { Coverage, CoverageStatus } from "@/schemas/coverage";

import { useCoverageList, useExportCoverage } from "../hooks/useCoverage";

const STATUS_TONE: Record<CoverageStatus, StatusTone> = {
  operational: "success",
  maintenance: "warning",
  down: "danger",
};

const toCsvRow = (c: Coverage) => ({
  Nama: c.name,
  Tipe: c.type.toUpperCase(),
  Wilayah: c.region,
  Aktif: c.activeConnections,
  Kapasitas: c.capacity,
  Status: statusLabel(c.status),
});

// Static column defs (no component state): sortable keys (name/status) match the
// backend sort whitelist; utilisation is a computed ratio, so it stays unsorted.
const COLUMNS: ColumnDef<Coverage>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    meta: { title: "Nama" },
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "type",
    header: "Tipe",
    meta: { title: "Tipe" },
    cell: ({ row }) => <span className="uppercase">{row.original.type}</span>,
  },
  { accessorKey: "region", header: "Wilayah", meta: { title: "Wilayah" } },
  {
    id: "utilisation",
    header: "Utilisasi",
    meta: { align: "right" },
    cell: ({ row }) => {
      const { activeConnections, capacity } = row.original;
      const ratio = capacity > 0 ? activeConnections / capacity : 0;
      return (
        <span className="font-mono tabular-nums">
          {formatNumber(activeConnections)} / {formatNumber(capacity)} (
          {formatPercent(ratio)})
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: { title: "Status" },
    cell: ({ row }) => (
      <StatusBadge
        tone={STATUS_TONE[row.original.status]}
        label={statusLabel(row.original.status)}
      />
    ),
  },
];

export function CoverageListPage() {
  const table = useTableQuery({ pageSize: 20 });
  const exportCoverage = useExportCoverage();
  const [isExporting, setIsExporting] = useState(false);

  // Search/sort/paging come entirely from the table (no equality filter here).
  const baseFilter: CoverageFilter = {
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  };
  const { data, isLoading, isError } = useCoverageList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  });
  const total = data?.total ?? 0;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportCoverage(baseFilter);
      downloadCsv("cakupan", result.items.map(toCsvRow));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cakupan & POP"
        description="Area cakupan dan titik POP."
      />
      <DataTable
        columns={COLUMNS}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada area cakupan."
        searchPlaceholder="Cari area / POP…"
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
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!total || isExporting}
            onClick={handleExport}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Ekspor</span>
          </Button>
        }
      />
    </div>
  );
}
