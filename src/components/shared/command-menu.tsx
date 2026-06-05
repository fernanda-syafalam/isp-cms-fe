import { useNavigate } from '@tanstack/react-router'
import { MoonIcon, SearchIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { NAV_GROUPS } from './nav'

// Global ⌘K palette: fuzzy nav + theme actions. Mounted once in the shell.
export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { setTheme } = useTheme()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const run = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Buka pencarian perintah"
      >
        <SearchIcon className="size-4" />
        <span className="hidden sm:inline">Cari…</span>
        <kbd className="ml-2 hidden rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cari menu atau jalankan aksi…" />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>
          {NAV_GROUPS.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.to}
                    value={`${group.label} ${item.label}`}
                    onSelect={() => run(() => navigate({ to: item.to }))}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Tampilan">
            <CommandItem value="tema terang light" onSelect={() => run(() => setTheme('light'))}>
              <SunIcon className="size-4" />
              Tema terang
              <CommandShortcut>Terang</CommandShortcut>
            </CommandItem>
            <CommandItem value="tema gelap dark" onSelect={() => run(() => setTheme('dark'))}>
              <MoonIcon className="size-4" />
              Tema gelap
              <CommandShortcut>Gelap</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
