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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useBulkAcs } from '../hooks/useAcs'

type Props = {
  deviceIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkWifiDialog({ deviceIds, open, onOpenChange }: Props) {
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const bulk = useBulkAcs()

  const handleSubmit = async () => {
    try {
      await bulk.mutateAsync({ action: 'wifi', deviceIds, ssid, password })
      onOpenChange(false)
    } catch {
      // useBulkAcs surfaces a toast.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set WiFi ({deviceIds.length} perangkat)</DialogTitle>
          <DialogDescription>
            Mengubah SSID & kata sandi WiFi ONU terpilih via TR-069.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wifi-ssid">SSID</Label>
            <Input id="wifi-ssid" value={ssid} onChange={(e) => setSsid(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wifi-pass">Kata sandi</Label>
            <Input id="wifi-pass" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={bulk.isPending}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={bulk.isPending || ssid.trim().length < 1 || password.length < 8}
          >
            {bulk.isPending ? 'Menerapkan…' : 'Terapkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
