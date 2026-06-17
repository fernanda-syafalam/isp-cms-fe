import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  COVERAGE_EXPORT_LIMIT,
  type CoverageFilter,
  listCoverage,
} from "@/api/coverage";

export function useCoverageList(filter: CoverageFilter = {}) {
  return useQuery({
    queryKey: ["coverage", "list", filter] as const,
    queryFn: () => listCoverage(filter),
  });
}

/**
 * Returns a callback that fetches the full filtered coverage set (one max-size
 * page) for CSV export. With server pagination the table holds only the current
 * page, so export must re-query without the page window.
 */
export function useExportCoverage() {
  const qc = useQueryClient();
  return (filter: CoverageFilter = {}) => {
    const exportFilter: CoverageFilter = {
      ...filter,
      limit: COVERAGE_EXPORT_LIMIT,
      offset: 0,
    };
    return qc.fetchQuery({
      queryKey: ["coverage", "list", exportFilter] as const,
      queryFn: () => listCoverage(exportFilter),
    });
  };
}
