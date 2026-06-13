import { LocateFixedIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

type Props = {
  active: boolean
  isLocating: boolean
  onToggle: () => void
}

// Map overlay button to show/hide the technician's location. 44px touch target
// (size-11), pinned bottom-right above Leaflet's panes, with aria-pressed so the
// on/off state is announced.
export function LocateControl({ active, isLocating, onToggle }: Props) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'secondary'}
      size="icon"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? 'Sembunyikan lokasi saya' : 'Tampilkan lokasi saya'}
      className="absolute right-3 bottom-3 z-[1000] size-11 rounded-full shadow-md"
    >
      <LocateFixedIcon className={cn('size-5', isLocating && 'animate-pulse')} />
    </Button>
  )
}
