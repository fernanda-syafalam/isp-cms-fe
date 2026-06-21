import {
  CheckCircle2Icon,
  RadioTowerIcon,
  TriangleAlertIcon,
  WrenchIcon,
} from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";
import type { CoverageSummary } from "@/schemas/coverage";

type Props = {
  summary: CoverageSummary | undefined;
  isLoading: boolean;
  isError: boolean;
};

// Full-set KPI row for coverage areas (total / operational / maintenance / down).
export function CoverageKpis({ summary, isLoading, isError }: Props) {
  const by = summary?.byStatus;
  return (
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
  );
}
