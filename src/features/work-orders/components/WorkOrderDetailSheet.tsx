import { Link } from '@tanstack/react-router'
import { UserIcon } from 'lucide-react'

import {
  DETAIL_LINKED_ROW_CLASS,
  DetailActionBar,
  DetailLinkedRow,
  DetailMeta,
  DetailMetaGrid,
  DetailSection,
  DetailSheet,
  DetailSheetHeader,
} from '@/components/shared/detail-sheet'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { useCan } from '@/features/auth'
import { formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { WorkOrder, WorkOrderStatus, WorkOrderType } from '@/schemas/workorder'

import { WorkOrderRowActions } from './WorkOrderRowActions'

const STATUS_TONE: Record<WorkOrderStatus, StatusTone> = {
  scheduled: 'info',
  in_progress: 'warning',
  done: 'success',
  cancelled: 'neutral',
}

const TYPE_TONE: Record<WorkOrderType, StatusTone> = {
  install: 'info',
  repair: 'warning',
  dismantle: 'neutral',
}

type Props = {
  /** The work order to show; the sheet is closed when null. */
  workOrder: WorkOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Quick-view drawer for a work order. No own page — the drawer is the detail,
// opened from the list row with the row's record.
export function WorkOrderDetailSheet({ workOrder, open, onOpenChange }: Props) {
  return (
    <DetailSheet open={open} onOpenChange={onOpenChange}>
      {workOrder ? <Body wo={workOrder} /> : null}
    </DetailSheet>
  )
}

function Body({ wo }: { wo: WorkOrder }) {
  const canManage = useCan('network.manage')
  const canComplete = canManage && (wo.status === 'scheduled' || wo.status === 'in_progress')

  return (
    <>
      <DetailSheetHeader
        eyebrow="Work Order"
        title={<span className="font-mono">{wo.code}</span>}
        status={
          <span className="flex items-center gap-1.5">
            <StatusBadge tone={TYPE_TONE[wo.type]} label={statusLabel(wo.type)} dot={false} />
            <StatusBadge tone={STATUS_TONE[wo.status]} label={statusLabel(wo.status)} />
          </span>
        }
        description={`${wo.customerName} · ${formatDateTime(wo.scheduledAt)}`}
      />

      <div className="divide-y divide-sidebar-border">
        {canComplete ? (
          <DetailActionBar>
            <WorkOrderRowActions workOrder={wo} />
          </DetailActionBar>
        ) : null}

        <DetailSection>
          <DetailMetaGrid>
            <DetailMeta label="Pelanggan">
              {wo.customerId ? (
                <Link
                  to="/customers/$customerId"
                  params={{ customerId: wo.customerId }}
                  className="hover:underline"
                >
                  {wo.customerName}
                </Link>
              ) : (
                wo.customerName
              )}
            </DetailMeta>
            <DetailMeta label="Jenis">{statusLabel(wo.type)}</DetailMeta>
            <DetailMeta label="Teknisi">{wo.technician ?? '—'}</DetailMeta>
            <DetailMeta label="Dijadwalkan">{formatDateTime(wo.scheduledAt)}</DetailMeta>
            <DetailMeta label="Dibuat">{formatDateTime(wo.createdAt)}</DetailMeta>
          </DetailMetaGrid>
        </DetailSection>

        {wo.customerId ? (
          <DetailSection title="Tertaut">
            <Link
              to="/customers/$customerId"
              params={{ customerId: wo.customerId }}
              className={DETAIL_LINKED_ROW_CLASS}
            >
              <DetailLinkedRow icon={UserIcon} label="Pelanggan" value={wo.customerName} />
            </Link>
          </DetailSection>
        ) : null}
      </div>
    </>
  )
}
