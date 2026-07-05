import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const CAVEAT =
  'Metrik ini adalah estimasi berbasis inferensi industri hingga data event nyata tersedia (ARCHITECTURE §6).'

/**
 * Marks a KPI whose value is inferred (industry heuristics) rather than derived
 * from real event records — the two-tier metric split in docs/ARCHITECTURE.md
 * §6. Single source of truth for the "Estimasi" marker so every surface reads
 * the same. The caveat is exposed via both a hover/focus tooltip and an
 * aria-label so it reaches assistive tech without a pointer.
 */
export function EstimateBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="cursor-help font-normal" aria-label={CAVEAT}>
          Estimasi
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{CAVEAT}</TooltipContent>
    </Tooltip>
  )
}
