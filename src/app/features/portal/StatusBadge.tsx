import { Badge } from '@/components/ui/badge'

const STYLES: Record<string, { badge: string; dot: string }> = {
  pending: {
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  approved: {
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  rejected: {
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    dot: 'bg-rose-500',
  },
  repaid: {
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    dot: 'bg-blue-500',
  },
}

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status]
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 h-5 px-2 font-normal text-[11px] capitalize rounded ${
        style?.badge ?? 'bg-muted text-muted-foreground border-border'
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full shrink-0 ${style?.dot ?? 'bg-current'}`}
      />
      {status}
    </Badge>
  )
}
