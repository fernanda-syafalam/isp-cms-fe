import { getRouteApi } from "@tanstack/react-router";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { CoverageFilter } from "@/api/coverage";
import {
  FilterTabs,
  type FilterTabItem,
} from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/table/data-table";
import { Button } from "@/components/ui/button";
import { useTableQuery } from "@/hooks/useTableQuery";
import { downloadCsv } from "@/lib/csv";
import { getErrorMessage } from "@/lib/errors";
import { statusLabel } from "@/lib/status-label";

import { useCoverageList, useExportCoverage } from "../hooks/useCoverage";
import { coverageColumns, toCsvRow } from "./coverageColumns";
import { CoverageKpis } from "./CoverageKpis";

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

      <CoverageKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter status cakupan"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={coverageColumns}
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
