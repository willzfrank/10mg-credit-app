import type { UseQueryResult } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useCustomers, useDecideLoan, useFormatters, useLoans, useRepayments } from './hooks'

export function QueryBoundary<T>({
  query,
  isEmpty,
  emptyText,
  children,
}: {
  query: UseQueryResult<T>
  isEmpty: (data: T) => boolean
  emptyText: string
  children: (data: T) => ReactNode
}) {
  if (query.isPending) return <p role="status">Loading…</p>
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p className="text-sm text-destructive">{query.error.message}</p>
        <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
          {query.isFetching ? 'Retrying…' : 'Retry'}
        </Button>
      </div>
    )
  }
  if (isEmpty(query.data)) return <p className="text-sm opacity-70">{emptyText}</p>
  return children(query.data)
}

const th = 'px-3 py-2 font-medium'
const td = 'px-3 py-2 align-top break-words'
const card = 'rounded-lg border p-3'
const cardList = 'flex flex-col gap-3 md:hidden'
const table = 'hidden w-full table-fixed text-left text-sm md:table'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="opacity-70">{label}</dt>
      <dd className="min-w-0 break-words text-right">{children}</dd>
    </div>
  )
}

const STATUSES = ['all', 'pending', 'approved', 'rejected', 'repaid'] as const
type StatusFilter = (typeof STATUSES)[number]

export function ApplicationsPanel() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const loans = useLoans()
  const customers = useCustomers()
  const decide = useDecideLoan()
  const { money, date } = useFormatters()
  const nameOf = (userId: string) => customers.data?.find((c) => c.id === userId)?.name ?? '—'

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm">
        Status
        <select
          className="h-9 rounded-md border border-input px-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </label>

      {decide.error && <p role="alert" className="text-sm text-destructive">{decide.error.message}</p>}

      <QueryBoundary query={loans} isEmpty={(data) => data.length === 0} emptyText="No applications yet.">
        {(all) => {
          const rows = all.filter((l) => status === 'all' || l.status === status)
          if (rows.length === 0) return <p className="text-sm opacity-70">No applications match this filter.</p>

          const actions = (id: string, pending: boolean) =>
            pending && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  aria-label={`Approve ${id}`}
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ loanId: id, decision: 'approved' })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  aria-label={`Reject ${id}`}
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ loanId: id, decision: 'rejected' })}
                >
                  Reject
                </Button>
              </div>
            )

          return (
            <>
              <table className={table}>
                <thead>
                  <tr className="border-b">
                    <th className={th}>Customer</th>
                    <th className={th}>Amount</th>
                    <th className={th}>Tenor</th>
                    <th className={th}>Applied</th>
                    <th className={th}>Status</th>
                    <th className={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className={td}>{nameOf(l.userId)}</td>
                      <td className={td}>{money(l.amountMinor)}</td>
                      <td className={td}>{l.tenorMonths} mo</td>
                      <td className={td}>{date(l.createdAt)}</td>
                      <td className={`${td} capitalize`} data-testid={`status-${l.id}`}>{l.status}</td>
                      <td className={td}>{actions(l.id, l.status === 'pending')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className={cardList}>
                {rows.map((l) => (
                  <li key={l.id} className={card}>
                    <dl className="flex flex-col gap-1 text-sm">
                      <Row label="Customer">{nameOf(l.userId)}</Row>
                      <Row label="Amount">{money(l.amountMinor)}</Row>
                      <Row label="Tenor">{l.tenorMonths} mo</Row>
                      <Row label="Applied">{date(l.createdAt)}</Row>
                      <Row label="Status"><span className="capitalize">{l.status}</span></Row>
                    </dl>
                    {l.status === 'pending' && <div className="mt-3">{actions(l.id, true)}</div>}
                  </li>
                ))}
              </ul>
            </>
          )
        }}
      </QueryBoundary>
    </div>
  )
}

export function CustomersPanel() {
  const customers = useCustomers()
  return (
    <QueryBoundary query={customers} isEmpty={(d) => d.length === 0} emptyText="No customers yet.">
      {(rows) => (
        <>
          <table className={table}>
            <thead>
              <tr className="border-b">
                <th className={th}>Name</th>
                <th className={th}>Email</th>
                <th className={th}>Loans</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className={td}>{c.name}</td>
                  <td className={td}>{c.email}</td>
                  <td className={td}>{c.loanCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className={cardList}>
            {rows.map((c) => (
              <li key={c.id} className={card}>
                <dl className="flex flex-col gap-1 text-sm">
                  <Row label="Name">{c.name}</Row>
                  <Row label="Email">{c.email}</Row>
                  <Row label="Loans">{c.loanCount}</Row>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </QueryBoundary>
  )
}

export function RepaymentsPanel() {
  const repayments = useRepayments()
  const { money, date } = useFormatters()
  return (
    <QueryBoundary query={repayments} isEmpty={(d) => d.length === 0} emptyText="No repayments yet.">
      {(rows) => (
        <>
          <table className={table}>
            <thead>
              <tr className="border-b">
                <th className={th}>Date</th>
                <th className={th}>Customer</th>
                <th className={th}>Loan</th>
                <th className={th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className={td}>{date(r.paidAt)}</td>
                  <td className={td}>{r.customerName}</td>
                  <td className={td}>{r.loanId}</td>
                  <td className={td}>{money(r.amountMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className={cardList}>
            {rows.map((r) => (
              <li key={r.id} className={card}>
                <dl className="flex flex-col gap-1 text-sm">
                  <Row label="Date">{date(r.paidAt)}</Row>
                  <Row label="Customer">{r.customerName}</Row>
                  <Row label="Loan">{r.loanId}</Row>
                  <Row label="Amount">{money(r.amountMinor)}</Row>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </QueryBoundary>
  )
}
