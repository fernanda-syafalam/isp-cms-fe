import { ChevronRightIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { cn } from '@/lib/cn'
import type { NodeStatus } from '@/schemas/topology'

import { STATUS_LABEL, TYPE_LABEL, type TreeNode } from '../lib/graph'

type Props = {
  forest: TreeNode[]
  selectedId: string | null
  highlightIds: Set<string>
  onSelect: (id: string) => void
}

// Accessible, keyboard-navigable hierarchy view — the non-map alternative to
// the Leaflet topology (network graphs score poorly on accessibility).
export function TopologyTree({ forest, selectedId, highlightIds, onSelect }: Props) {
  // Expand OLT + ODC by default (top two tiers); deeper tiers collapsed.
  const initialExpanded = useMemo(() => {
    const ids = new Set<string>()
    const walk = (n: TreeNode, depth: number) => {
      if (depth < 2 && n.children.length) ids.add(n.node.id)
      for (const c of n.children) walk(c, depth + 1)
    }
    for (const r of forest) walk(r, 0)
    return ids
  }, [forest])

  const [expanded, setExpanded] = useState(initialExpanded)
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (forest.length === 0) {
    return (
      <p className="p-6 text-center text-muted-foreground text-sm">Tidak ada node yang cocok.</p>
    )
  }

  return (
    <ul className="py-1" aria-label="Hierarki topologi jaringan">
      {forest.map((n) => (
        <TreeRow
          key={n.node.id}
          node={n}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
          selectedId={selectedId}
          highlightIds={highlightIds}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}

function TreeRow({
  node,
  depth,
  expanded,
  onToggle,
  selectedId,
  highlightIds,
  onSelect,
}: {
  node: TreeNode
  depth: number
  expanded: Set<string>
  onToggle: (id: string) => void
  selectedId: string | null
  highlightIds: Set<string>
  onSelect: (id: string) => void
}) {
  const { node: n, children } = node
  const hasChildren = children.length > 0
  const isOpen = expanded.has(n.id)
  const isSelected = selectedId === n.id
  const isHit = highlightIds.has(n.id)

  return (
    <li>
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm transition-colors',
          isSelected ? 'bg-accent' : 'hover:bg-accent/50',
          isHit && !isSelected ? 'ring-1 ring-primary/40' : '',
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={isOpen ? 'Tutup' : 'Buka'}
            aria-expanded={isOpen}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            onClick={() => onToggle(n.id)}
          >
            <ChevronRightIcon
              className={cn('size-4 transition-transform', isOpen && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <StatusGlyph status={n.status} />
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => onSelect(n.id)}
        >
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">
            {TYPE_LABEL[n.type]}
          </span>
          <span className="truncate">{n.name}</span>
          {hasChildren ? (
            <span className="ml-auto shrink-0 text-muted-foreground text-xs">
              {children.length}
            </span>
          ) : null}
        </button>
      </div>
      {hasChildren && isOpen ? (
        <ul>
          {children.map((c) => (
            <TreeRow
              key={c.node.id}
              node={c}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              highlightIds={highlightIds}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

// Status as shape + color (not color alone) for colorblind safety:
// Up = filled circle, Down = diamond, Unknown = hollow circle.
function StatusGlyph({ status }: { status: NodeStatus }) {
  const shape =
    status === 'up'
      ? 'size-2.5 rounded-full bg-green-600'
      : status === 'down'
        ? 'size-2.5 rotate-45 rounded-[2px] bg-red-600'
        : 'size-2.5 rounded-full border-2 border-amber-600'
  return (
    <span className="flex size-4 shrink-0 items-center justify-center" title={STATUS_LABEL[status]}>
      <span className={shape} aria-label={STATUS_LABEL[status]} role="img" />
    </span>
  )
}
