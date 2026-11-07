import { Link, useParams } from 'react-router'
import {
  ArrowLeftIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import type { MockLoan } from '../../mocks/db'
import { NotFoundError } from '../../shared/api/errors'
import { QueryBoundary } from '../dashboard/panels'
import { useFormatters } from '../dashboard/hooks'
import { outstandingMinor, totalPayableMinor } from '../loans/money'
import { RepaymentForm } from './RepaymentForm'
import { StatusBadge } from './StatusBadge'
import { useLoan, useLoanRepayments } from './hooks'
import { ColumnHead, TableCard } from '../../shared/DataTable'
import { PageHeader } from '../../shared/PageHeader'
import { SectionLabel } from '../../shared/TextBits'

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

function Detail({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Card size="sm" className="min-w-0 border border-border bg-card shadow-2xs">
      <CardContent className="p-3">
        <dt><SectionLabel>{label}</SectionLabel></dt>
        <dd className="mt-1 text-sm font-semibold tracking-tight text-foreground break-words tabular-nums">
          {children}
        </dd>
      </CardContent>
    </Card>
  )
}

export function LoanDetailsPage() {
  const { id = '' } = useParams()
  const loan = useLoan(id)
  const repayments = useLoanRepayments(id)
  const { money, date } = useFormatters()

  if (loan.error instanceof NotFoundError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-border bg-card gap-3 my-8"
      >
        <h1 className="text-xl font-semibold tracking-tight">Loan not found</h1>
        <p className="text-xs text-muted-foreground">This loan doesn’t exist or isn’t yours.</p>
        <Link
          to="/portal"
          className="text-xs text-primary underline underline-offset-4 mt-2"
        >
          Back to my loans
        </Link>
      </div>
    )
  }

  return (
    <QueryBoundary query={loan} isEmpty={() => false} emptyText="">
      {(l) => {
        const total = totalPayableMinor(l)
        const showOutstanding = (l.status === 'approved' || l.status === 'repaid') && repayments.data
        const outstanding = showOutstanding ? outstandingMinor(l, repayments.data!) : 0
        const totalRepaidMinor = showOutstanding ? Math.max(0, total - outstanding) : 0
        const repaymentProgress = total > 0 ? Math.min(100, Math.round((totalRepaidMinor / total) * 100)) : 0

        return (
          <div className="flex flex-col gap-6">
            <PageHeader
              compact
              leading={
                <Link
                  to="/portal"
                  className="flex size-7 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Back to loans"
                >
                  <ArrowLeftIcon className="size-3.5" />
                </Link>
              }
              title={<>Loan {l.id}</>}
              description={<>Originated on {date(l.createdAt)}</>}
              actions={<StatusBadge status={l.status} />}
            />

            {showOutstanding && (
              <Card className="border border-border bg-card shadow-2xs rounded-lg">
                <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <SectionLabel>
                        Repayment Progress
                      </SectionLabel>
                      <p className="text-lg font-semibold tracking-tight text-foreground mt-0.5 tabular-nums">
                        {repaymentProgress}% Repaid
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Remaining Balance</span>
                      <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">
                        {money(outstanding)}
                      </p>
                    </div>
                  </div>

                  <Progress value={repaymentProgress} max={100} className="h-2 bg-muted" />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Paid: {money(totalRepaidMinor)}</span>
                    <span>Total obligation: {money(total)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Detail label="Amount">{money(l.amountMinor)}</Detail>
              <Detail label="Tenor">{l.tenorMonths} months</Detail>
              <Detail label="Interest rate">{l.ratePct}% per year</Detail>
              <Detail label="Total payable">{money(total)}</Detail>
              <Detail label="Outstanding">
                {showOutstanding ? money(outstanding) : '—'}
              </Detail>
              <Detail label="Applied">{date(l.createdAt)}</Detail>
            </dl>

            <section
              aria-label="Status timeline"
              className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-2xs"
            >
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </h2>

              <ol className="flex flex-wrap items-center gap-2 text-xs">
                {timelineFor(l).map((step) => {
                  const isDone = step.state === 'done'
                  const isCurrent = step.state === 'current'
                  return (
                    <li
                      key={step.label}
                      aria-current={step.state === 'current' ? 'step' : undefined}
                      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium border ${
                        isDone
                          ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                          : isCurrent
                          ? 'bg-zinc-900 text-zinc-50 border-zinc-900'
                          : 'bg-muted/40 text-muted-foreground border-border opacity-50'
                      }`}
                    >
                      <span>{step.state === 'done' ? '✓' : '○'}</span>
                      <span>{step.label}</span>
                    </li>
                  )
                })}
              </ol>
            </section>

            {l.status === 'approved' && repayments.data && outstanding > 0 && (
              <RepaymentForm loanId={l.id} outstandingMinor={outstanding} />
            )}

            <section
              aria-label="Repayment history"
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:p-5 shadow-2xs"
            >
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Repayment history
              </h2>

              <QueryBoundary query={repayments} isEmpty={(d) => d.length === 0} emptyText="No repayments yet.">
                {(rows) => (
                  <>
                    <TableCard>
                      <Table>
                        <TableHeader className="bg-muted/40 border-b border-border">
                          <TableRow className="hover:bg-transparent">
                            <ColumnHead>Date</ColumnHead>
                            <ColumnHead align="right">
                              Amount
                            </ColumnHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((r) => (
                            <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                              <TableCell className="py-2.5 px-3 text-xs text-muted-foreground">
                                {date(r.paidAt)}
                              </TableCell>
                              <TableCell className="py-2.5 px-3 text-right pr-4 font-medium tabular-nums text-foreground">
                                {money(r.amountMinor)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableCard>

                    <ul className="flex flex-col gap-2 md:hidden">
                      {rows.map((r) => (
                        <li
                          key={r.id}
                          className="flex justify-between items-center gap-3 rounded border border-border bg-background p-2.5 text-xs"
                        >
                          <span className="text-muted-foreground">{date(r.paidAt)}</span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {money(r.amountMinor)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </QueryBoundary>
            </section>

            <div>
              <Link
                to="/portal"
                className="text-xs text-primary underline underline-offset-4"
              >
                Back to my loans
              </Link>
            </div>
          </div>
        )
      }}
    </QueryBoundary>
  )
}
