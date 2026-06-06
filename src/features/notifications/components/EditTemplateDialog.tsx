import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { NotificationTemplate } from '@/schemas/notification'

import { useUpdateNotificationTemplate } from '../hooks/useNotifications'

const VARIABLES = ['{nama}', '{no_tagihan}', '{jumlah}', '{jatuh_tempo}']

type Props = {
  template: NotificationTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTemplateDialog({ template, open, onOpenChange }: Props) {
  const [body, setBody] = useState(template.body)
  const update = useUpdateNotificationTemplate(template.id)

  const handleSave = async () => {
    try {
      await update.mutateAsync({ body })
      onOpenChange(false)
    } catch {
      // useUpdateNotificationTemplate surfaces a toast.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setBody(template.body)
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit template — {template.name}</DialogTitle>
          <DialogDescription>Pesan WhatsApp yang dikirim saat event ini terjadi.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="tpl-body">Isi pesan</Label>
          <Textarea id="tpl-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          <p className="text-muted-foreground text-xs">Variabel: {VARIABLES.join(' · ')}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={update.isPending}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={update.isPending || body.trim().length === 0}>
            {update.isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
