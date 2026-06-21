import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { ROLE_LABEL, type Role } from '@/lib/permissions'

const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: 'Akses penuh: katalog, mitra, staf, pengaturan, hapus/reset data.',
  staff: 'Operasional: pelanggan, tiket, billing. Tanpa kelola katalog/mitra/staf.',
  teknisi: 'Lapangan: work order, topologi, perangkat, dan update tiket.',
  mitra: 'Kemitraan: pantau pelanggan & prospek yang didaftarkan, saldo komisi.',
  customer: 'Portal mandiri: tagihan & laporan sendiri saja.',
}

// Role-based access reference: the operator's current role plus a per-role
// capability legend.
export function SecurityRbacCard({ role }: { role: Role }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Peran & akses (RBAC)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Peran Anda:</span>
          <StatusBadge tone="info" label={ROLE_LABEL[role]} />
        </div>
        <ul className="space-y-2 text-sm">
          {(Object.keys(ROLE_DESCRIPTION) as Role[]).map((r) => (
            <li key={r} className="flex gap-2">
              <span className="w-16 shrink-0 font-medium">{ROLE_LABEL[r]}</span>
              <span className="text-muted-foreground text-xs">{ROLE_DESCRIPTION[r]}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
