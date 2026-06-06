import { CalendarClockIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings } from '@/features/settings'
import { formatNumber } from '@/lib/format'

import { useRunScheduler, useSchedulerPreview } from '../hooks/useBilling'

export function SchedulerDialog() {
  const [open, setOpen] = useState(false)
  const preview = useSchedulerPreview(open)
  const { data: settings } = useSettings()
  const run = useRunScheduler()

  const handleRun = async () => {
    try {
      await run.mutateAsync()
      setOpen(false)
    } catch {
      // useRunScheduler surfaces a toast.
    }
  }

  const rows: Array<{ label: string; value: number | undefined }> = [
    { label: 'Tagihan akan dibuat', value: preview.data?.toBill },
    {
      label: 'Pengingat — jatuh tempo ≤ 3 hari',
      value: preview.data?.toRemindUpcoming,
    },
    {
      label: 'Pengingat — sudah/akan jatuh tempo',
      value: preview.data?.toRemindOverdue,
    },
    { label: 'Pelanggan akan diisolir', value: preview.data?.toIsolir },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <CalendarClockIcon className="size-4" />
          <span className="hidden sm:inline">Otomasi</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Siklus billing otomatis</DialogTitle>
          <DialogDescription>
            Satu klik menjalankan: buat tagihan → tandai jatuh tempo → kirim pengingat → isolir
            penunggak.
          </DialogDescription>
        </DialogHeader>

        {settings ? (
          <p className="rounded-md bg-muted/40 px-3 py-2 text-muted-foreground text-xs">
            Aturan: tagih awal periode · tempo {settings.billing.dueDays} hari · ingatkan H-3 &
            jatuh tempo · isolir setelah {settings.billing.isolirGraceDays} hari lewat tempo.
          </p>
        ) : null}

        <dl className="space-y-2 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="font-mono font-medium tabular-nums">
                {preview.isLoading || r.value === undefined ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  formatNumber(r.value)
                )}
              </dd>
            </div>
          ))}
        </dl>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={run.isPending}>
            Batal
          </Button>
          <Button onClick={handleRun} disabled={run.isPending}>
            {run.isPending ? 'Menjalankan…' : 'Jalankan siklus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
