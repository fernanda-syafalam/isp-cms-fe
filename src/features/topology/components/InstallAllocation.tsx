import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SplitterPort } from '@/schemas/splitter'

import { fiberId, formatLength } from '../lib/graph'

// A drop cable to a home is normally short; warn (non-blocking) past this so the
// technician reconsiders a nearer ODP before stringing an over-long drop.
const LONG_DROP_M = 250

type Props = {
  /** Free splitter ports of the selected ODP (the technician's port choices). */
  ports: SplitterPort[]
  selectedPort: SplitterPort | null
  onPortChange: (portNo: number) => void
  loading: boolean
  dropMeters: number
  hasOdp: boolean
}

// Port/core picker + allocation preview for "Pasang pelanggan": the technician
// chooses which splitter output port (= TIA-598 fiber core) to patch, and sees
// the core color + drop length before committing.
export function InstallAllocation({
  ports,
  selectedPort,
  onPortChange,
  loading,
  dropMeters,
  hasOdp,
}: Props) {
  const previewCore = selectedPort ? fiberId(selectedPort.portNo).core : null

  return (
    <>
      <div className="space-y-1.5">
        <span className="font-medium text-sm">Port / core</span>
        <Select
          value={selectedPort ? String(selectedPort.portNo) : ''}
          onValueChange={(v) => onPortChange(Number(v))}
          disabled={ports.length === 0}
        >
          <SelectTrigger className="w-full" aria-label="Port / core">
            <SelectValue placeholder={loading ? 'Memuat port…' : 'Pilih port'} />
          </SelectTrigger>
          <SelectContent>
            {ports.map((p) => {
              const core = fiberId(p.portNo).core
              return (
                <SelectItem key={p.portNo} value={String(p.portNo)}>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 shrink-0 rounded-full border border-border"
                      style={{ background: core.hex }}
                    />
                    Port #{p.portNo} · {core.name}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {selectedPort && previewCore ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Alokasi:</span>
            <span className="flex items-center gap-1.5">
              <span
                className="size-3 shrink-0 rounded-full border border-border"
                style={{ background: previewCore.hex }}
              />
              Port #{selectedPort.portNo} {previewCore.name}
            </span>
            <span className="ml-auto font-mono text-muted-foreground tabular-nums">
              drop ≈ {formatLength(dropMeters)}
            </span>
          </div>
          {dropMeters > LONG_DROP_M ? (
            <p className="text-amber-600 text-xs">
              Drop ≈ {formatLength(dropMeters)} cukup panjang — pertimbangkan ODP yang lebih dekat.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          {hasOdp ? 'ODP ini tidak punya port tersisa.' : 'Tidak ada ODP dengan port tersisa.'}
        </p>
      )}
    </>
  )
}
