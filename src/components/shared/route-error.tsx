import type { ErrorComponentProps } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'

import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'

type RouteErrorViewProps = {
  /** Retry the failed render/loaders in place. */
  onRetry: () => void
  /** Hard recovery — reload the document for a clean slate. */
  onReload: () => void
}

/**
 * Presentational error boundary body (no router coupling, so it is unit
 * testable). Offers two recovery paths: retry in place, or a full reload when
 * the failure persists. The raw error is intentionally not shown — we surface a
 * friendly Bahasa message with a clear next step.
 */
export function RouteErrorView({ onRetry, onReload }: RouteErrorViewProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ErrorState
        title="Terjadi kesalahan"
        description="Maaf, halaman ini gagal dimuat. Coba lagi, atau muat ulang halaman jika masalah berlanjut."
        onRetry={onRetry}
        action={
          <Button type="button" variant="ghost" size="sm" onClick={onReload}>
            Muat ulang halaman
          </Button>
        }
      />
    </div>
  )
}

/**
 * Router error boundary wired to TanStack Router. Used as the router's
 * `defaultErrorComponent`, so it acts as a per-route boundary (rendered inside
 * the app shell for a page error) and as the root boundary (full page if the
 * shell itself throws). Retry resets the boundary and re-runs loaders.
 */
export function RouteError({ reset }: ErrorComponentProps) {
  const router = useRouter()
  const handleRetry = () => {
    reset()
    void router.invalidate()
  }
  return <RouteErrorView onRetry={handleRetry} onReload={() => window.location.reload()} />
}
