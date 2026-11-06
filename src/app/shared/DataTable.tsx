import type { ComponentProps, ReactNode } from 'react'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

/** Bordered wrapper shown on desktop only; pair with a mobile card list. */
export function TableCard({ children }: { children: ReactNode }) {
  return <div className="hidden rounded-md border border-border overflow-hidden bg-card md:block">{children}</div>
}

export function ColumnHead({
  align = 'left',
  className,
  ...props
}: ComponentProps<typeof TableHead> & { align?: 'left' | 'right' }) {
  return (
    <TableHead
      className={cn(
        'h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider',
        align === 'right' && 'text-right pr-4',
        className,
      )}
      {...props}
    />
  )
}
