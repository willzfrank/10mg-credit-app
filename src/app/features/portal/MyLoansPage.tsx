import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import { QueryBoundary } from '../dashboard/panels'
import { useFormatters } from '../dashboard/hooks'
import { StatusBadge } from './StatusBadge'
import { useMyLoans } from './hooks'

export function MyLoansPage() {
  const loans = useMyLoans()
  const { money, date } = useFormatters()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">My loans</h1>
        <Link to="/portal/apply" className={buttonVariants()}>
          Apply
        </Link>
      </div>
      <QueryBoundary query={loans} isEmpty={(d) => d.length === 0} emptyText="You have no loans yet.">
        {(rows) => (
          <ul className="flex flex-col gap-3">
            {[...rows]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((loan) => (
                <li key={loan.id}>
                  <Link
                    to={`/portal/loans/${loan.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium break-words">{money(loan.amountMinor)}</span>
                      <span className="block opacity-70">
                        {loan.tenorMonths} months · applied {date(loan.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={loan.status} />
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  )
}
