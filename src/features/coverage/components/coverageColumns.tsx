import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { DataTableColumnHeader } from "@/components/shared/table/data-table-column-header";
import { formatNumber, formatPercent } from "@/lib/format";
import { statusLabel } from "@/lib/status-label";
import type { Coverage, CoverageStatus } from "@/schemas/coverage";

const STATUS_TONE: Record<CoverageStatus, StatusTone> = {
  operational: "success",
  maintenance: "warning",
  down: "danger",
};

export const toCsvRow = (c: Coverage) => ({
  Nama: c.name,
  Tipe: c.type.toUpperCase(),
  Wilayah: c.region,
  Aktif: c.activeConnections,
  Kapasitas: c.capacity,
  Status: statusLabel(c.status),
});

// Static column defs (no component state): sortable keys (name/status) match the
// backend sort whitelist; utilisation is a computed ratio, so it stays unsorted.
export const coverageColumns: ColumnDef<Coverage>[] = [
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
