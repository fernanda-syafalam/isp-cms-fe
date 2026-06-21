import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, CheckIcon } from 'lucide-react'

import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCustomersList } from '@/features/customers'
import { useRoutersList } from '@/features/routers'
import { useWorkOrdersList } from '@/features/work-orders'
import { cn } from '@/lib/cn'

import { buildSteps } from './setupSteps'
import { SetupGuideSkeleton } from './SetupGuideSkeleton'

// Guided launchpad for the full "set up Mikrotik → win a customer" flow, with
// live status from the data so a demo can run it end-to-end in order.
export function SetupGuidePage() {
  const routersQuery = useRoutersList()
  const customersQuery = useCustomersList()
  const workOrdersQuery = useWorkOrdersList()

  const isLoading = routersQuery.isLoading || customersQuery.isLoading || workOrdersQuery.isLoading
  const isError = routersQuery.isError || customersQuery.isError || workOrdersQuery.isError

  // Retry every underlying query in one tap from the error state.
  const handleRetry = () => {
    routersQuery.refetch()
    customersQuery.refetch()
    workOrdersQuery.refetch()
  }

  if (isLoading) return <SetupGuideSkeleton />
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Panduan Setup"
          description="Dari nol: hubungkan Mikrotik hingga pelanggan aktif & tertagih — ikuti urutannya."
        />
        <ErrorState
          description="Tidak bisa memuat status setup. Periksa koneksi lalu coba lagi."
          onRetry={handleRetry}
        />
      </div>
    )
  }

  const routers = routersQuery.data
  const customers = customersQuery.data
  const workOrders = workOrdersQuery.data

  const routerCount = routers?.items.length ?? 0
  const items = customers?.items ?? []
  const installing = items.filter((c) => c.status === 'instalasi').length
  const active = items.filter((c) => c.status === 'aktif').length
  const installWos = (workOrders?.items ?? []).filter((w) => w.type === 'install')
  const scheduledInstalls = installWos.filter((w) => w.status === 'scheduled').length
  const completedInstalls = installWos.filter((w) => w.status === 'done').length

  const steps = buildSteps({
    routerCount,
    installing,
    active,
    scheduledInstalls,
    completedInstalls,
  })

  const doneCount = steps.filter((s) => s.done).length
  const pct = Math.round((doneCount / steps.length) * 100)
  // First not-yet-done step — the one to nudge the operator toward next.
  const nextStep = steps.find((s) => !s.done)
  const allDone = doneCount === steps.length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Panduan Setup"
        description="Dari nol: hubungkan Mikrotik hingga pelanggan aktif & tertagih — ikuti urutannya."
      />

      {/* Overall progress — shows how far the launch is + the single next action. */}
      <Card>
        <CardContent className="space-y-3 py-5">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold">
                {allDone ? 'Setup selesai 🎉' : `${doneCount} dari ${steps.length} langkah selesai`}
              </p>
              <p className="truncate text-muted-foreground text-sm">
                {allDone
                  ? 'Semua siap — operasional berjalan penuh.'
                  : nextStep
                    ? `Berikutnya: ${nextStep.title.replace(/^\d+\.\s*/, '')}`
                    : ''}
              </p>
            </div>
            <span className="shrink-0 font-bold font-mono text-3xl text-primary tabular-nums">
              {pct}%
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progres setup"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(2, pct)}%` }}
            />
          </div>
          {!allDone && nextStep ? (
            <Button asChild size="sm" className="mt-1">
              <Link to={nextStep.cta.to}>
                {nextStep.cta.label}
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <ol className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon
          const isNext = !allDone && step.title === nextStep?.title
          return (
            <li key={step.title}>
              <Card className={cn(isNext && 'ring-2 ring-primary')}>
                <CardContent className="flex flex-wrap items-center gap-4 py-4">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full border',
                      step.done
                        ? 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    {step.done ? <CheckIcon className="size-5" /> : <Icon className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {step.title}
                      {isNext ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-[0.7rem] text-primary uppercase tracking-wide">
                          Berikutnya
                        </span>
                      ) : step.done ? (
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 font-medium text-[0.7rem] text-green-600 uppercase tracking-wide dark:text-green-400">
                          Selesai
                        </span>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                    <p className="mt-1 text-muted-foreground text-xs">{step.status}</p>
                  </div>
                  <Button asChild size="sm" variant={step.done ? 'outline' : 'default'}>
                    <Link to={step.cta.to}>{step.cta.label}</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
