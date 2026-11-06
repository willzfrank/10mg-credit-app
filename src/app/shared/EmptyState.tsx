import type { ReactNode } from 'react'

export function EmptyState({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-md border border-dashed border-border bg-muted/20">
      {icon}
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  )
}
