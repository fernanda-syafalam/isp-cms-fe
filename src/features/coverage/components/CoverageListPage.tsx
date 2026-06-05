import type { ColumnDef } from "@tanstack/react-table";
import { DownloadIcon } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/table/data-table";
import { DataTableColumnHeader } from "@/components/shared/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";
import { formatNumber, formatPercent } from "@/lib/format";
import { statusLabel } from "@/lib/status-label";
import type { Coverage, CoverageStatus } from "@/schemas/coverage";

import { useCoverageList } from "../hooks/useCoverage";

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

export function CoverageListPage() {
  const { data, isLoading, isError } = useCoverageList();

  const columns = useMemo<ColumnDef<Coverage>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nama" />
        ),
        meta: { title: "Nama" },
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Tipe",
        meta: { title: "Tipe" },
        cell: ({ row }) => (
          <span className="uppercase">{row.original.type}</span>
        ),
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
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cakupan & POP"
        description="Area cakupan dan titik POP."
      />
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada area cakupan."
        searchPlaceholder="Cari area / POP…"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!data?.items.length}
            onClick={() =>
              downloadCsv("cakupan", (data?.items ?? []).map(toCsvRow))
            }
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        }
      />
    </div>
  );
}
