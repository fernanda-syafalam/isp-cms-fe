import { Card, CardContent } from '@/components/ui/card'

import { TopologyControlsBody, type TopologyControlsProps } from './TopologyControlsBody'

// Desktop controls: the full filter/search/edit bar in a card. Hidden on mobile,
// where TopologyFilterSheet provides the same controls behind a Filter button.
export function TopologyControls(props: TopologyControlsProps) {
  return (
    <Card className="hidden lg:block">
      <CardContent className="pt-6">
        <TopologyControlsBody {...props} compact />
      </CardContent>
    </Card>
  )
}
