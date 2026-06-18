import { ArrowRightIcon, PlusIcon, TargetIcon, TrendingUpIcon, WalletIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/auth'
import { formatCurrency } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Lead, LeadStage } from '@/schemas/lead'

import { useConvertLead, useLeads, useUpdateLeadStage } from '../hooks/useLeads'
import { LeadFormDialog } from './LeadFormDialog'

const COLUMNS: LeadStage[] = ['new', 'survey', 'quote', 'won', 'lost']
const NEXT_STAGE: Partial<Record<LeadStage, LeadStage>> = {
  new: 'survey',
  survey: 'quote',
}
const ACTIVE: LeadStage[] = ['new', 'survey', 'quote']
const COLUMN_TONE: Record<LeadStage, StatusTone> = {
  new: 'neutral',
  survey: 'info',
  quote: 'warning',
  won: 'success',
  lost: 'danger',
}

export function LeadsPage() {
  const { data, isLoading, isError } = useLeads()
  const canManage = useCan('customers.manage')
  const [addOpen, setAddOpen] = useState(false)

  const byStage = useMemo(() => {
    const groups: Record<LeadStage, Lead[]> = {
      new: [],
      survey: [],
      quote: [],
      won: [],
      lost: [],
    }
    for (const lead of data?.items ?? []) groups[lead.stage].push(lead)
    return groups
  }, [data])

  const summary = useMemo(() => {
    const items = data?.items ?? []
    const active = items.filter((l) => ACTIVE.includes(l.stage))
    const won = items.filter((l) => l.stage === 'won').length
    const lost = items.filter((l) => l.stage === 'lost').length
    return {
      active: active.length,
      pipelineValue: active.reduce((s, l) => s + l.estValue, 0),
      winRate: won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0,
    }
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospek (Pipeline)"
        description="Calon pelanggan dari lead hingga konversi."
        stickyOnMobile
        primaryAction={
          canManage ? (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <PlusIcon className="size-4" />
              Prospek baru
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Prospek aktif" value={summary.active} icon={TargetIcon} />
        <KpiCard
          label="Nilai pipeline"
          value={summary.pipelineValue}
          format={formatCurrency}
          hint="estimasi / bln"
          icon={WalletIcon}
        />
        <KpiCard
          label="Win rate"
          value={summary.winRate}
          format={(v) => `${v}%`}
          hint="menang vs kalah"
          icon={TrendingUpIcon}
        />
      </div>

      {isError ? (
        <p className="text-destructive text-sm" role="alert">
          Gagal memuat prospek.
        </p>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((s) => (
            <Skeleton key={s} className="h-64" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((stage) => (
            <section key={stage} className="rounded-lg border border-border bg-muted/30 p-3">
              <header className="mb-3 flex items-center justify-between">
                <StatusBadge tone={COLUMN_TONE[stage]} label={statusLabel(stage)} />
                <span className="text-muted-foreground text-xs">{byStage[stage].length}</span>
              </header>
              <div className="space-y-2">
                {byStage[stage].length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground text-xs">Kosong</p>
                ) : (
                  byStage[stage].map((lead) => (
                    <LeadCard key={lead.id} lead={lead} canManage={canManage} />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {canManage ? <LeadFormDialog open={addOpen} onOpenChange={setAddOpen} /> : null}
    </div>
  )
}

function LeadCard({ lead, canManage }: { lead: Lead; canManage: boolean }) {
  const advance = useUpdateLeadStage()
  const convert = useConvertLead()
  const next = NEXT_STAGE[lead.stage]
  const busy = advance.isPending || convert.isPending

  return (
    <article className="rounded-md border border-border bg-card p-3 shadow-sm">
      <p className="font-medium text-sm">{lead.name}</p>
      <p className="text-muted-foreground text-xs">
        {lead.planName} · {lead.areaName}
      </p>
      <p className="mt-1 font-mono text-xs tabular-nums">{formatCurrency(lead.estValue)}/bln</p>
      <p className="mt-1 text-muted-foreground text-[11px]">{statusLabel(lead.source)}</p>

      {canManage && ACTIVE.includes(lead.stage) ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {next ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={busy}
              onClick={() => advance.mutate({ id: lead.id, stage: next })}
            >
              <ArrowRightIcon className="size-3.5" />
              {statusLabel(next)}
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={busy}
              onClick={() => convert.mutate(lead.id)}
            >
              Konversi
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-destructive text-xs hover:text-destructive"
            disabled={busy}
            onClick={() => advance.mutate({ id: lead.id, stage: 'lost' })}
          >
            Kalah
          </Button>
        </div>
      ) : null}

      {lead.stage === 'won' ? (
        <p className="mt-2 text-[11px] text-green-600">✓ Jadi pelanggan</p>
      ) : null}
    </article>
  )
}
