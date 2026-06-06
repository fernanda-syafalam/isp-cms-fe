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

export function BulkFirmwareDialog({ deviceIds, open, onOpenChange }: Props) {
  const [version, setVersion] = useState('v2.4.1')
  const bulk = useBulkAcs()

  const handleSubmit = async () => {
    try {
      await bulk.mutateAsync({
        action: 'firmware',
        deviceIds,
        firmwareVersion: version,
      })
      onOpenChange(false)
    } catch {
      // useBulkAcs surfaces a toast.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Push firmware ({deviceIds.length} perangkat)</DialogTitle>
          <DialogDescription>
            Menjadwalkan upgrade firmware TR-069 ke ONU terpilih.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="fw-version">Versi firmware</Label>
          <Input
            id="fw-version"
            className="font-mono"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={bulk.isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={bulk.isPending || version.trim().length === 0}>
            {bulk.isPending ? 'Menjadwalkan…' : 'Push firmware'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
