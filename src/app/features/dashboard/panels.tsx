import type { UseQueryResult } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import {
  FileTextIcon,
  SearchIcon,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '../portal/StatusBadge'
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
  if (query.isPending) {
    return (
      <div role="status" className="flex flex-col gap-2.5 py-4">
        <span className="sr-only">Loading…</span>
        <Skeleton className="h-9 w-full rounded" />
        <Skeleton className="h-9 w-full rounded" />
        <Skeleton className="h-9 w-2/3 rounded" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <Alert variant="destructive" className="items-start my-2">
        <AlertDescription className="flex items-center justify-between gap-3 w-full">
          <span>{query.error.message}</span>
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching} className="h-7 text-xs">
            {query.isFetching ? 'Retrying…' : 'Retry'}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  if (isEmpty(query.data)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-md border border-dashed border-border bg-muted/20">
        <FileTextIcon className="size-6 text-muted-foreground/60 mb-2" />
        <p className="text-xs font-medium text-foreground">{emptyText}</p>
      </div>
    )
  }
  return children(query.data)
}

function Person({ name, email }: { name: string; email?: string }) {
  const initials = name === '—' ? '?' : name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="size-6 rounded">
        <AvatarFallback className="bg-accent text-[10px] font-medium text-accent-foreground rounded">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-none min-w-0">
        <span className="font-medium text-xs whitespace-nowrap text-foreground">{name}</span>
        {email && <span className="text-[10px] text-muted-foreground truncate mt-0.5">{email}</span>}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-2 py-1 text-xs border-b border-border/50 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium">{children}</dd>
    </div>
  )
}

const labelOf = (s: string) => (s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1))
const STATUSES = ['all', 'pending', 'approved', 'rejected', 'repaid'] as const
type StatusFilter = (typeof STATUSES)[number]

