import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'

import type { NetworkTopology } from '../hooks/useNetworkTopology'
import { LocateControl } from './LocateControl'
import { TopologyAside } from './TopologyAside'
import { TopologyMap } from './TopologyMap'
import { TopologyTree } from './TopologyTree'

type Props = Pick<
  NetworkTopology,
  'isLoading' | 'hasData' | 'view' | 'mapProps' | 'geoProps' | 'treeProps' | 'asideProps'
>

// The main stage: the map (or tree list) beside the detail aside. Prop bundles
// are assembled in useNetworkTopology and spread straight onto each child.
export function TopologyStage({
  isLoading,
  hasData,
  view,
  mapProps,
  geoProps,
  treeProps,
  asideProps,
}: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div
        className={cn(
          'relative h-[78dvh] min-h-[440px] rounded-lg border bg-card sm:h-[70dvh]',
          view === 'map' ? 'overflow-hidden' : 'overflow-y-auto',
        )}
      >
        {isLoading || !hasData ? (
          <Skeleton className="h-full w-full" />
        ) : view === 'map' ? (
          <>
            <TopologyMap {...mapProps} />
            <LocateControl {...geoProps} />
          </>
        ) : (
          <TopologyTree {...treeProps} />
        )}
      </div>
      <aside className="space-y-4">
        <TopologyAside {...asideProps} />
      </aside>
    </div>
  )
}
