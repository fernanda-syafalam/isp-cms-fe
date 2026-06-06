import { SendIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { NotificationEvent, NotificationTemplate } from '@/schemas/notification'

import { useSendNotification } from '../hooks/useNotifications'

type Props = {
  templates: NotificationTemplate[]
}

export function TestSendDialog({ templates }: Props) {
  const [open, setOpen] = useState(false)
  const [event, setEvent] = useState<NotificationEvent | ''>('')
  const [to, setTo] = useState('0812')
  const send = useSendNotification()

  const handleSend = async () => {
    if (!event) return
    try {
      await send.mutateAsync({ event, to })
      setOpen(false)
    } catch {
      // useSendNotification surfaces a toast.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <SendIcon className="size-4" />
          <span className="hidden sm:inline">Kirim uji</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kirim pesan uji</DialogTitle>
          <DialogDescription>
            Kirim contoh pesan WhatsApp dari sebuah template ke nomor tujuan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={event} onValueChange={(v) => setEvent(v as NotificationEvent)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.event}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="send-to">Nomor tujuan</Label>
            <Input
              id="send-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0812xxxxxxx"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={send.isPending}>
            Batal
          </Button>
          <Button onClick={handleSend} disabled={send.isPending || !event || to.length < 6}>
            {send.isPending ? 'Mengirim…' : 'Kirim'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
