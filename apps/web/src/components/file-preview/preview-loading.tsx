import { Loader2 } from 'lucide-react'

export function PreviewLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Loading preview…</span>
    </div>
  )
}
