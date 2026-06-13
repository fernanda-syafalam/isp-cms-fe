import { SlidersHorizontalIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import { TopologyControlsBody, type TopologyControlsProps } from './TopologyControlsBody'

// Mobile controls: a single 44px "Filter & cari" button opens a bottom sheet
// with the full filter/search/edit set at comfortable touch sizes. Hidden on
// desktop, where TopologyControls shows the bar inline. A live "down" count on
// the trigger keeps the most urgent signal visible without opening the sheet.
export function TopologyFilterSheet(props: TopologyControlsProps) {
  const [open, setOpen] = useState(false)
  const down = props.counts.down

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-11 w-full justify-start gap-2">
            <SlidersHorizontalIcon className="size-4" />
            Filter & cari
            {down > 0 ? (
              <span className="ml-auto rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive text-xs">
                {down} down
              </span>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filter & pencarian</SheetTitle>
            <SheetDescription className="sr-only">
              Saring node berdasarkan status dan tipe, ganti peta dasar, atau cari node.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <TopologyControlsBody {...props} compact={false} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
