import { CheckCircle2Icon, TriangleAlertIcon } from 'lucide-react'

import type { TestConnectionResult } from '@/schemas/router'

// Result panel for the RouterOS API probe: identity/model/version on success,
// a friendly error otherwise.
export function ConnectionTestResult({ result }: { result: TestConnectionResult }) {
  if (!result.ok) {
    return (
      <p className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
        <TriangleAlertIcon className="size-4 shrink-0" />
        {result.message ?? 'Koneksi gagal'}
      </p>
    )
  }
  return (
    <div className="space-y-1 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm">
      <p className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
        <CheckCircle2Icon className="size-4" />
        Koneksi berhasil
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-muted-foreground text-xs">
        <dt>Identity</dt>
        <dd className="font-mono text-foreground">{result.identity}</dd>
        <dt>Model</dt>
        <dd className="font-mono text-foreground">{result.model}</dd>
        <dt>Versi</dt>
        <dd className="font-mono text-foreground">{result.version}</dd>
      </dl>
    </div>
  )
}
