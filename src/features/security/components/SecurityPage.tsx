import { LaptopIcon, ScrollTextIcon, ShieldCheckIcon, SmartphoneIcon } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffectiveRole } from '@/features/auth'
import { formatDateTime } from '@/lib/format'
import { ROLE_LABEL, type Role } from '@/lib/permissions'

import {
  useDisableTwoFactor,
  useRevokeOtherSessions,
  useRevokeSession,
  useSecurity,
} from '../hooks/useSecurity'
import { TwoFactorDialog } from './TwoFactorDialog'

const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: 'Akses penuh: katalog, mitra, staf, pengaturan, hapus/reset data.',
  staff: 'Operasional: pelanggan, tiket, billing. Tanpa kelola katalog/mitra/staf.',
  teknisi: 'Lapangan: work order, topologi, perangkat, dan update tiket.',
  mitra: 'Kemitraan: pantau pelanggan & prospek yang didaftarkan, saldo komisi.',
  customer: 'Portal mandiri: tagihan & laporan sendiri saja.',
}

export function SecurityPage() {
  const { data, isLoading, isError } = useSecurity()
  const role = useEffectiveRole()
  const disable = useDisableTwoFactor()
  const revoke = useRevokeSession()
  const revokeOthers = useRevokeOtherSessions()
  const [twoFaOpen, setTwoFaOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keamanan"
        description="Autentikasi dua faktor, sesi aktif, dan kontrol akses berbasis peran."
      />

      {isError ? (
        <p className="text-destructive text-sm" role="alert">
          Gagal memuat data keamanan.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Autentikasi dua faktor (2FA)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading || !data ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-muted-foreground" />
                  <StatusBadge
                    tone={data.twoFactorEnabled ? 'success' : 'warning'}
                    label={data.twoFactorEnabled ? 'Aktif' : 'Nonaktif'}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Tambahkan lapisan keamanan dengan kode dari aplikasi authenticator.
                </p>
                {data.twoFactorEnabled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disable.isPending}
                    onClick={() => disable.mutate()}
                  >
                    Nonaktifkan 2FA
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setTwoFaOpen(true)}>
                    Aktifkan 2FA
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

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
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Sesi aktif</CardTitle>
          {data && data.sessions.length > 1 ? (
            <Button
              variant="outline"
              size="sm"
              disabled={revokeOthers.isPending}
              onClick={() => revokeOthers.mutate()}
            >
              Akhiri sesi lain
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {isLoading || !data ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <ul className="divide-y divide-border">
              {data.sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    {s.device.toLowerCase().includes('android') ||
                    s.device.toLowerCase().includes('ios') ? (
                      <SmartphoneIcon className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <LaptopIcon className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {s.device}
                        {s.current ? (
                          <span className="ml-2 text-green-600 text-xs">(sesi ini)</span>
                        ) : null}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {s.ip} · {formatDateTime(s.lastActiveAt)}
                      </p>
                    </div>
                  </div>
                  {!s.current ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={revoke.isPending}
                      onClick={() => revoke.mutate(s.id)}
                    >
                      Akhiri
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log audit</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <StatusBadge tone="success" label="Append-only" />
          <p className="text-muted-foreground text-sm">
            Setiap aksi sensitif tercatat permanen & tidak dapat diubah.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <ScrollTextIcon className="size-4" />
                Tentang
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log audit immutable</AlertDialogTitle>
                <AlertDialogDescription>
                  Log audit bersifat append-only: entri tidak dapat diedit atau dihapus dari
                  antarmuka. Lihat riwayat lengkap di halaman Log Audit.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Tutup</AlertDialogCancel>
                <AlertDialogAction>Mengerti</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <TwoFactorDialog open={twoFaOpen} onOpenChange={setTwoFaOpen} />
    </div>
  )
}
