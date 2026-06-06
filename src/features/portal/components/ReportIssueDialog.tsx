import { LifeBuoyIcon } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { useReportIssue } from '../hooks/usePortal'

export function ReportIssueDialog() {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const report = useReportIssue()

  const handleSubmit = async () => {
    try {
      await report.mutateAsync({ subject })
      setSubject('')
      setOpen(false)
    } catch {
      // useReportIssue surfaces a toast.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LifeBuoyIcon className="size-4" />
          Lapor gangguan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lapor gangguan</DialogTitle>
          <DialogDescription>
            Ceritakan kendala layanan Anda. Tim teknis kami akan menindaklanjuti.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="issue-subject">Keluhan</Label>
          <Textarea
            id="issue-subject"
            rows={4}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="cth. Internet sering putus sejak kemarin malam"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={report.isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={report.isPending || subject.trim().length < 5}>
            {report.isPending ? 'Mengirim…' : 'Kirim laporan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
