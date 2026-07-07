import { ScrollTextIcon, ShieldCheckIcon } from 'lucide-react'
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

import { useRevokeOtherSessions, useRevokeSession, useSecurity } from '../hooks/useSecurity'
import { ChangePasswordDialog } from './ChangePasswordDialog'
import { DisableTwoFactorDialog } from './DisableTwoFactorDialog'
import { SecurityRbacCard } from './SecurityRbacCard'
import { SecuritySessionsCard } from './SecuritySessionsCard'
import { TwoFactorDialog } from './TwoFactorDialog'

export function SecurityPage() {
  const { data, isLoading, isError } = useSecurity()
  const role = useEffectiveRole()
  const revoke = useRevokeSession()
  const revokeOthers = useRevokeOtherSessions()
  const [twoFaOpen, setTwoFaOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

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
                <div className="flex flex-wrap gap-2">
                  {data.twoFactorEnabled ? (
                    <Button variant="outline" size="sm" onClick={() => setDisableOpen(true)}>
                      Nonaktifkan 2FA
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setTwoFaOpen(true)}>
                      Aktifkan 2FA
                    </Button>
                  )}
                  <ChangePasswordDialog />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <SecurityRbacCard role={role} />
      </div>

      <SecuritySessionsCard
        data={data}
        isLoading={isLoading}
        revoke={revoke}
        revokeOthers={revokeOthers}
      />

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
      <DisableTwoFactorDialog open={disableOpen} onOpenChange={setDisableOpen} />
    </div>
  )
}
