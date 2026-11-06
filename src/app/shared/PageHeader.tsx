import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
  leading,
  compact = false,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** Rendered before the title block, e.g. a back link. */
  leading?: ReactNode
  compact?: boolean
}) {
  const titleBlock = (
    <div>
      <h1 className={cn('font-semibold tracking-tight text-foreground', compact ? 'text-xl' : 'text-2xl')}>
        {title}
      </h1>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  )
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
      {leading ? (
        <div className="flex items-center gap-3">
          {leading}
          {titleBlock}
        </div>
      ) : (
        titleBlock
      )}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
