import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

// Small ghost icon button that copies a value to the clipboard — operators copy
// IDs (customer no, invoice no, IP, serial) constantly.
export function CopyButton({ value, label }: { value: string; label?: string }) {
  const handleCopy = () => {
    if (!navigator.clipboard) {
      toast.error('Penyalinan tidak didukung browser ini')
      return
    }
    navigator.clipboard.writeText(value).then(
      () => toast.success(label ?? 'Disalin'),
      () => toast.error('Gagal menyalin'),
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
      aria-label={`Salin ${value}`}
      onClick={handleCopy}
    >
      <CopyIcon className="size-3.5" />
    </Button>
  )
}
