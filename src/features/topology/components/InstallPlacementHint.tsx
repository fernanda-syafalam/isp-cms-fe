import { LocateFixedIcon, MapPinIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type Props = {
  /** GPS is active and a position is known — offer "use my location". */
  canUseGps: boolean
  onUseGps: () => void
  onCancel: () => void
}

// Shown while "Pasang pelanggan" placement mode is active: tells the technician
// to click the customer's home on the map, with a shortcut to drop the pin at
// their own GPS position (they are usually standing at the install site).
export function InstallPlacementHint({ canUseGps, onUseGps, onCancel }: Props) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm"
    >
      <MapPinIcon className="size-5 shrink-0 text-primary" />
      <span>Klik lokasi rumah pelanggan di peta untuk memasang.</span>
      <div className="ml-auto flex gap-2">
        {canUseGps ? (
          <Button variant="outline" size="sm" className="h-8" onClick={onUseGps}>
            <LocateFixedIcon className="size-4" />
            Gunakan lokasi saya
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" className="h-8" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </div>
  )
}
