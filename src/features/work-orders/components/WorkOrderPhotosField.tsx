import { PlusIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  value: string[] | undefined
  onChange: (value: string[] | undefined) => void
}

// Add-URL list for field photo references (no real upload in the mock — the
// backend stores URL refs). Each entry is a URL string; the parent form's Zod
// schema validates the URLs on submit.
export function WorkOrderPhotosField({ value, onChange }: Props) {
  const [draft, setDraft] = useState('')
  const photos = value ?? []

  const handleAdd = () => {
    const url = draft.trim()
    if (url.length === 0) return
    onChange([...photos, url])
    setDraft('')
  }

  const handleRemove = (index: number) => {
    const next = photos.filter((_, i) => i !== index)
    onChange(next.length === 0 ? undefined : next)
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="https://…/foto.jpg"
          inputMode="url"
          aria-label="URL foto bukti"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={draft.trim().length === 0}
        >
          <PlusIcon className="size-4" />
          Tambah
        </Button>
      </div>
      {photos.length > 0 ? (
        <ul className="grid gap-1.5">
          {photos.map((url, index) => (
            <li
              key={url}
              className="flex items-center gap-2 rounded-md border border-input bg-muted/30 px-2 py-1 text-sm"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{url}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => handleRemove(index)}
                aria-label={`Hapus foto ${index + 1}`}
              >
                <XIcon className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
