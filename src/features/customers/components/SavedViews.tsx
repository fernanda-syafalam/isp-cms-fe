import { BookmarkIcon, BookmarkPlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type SavedView, useSavedViews } from '@/hooks/useSavedViews'
import { statusLabel } from '@/lib/status-label'

const STORAGE_KEY = 'isp-cms-customer-views'

// Human label for the current filter, e.g. "Isolir" or 'Aktif · "jepara"'.
function viewName(status: string, q: string): string {
  const base = status === 'all' ? 'Semua' : statusLabel(status)
  const query = q.trim()
  return query ? `${base} · "${query}"` : base
}

type Props = {
  status: string
  q: string
  onApply: (view: SavedView) => void
}

// Saved / quick filter views for the customers list — bookmark the current
// status + search and re-apply with one click. Persisted in localStorage.
export function SavedViews({ status, q, onApply }: Props) {
  const { views, save, remove } = useSavedViews(STORAGE_KEY)
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 sm:h-8">
          <BookmarkIcon className="size-4" />
          <span className="hidden sm:inline">Tampilan</span>
          {views.length > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 font-medium text-xs tabular-nums">
              {views.length}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Tampilan tersimpan</DropdownMenuLabel>
        {views.length === 0 ? (
          <p className="px-2 py-1.5 text-muted-foreground text-xs">
            Belum ada — simpan filter saat ini di bawah.
          </p>
        ) : (
          views.map((view) => (
            <div key={view.id} className="flex items-center gap-1 rounded-sm pr-1 hover:bg-muted">
              <button
                type="button"
                onClick={() => {
                  onApply(view)
                  setOpen(false)
                }}
                className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm"
              >
                {view.name}
              </button>
              <button
                type="button"
                aria-label={`Hapus tampilan ${view.name}`}
                onClick={() => remove(view.id)}
                className="shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          ))
        )}
        <DropdownMenuSeparator />
        <button
          type="button"
          onClick={() => save({ name: viewName(status, q), status, q })}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
        >
          <BookmarkPlusIcon className="size-4 text-muted-foreground" />
          Simpan tampilan ini
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