export function ApplicationsPanel() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const loans = useLoans()
  const customers = useCustomers()
  const decide = useDecideLoan()
  const { money, date } = useFormatters()
  const nameOf = (userId: string) => customers.data?.find((c) => c.id === userId)?.name ?? '—'

  return (
    <div className="flex flex-col gap-3.5">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative max-w-xs w-full">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search borrower or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-xs text-muted-foreground">
            Status
          </Label>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger id="status-filter" className="h-8 w-32 text-xs bg-background">
              <SelectValue>{(v: string) => labelOf(v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {labelOf(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {decide.error && (
        <Alert variant="destructive">
          <AlertDescription>{decide.error.message}</AlertDescription>
        </Alert>
      )}

      <QueryBoundary query={loans} isEmpty={(data) => data.length === 0} emptyText="No applications yet.">
        {(all) => {
          const query = search.toLowerCase().trim()
          const rows = all
            .filter((l) => status === 'all' || l.status === status)
            .filter((l) => {
              if (!query) return true
              const cName = nameOf(l.userId).toLowerCase()
              return cName.includes(query) || l.id.toLowerCase().includes(query)
            })

          if (rows.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-md border border-dashed border-border bg-muted/20">
                <p className="text-xs text-muted-foreground">No applications match this filter.</p>
              </div>
            )
          }

          const actions = (id: string, pending: boolean) =>
            pending && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  aria-label={`Approve ${id}`}
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ loanId: id, decision: 'approved' })}
                  className="h-7 px-2.5 text-xs font-medium cursor-pointer"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`Reject ${id}`}
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ loanId: id, decision: 'rejected' })}
                  className="h-7 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive border-border cursor-pointer"
                >
                  Reject
                </Button>
              </div>
            )

          return (
            <>
              {/* Desktop Table View */}
              <div className="hidden rounded-md border border-border overflow-hidden bg-card md:block">
                <Table>
                  <TableHeader className="bg-muted/40 border-b border-border">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Borrower</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tenor</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Applied</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((l) => (
                      <TableRow key={l.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="py-2.5 px-3">
                          <Person name={nameOf(l.userId)} />
                        </TableCell>
                        <TableCell className="py-2.5 px-3 font-medium tabular-nums text-foreground">
                          {money(l.amountMinor)}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-xs text-muted-foreground">
                          {l.tenorMonths} mo
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-xs text-muted-foreground">{date(l.createdAt)}</TableCell>
                        <TableCell className="py-2.5 px-3" data-testid={`status-${l.id}`}>
                          <StatusBadge status={l.status} />
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right pr-4">
                          <div className="flex justify-end">
                            {actions(l.id, l.status === 'pending')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <ul className="flex flex-col gap-2.5 md:hidden">
                {rows.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-md border border-border bg-card p-3 shadow-2xs flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <Person name={nameOf(l.userId)} />
                      <div data-testid={`status-${l.id}`}>
                        <StatusBadge status={l.status} />
                      </div>
                    </div>
                    <dl className="flex flex-col gap-0.5 rounded bg-muted/30 p-2">
                      <Row label="Amount">
                        <span className="font-semibold text-foreground">{money(l.amountMinor)}</span>
                      </Row>
                      <Row label="Tenor">{l.tenorMonths} mo</Row>
                      <Row label="Applied">{date(l.createdAt)}</Row>
                    </dl>
                    {l.status === 'pending' && <div className="pt-1">{actions(l.id, true)}</div>}
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
  const [search, setSearch] = useState('')

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative max-w-xs w-full">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-xs bg-background"
        />
      </div>

      <QueryBoundary query={customers} isEmpty={(d) => d.length === 0} emptyText="No customers yet.">
        {(all) => {
          const query = search.toLowerCase().trim()
          const rows = all.filter((c) => {
            if (!query) return true
            return c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
          })

          if (rows.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-md border border-dashed border-border bg-muted/20">
                <p className="text-xs text-muted-foreground">No customers match this filter.</p>
              </div>
            )
          }

          return (
            <>
              {/* Desktop Table */}
              <div className="hidden rounded-md border border-border overflow-hidden bg-card md:block">
                <Table>
                  <TableHeader className="bg-muted/40 border-b border-border">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Borrower</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Loans Borrowed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((c) => (
                      <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="py-2.5 px-3">
                          <Person name={c.name} />
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-xs text-muted-foreground font-mono">{c.email}</TableCell>
                        <TableCell className="py-2.5 px-3 text-xs font-medium">
                          {c.loanCount} {c.loanCount === 1 ? 'loan' : 'loans'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <ul className="flex flex-col gap-2.5 md:hidden">
                {rows.map((c) => (
                  <li key={c.id} className="rounded-md border border-border bg-card p-3 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <Person name={c.name} />
                      <span className="text-xs font-medium">
                        {c.loanCount} loans
                      </span>
                    </div>
                    <dl className="flex flex-col gap-0.5 rounded bg-muted/30 p-2 text-xs">
                      <Row label="Email">{c.email}</Row>
                      <Row label="ID">
                        <span className="font-mono text-[10px]">{c.id}</span>
                      </Row>
                    </dl>
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

export function RepaymentsPanel() {
  const repayments = useRepayments()
  const { money, date } = useFormatters()
  const [search, setSearch] = useState('')

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative max-w-xs w-full">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by borrower or loan ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-xs bg-background"
        />
      </div>

      <QueryBoundary query={repayments} isEmpty={(d) => d.length === 0} emptyText="No repayments yet.">
        {(all) => {
          const query = search.toLowerCase().trim()
          const rows = all.filter((r) => {
            if (!query) return true
            return (
              r.customerName.toLowerCase().includes(query) ||
              r.loanId.toLowerCase().includes(query) ||
              r.id.toLowerCase().includes(query)
            )
          })

          if (rows.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-md border border-dashed border-border bg-muted/20">
                <p className="text-xs text-muted-foreground">No repayments match this filter.</p>
              </div>
            )
          }

          return (
            <>
              {/* Desktop Table */}
              <div className="hidden rounded-md border border-border overflow-hidden bg-card md:block">
                <Table>
                  <TableHeader className="bg-muted/40 border-b border-border">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Borrower</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Loan Reference</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right pr-4">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="py-2.5 px-3 text-xs text-muted-foreground">{date(r.paidAt)}</TableCell>
                        <TableCell className="py-2.5 px-3">
                          <Person name={r.customerName} />
                        </TableCell>
                        <TableCell className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          {r.loanId}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right pr-4 font-semibold tabular-nums text-foreground">
                          {money(r.amountMinor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <ul className="flex flex-col gap-2.5 md:hidden">
                {rows.map((r) => (
                  <li key={r.id} className="rounded-md border border-border bg-card p-3 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <Person name={r.customerName} />
                      <span className="font-semibold text-xs tabular-nums text-foreground">
                        {money(r.amountMinor)}
                      </span>
                    </div>
                    <dl className="flex flex-col gap-0.5 rounded bg-muted/30 p-2 text-xs">
                      <Row label="Date">{date(r.paidAt)}</Row>
                      <Row label="Loan">
                        <span className="font-mono text-[10px]">{r.loanId}</span>
                      </Row>
                    </dl>
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
