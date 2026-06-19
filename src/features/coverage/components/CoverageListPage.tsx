import { getRouteApi } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2Icon,
  DownloadIcon,
  RadioTowerIcon,
  TriangleAlertIcon,
  WrenchIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { CoverageFilter } from "@/api/coverage";
import {
  FilterTabs,
  type FilterTabItem,
} from "@/components/shared/filter-tabs";
import { KpiCard } from "@/components/shared/kpi-card";
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

const routeApi = getRouteApi("/_auth/coverage");

export function CoverageListPage() {
  const { status: statusParam } = routeApi.useSearch();
  const status = statusParam ?? "all";
  const navigate = routeApi.useNavigate();
  const table = useTableQuery({ pageSize: 20 });
  const exportCoverage = useExportCoverage();
  const [isExporting, setIsExporting] = useState(false);

  // Status is a URL filter; changing it rewinds to page 1.
  const setStatus = (value: string) => {
    navigate({ search: value === "all" ? {} : { status: value } });
    table.resetPage();
  };

  const baseFilter: CoverageFilter = {
    ...(status === "all" ? {} : { status }),
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
  const summary = data?.summary;
  const by = summary?.byStatus;

  const statusTabs: FilterTabItem[] = [
    { value: "all", label: "Semua", count: summary?.total },
    {
      value: "operational",
      label: statusLabel("operational"),
      count: by?.operational,
    },
    {
      value: "maintenance",
      label: statusLabel("maintenance"),
      count: by?.maintenance,
    },
    { value: "down", label: statusLabel("down"), count: by?.down },
  ];

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total area"
          value={summary?.total ?? 0}
          hint="POP & cakupan"
          icon={RadioTowerIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Operasional"
          value={by?.operational ?? 0}
          hint="normal"
          icon={CheckCircle2Icon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Pemeliharaan"
          value={by?.maintenance ?? 0}
          hint="maintenance"
          accent="amber"
          icon={WrenchIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Down"
          value={by?.down ?? 0}
          hint="gangguan"
          hintTone="negative"
          icon={TriangleAlertIcon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <FilterTabs
        ariaLabel="Filter status cakupan"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
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
      />
    </div>
  );
}
