import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Small uppercase caption used above metrics and sections. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('text-[11px] font-medium text-muted-foreground uppercase tracking-wider', className)}>
      {children}
    </span>
  )
}

/** Label/value line with a faint divider. */
export function DetailRow({ label, children, strong = false }: { label: ReactNode; children: ReactNode; strong?: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs py-1 border-b border-border/50">
      <span className={strong ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{label}</span>
      <span className={cn('tabular-nums text-foreground', strong ? 'font-semibold' : 'font-medium')}>{children}</span>
    </div>
  )
}
