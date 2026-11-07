import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRightIcon,
  PlusIcon,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QueryBoundary } from '../dashboard/panels'
import { useFormatters } from '../dashboard/hooks'
import { StatusBadge } from './StatusBadge'
import { useMyLoans } from './hooks'
import { PageHeader } from '../../shared/PageHeader'
import { SectionLabel } from '../../shared/TextBits'

type FilterStatus = 'all' | 'approved' | 'pending' | 'repaid'

export function MyLoansPage() {
  const loans = useMyLoans()
  const { money, date } = useFormatters()
  const [filter, setFilter] = useState<FilterStatus>('all')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My loans"
        description="Active facilities, terms, and repayment history."
        actions={
          <Link
            to="/portal/apply"
            className={`${buttonVariants()} h-8 px-3 text-xs gap-1.5 font-medium`}
          >
            <PlusIcon className="size-3.5" />
            <span>Apply for a loan</span>
          </Link>
        }
      />

      <QueryBoundary query={loans} isEmpty={(d) => d.length === 0} emptyText="You have no loans yet.">
        {(rows) => {
          const totalBorrowedMinor = rows
            .filter((l) => l.status === 'approved' || l.status === 'repaid')
            .reduce((sum, l) => sum + l.amountMinor, 0)
          const activeLoansCount = rows.filter((l) => l.status === 'approved').length
          const pendingCount = rows.filter((l) => l.status === 'pending').length

          const filteredRows = [...rows]
            .filter((l) => (filter === 'all' ? true : l.status === filter))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

          return (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border border-border rounded-lg bg-card p-4">
                <div className="flex flex-col gap-0.5 border-b sm:border-b-0 sm:border-r border-border pb-3 sm:pb-0 sm:pr-4">
                  <SectionLabel>
                    Active Facilities
                  </SectionLabel>
                  <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
                    {activeLoansCount}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 border-b sm:border-b-0 sm:border-r border-border pb-3 sm:pb-0 sm:px-4">
                  <SectionLabel>
                    Total Borrowed
                  </SectionLabel>
                  <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
                    {money(totalBorrowedMinor)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 pt-1 sm:pt-0 sm:pl-4">
                  <SectionLabel>
                    In Review
                  </SectionLabel>
                  <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
                    {pendingCount}
                  </span>
                </div>
              </div>

              <Card className="border border-border bg-card shadow-2xs rounded-lg overflow-hidden">
                <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-1">
                      {(
                        [
                          { id: 'all', label: 'All' },
                          { id: 'approved', label: 'Approved' },
                          { id: 'pending', label: 'Pending' },
                          { id: 'repaid', label: 'Repaid' },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFilter(f.id)}
                          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                            filter === f.id
                              ? 'bg-zinc-900 text-zinc-50'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] text-muted-foreground">
                      {filteredRows.length} {filteredRows.length === 1 ? 'loan' : 'loans'}
                    </span>
                  </div>

                  {filteredRows.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No loans match this filter.
                    </div>
                  ) : (
                    <ul className="flex flex-col divide-y divide-border border border-border rounded-md overflow-hidden bg-background">
                      {filteredRows.map((loan) => (
                        <li key={loan.id}>
                          <Link
                            to={`/portal/loans/${loan.id}`}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground tabular-nums">
                                  {money(loan.amountMinor)}
                                </span>
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  #{loan.id}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {loan.tenorMonths} months term · applied {date(loan.createdAt)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <StatusBadge status={loan.status} />
                              <ArrowRightIcon className="size-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        }}
      </QueryBoundary>
    </div>
  )
}
