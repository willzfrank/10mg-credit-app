import { Link, useParams } from 'react-router'
import type { MockLoan } from '../../mocks/db'
import { NotFoundError } from '../../shared/api/errors'
import { QueryBoundary } from '../dashboard/panels'
import { useFormatters } from '../dashboard/hooks'
import { outstandingMinor, totalPayableMinor } from '../loans/money'
import { StatusBadge } from './StatusBadge'
import { useLoan, useLoanRepayments } from './hooks'

type StepState = 'done' | 'current' | 'upcoming'

function timelineFor(loan: MockLoan): { label: string; state: StepState }[] {
  const { status } = loan
  const decision =
    status === 'pending'
      ? { label: 'Approved / Rejected', state: 'current' as const }
      : { label: status === 'rejected' ? 'Rejected' : 'Approved', state: 'done' as const }
  const steps = [{ label: 'Applied', state: 'done' as const }, decision]
  if (status !== 'rejected') {
    steps.push({
      label: 'Repaid',
      state: status === 'repaid' ? 'done' : status === 'approved' ? 'current' : 'upcoming',
    } as (typeof steps)[number])
  }
  return steps
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border p-3">
      <dt className="text-sm opacity-70">{label}</dt>
      <dd className="mt-1 font-medium break-words">{children}</dd>
    </div>
  )
}

export function LoanDetailsPage() {
  const { id = '' } = useParams()
  const loan = useLoan(id)
  const repayments = useLoanRepayments(id)
  const { money, date } = useFormatters()

  if (loan.error instanceof NotFoundError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <h1 className="text-xl font-semibold">Loan not found</h1>
        <p className="text-sm opacity-70">This loan doesn’t exist or isn’t yours.</p>
        <Link to="/portal" className="text-sm underline underline-offset-4">Back to my loans</Link>
      </div>
    )
  }

  return (
    <QueryBoundary query={loan} isEmpty={() => false} emptyText="">
      {(l) => {
        const total = totalPayableMinor(l)
        const showOutstanding = (l.status === 'approved' || l.status === 'repaid') && repayments.data
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl font-semibold">Loan {l.id}</h1>
              <StatusBadge status={l.status} />
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Detail label="Amount">{money(l.amountMinor)}</Detail>
              <Detail label="Tenor">{l.tenorMonths} months</Detail>
              <Detail label="Interest rate">{l.ratePct}% per year</Detail>
              <Detail label="Total payable">{money(total)}</Detail>
              <Detail label="Outstanding">
                {showOutstanding ? money(outstandingMinor(l, repayments.data!)) : '—'}
              </Detail>
              <Detail label="Applied">{date(l.createdAt)}</Detail>
            </dl>

            <section aria-label="Status timeline">
              <h2 className="mb-2 font-medium">Status</h2>
              <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {timelineFor(l).map((step) => (
                  <li
                    key={step.label}
                    aria-current={step.state === 'current' ? 'step' : undefined}
                    className={step.state === 'upcoming' ? 'opacity-50' : step.state === 'current' ? 'font-medium' : ''}
                  >
                    {step.state === 'done' ? '✓' : '○'} {step.label}
                  </li>
                ))}
              </ol>
            </section>

            <section aria-label="Repayment history" className="flex flex-col gap-2">
              <h2 className="font-medium">Repayment history</h2>
              <QueryBoundary query={repayments} isEmpty={(d) => d.length === 0} emptyText="No repayments yet.">
                {(rows) => (
                  <>
                    <table className="hidden w-full table-fixed text-left text-sm md:table">
                      <thead>
                        <tr className="border-b">
                          <th className="px-3 py-2 font-medium">Date</th>
                          <th className="px-3 py-2 font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id} className="border-b">
                            <td className="px-3 py-2">{date(r.paidAt)}</td>
                            <td className="px-3 py-2">{money(r.amountMinor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <ul className="flex flex-col gap-3 md:hidden">
                      {rows.map((r) => (
                        <li key={r.id} className="flex justify-between gap-3 rounded-lg border p-3 text-sm">
                          <span>{date(r.paidAt)}</span>
                          <span className="break-words text-right">{money(r.amountMinor)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </QueryBoundary>
            </section>

            <Link to="/portal" className="text-sm underline underline-offset-4">Back to my loans</Link>
          </div>
        )
      }}
    </QueryBoundary>
  )
}
