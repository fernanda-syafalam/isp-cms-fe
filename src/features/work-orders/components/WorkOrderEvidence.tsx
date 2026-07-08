import { DetailMeta, DetailMetaGrid, DetailSection } from '@/components/shared/detail-sheet'
import { formatDateTime } from '@/lib/format'
import type { WorkOrder } from '@/schemas/workorder'

// Backend-supplied URLs (signature, evidence photos) are rendered as clickable
// hrefs; guard against `javascript:` / `data:` scheme values that would execute
// on click (A6-L1). Only http(s) URLs are treated as links.
function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

// Read-only field-completion evidence captured when the WO was completed
// (P3.B.3). Rendered on a done WO's detail sheet.
export function WorkOrderEvidence({ wo }: { wo: WorkOrder }) {
  const hasGps = wo.gpsLat !== null && wo.gpsLng !== null
  const photos = wo.photos ?? []
  const completionNotes = wo.completionNotes?.trim()

  return (
    <DetailSection title="Bukti penyelesaian">
      <DetailMetaGrid>
        <DetailMeta label="Diselesaikan oleh">{wo.completedBy ?? '—'}</DetailMeta>
        <DetailMeta label="Waktu selesai">
          {wo.completedAt ? formatDateTime(wo.completedAt) : '—'}
        </DetailMeta>
        <DetailMeta label="Serial ONU">
          <span className="font-mono">{wo.scannedOnuSerial ?? '—'}</span>
        </DetailMeta>
        <DetailMeta label="Redaman RX">
          {wo.measuredRxPower !== null ? `${wo.measuredRxPower} dBm` : '—'}
        </DetailMeta>
        <DetailMeta label="Lokasi (GPS)">
          {hasGps ? (
            <a
              href={`https://www.google.com/maps?q=${wo.gpsLat},${wo.gpsLng}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {wo.gpsLat?.toFixed(5)}, {wo.gpsLng?.toFixed(5)}
            </a>
          ) : (
            '—'
          )}
        </DetailMeta>
        <DetailMeta label="Tanda tangan">
          {wo.signatureUrl && isSafeUrl(wo.signatureUrl) ? (
            <a href={wo.signatureUrl} target="_blank" rel="noreferrer" className="hover:underline">
              Lihat
            </a>
          ) : (
            '—'
          )}
        </DetailMeta>
      </DetailMetaGrid>

      <div>
        <p className="mb-1.5 text-[0.7rem] text-muted-foreground uppercase tracking-wider">
          Foto bukti
        </p>
        {photos.length > 0 ? (
          <ul className="grid gap-1.5">
            {photos.map((url, index) =>
              isSafeUrl(url) ? (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs hover:underline"
                  >
                    Foto {index + 1}
                  </a>
                </li>
              ) : (
                <li key={url} className="font-mono text-muted-foreground text-xs">
                  Foto {index + 1}
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Tidak ada foto.</p>
        )}
      </div>

      {completionNotes ? (
        <div>
          <p className="mb-1.5 text-[0.7rem] text-muted-foreground uppercase tracking-wider">
            Catatan penyelesaian
          </p>
          <p className="whitespace-pre-wrap text-sm">{completionNotes}</p>
        </div>
      ) : null}
    </DetailSection>
  )
}
