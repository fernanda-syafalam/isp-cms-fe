import { useState } from 'react'

// A bookmarked list filter (status + search) the user can re-apply with one
// click. Persisted to localStorage, scoped by a per-list storage key.
export type SavedView = {
  id: string
  name: string
  status: string
  q: string
}

function read(storageKey: string): SavedView[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Defensive: keep only well-formed entries (localStorage is untrusted).
    return parsed.filter(
      (v): v is SavedView =>
        typeof v === 'object' &&
        v !== null &&
        typeof (v as SavedView).id === 'string' &&
        typeof (v as SavedView).name === 'string' &&
        typeof (v as SavedView).status === 'string' &&
        typeof (v as SavedView).q === 'string',
    )
  } catch {
    return []
  }
}

function write(storageKey: string, views: SavedView[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(views))
  } catch {
    // ignore quota / disabled storage
  }
}

export function useSavedViews(storageKey: string) {
  const [views, setViews] = useState<SavedView[]>(() => read(storageKey))

  const persist = (next: SavedView[]) => {
    setViews(next)
    write(storageKey, next)
  }

  // Save the current filter; no-op if an identical status+q view already exists.
  const save = (view: Omit<SavedView, 'id'>) => {
    if (views.some((v) => v.status === view.status && v.q === view.q)) return
    persist([...views, { ...view, id: crypto.randomUUID() }])
  }

  const remove = (id: string) => persist(views.filter((v) => v.id !== id))

  return { views, save, remove }
}
