import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { formatMoney } from '../../shared/formatMoney'
import type { TenantSettings } from '../tenant/types'
import { useTenant } from '../tenant/useTenant'
import { newIdempotencyKey, useSubmitApplication } from './hooks'

interface Limits {
  min: string
  max: string
  minValue: number
  maxValue: number
  maxTenor: number
}

const hasAtMostTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6

const makeSchema = (limits: Limits) =>
  z.object({
    amount: z
      .number({ error: 'Enter an amount' })
      .min(limits.minValue, `Amount must be at least ${limits.min}`)
      .max(limits.maxValue, `Amount must be at most ${limits.max}`)
      .refine(hasAtMostTwoDecimals, 'Use at most 2 decimal places'),
    tenorMonths: z
      .number({ error: 'Enter a number of months' })
      .int('Use whole months')
      .min(1, 'Tenor must be at least 1 month')
      .max(limits.maxTenor, `Tenor must be at most ${limits.maxTenor} months`),
  })

type ApplyValues = z.infer<ReturnType<typeof makeSchema>>

const fmtLimit = (major: number, s: TenantSettings) => formatMoney(Math.round(major * 100), s.currency, s.locale)

export function ApplyPage() {
  const { settings } = useTenant()
  const navigate = useNavigate()
  const [idempotencyKey] = useState(() => newIdempotencyKey())
  const submit = useSubmitApplication()

  const limits = useMemo<Limits>(
    () => ({
      min: fmtLimit(settings.minLoanAmount, settings),
      max: fmtLimit(settings.maxLoanAmount, settings),
      minValue: settings.minLoanAmount,
      maxValue: settings.maxLoanAmount,
      maxTenor: settings.maxTenorMonths,
    }),
    [settings],
  )
  const schema = useMemo(() => makeSchema(limits), [limits])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: ApplyValues) =>
    submit.mutate(
      { amountMinor: Math.round(values.amount * 100), tenorMonths: values.tenorMonths, idempotencyKey },
      { onSuccess: (loan) => navigate(`/portal/loans/${loan.id}`) },
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Apply for a loan</h1>

      <label className="flex flex-col gap-1 text-sm">
        Amount ({settings.currency})
        <input
          type="number"
          step="any"
          inputMode="decimal"
          className="h-9 rounded-md border border-input px-3"
          aria-invalid={!!errors.amount}
          {...register('amount', { valueAsNumber: true })}
        />
        <span className="opacity-70">Between {limits.min} and {limits.max}</span>
        {errors.amount && <span role="alert" className="text-destructive">{errors.amount.message}</span>}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Tenor (months)
        <input
          type="number"
          inputMode="numeric"
          className="h-9 rounded-md border border-input px-3"
          aria-invalid={!!errors.tenorMonths}
          {...register('tenorMonths', { valueAsNumber: true })}
        />
        <span className="opacity-70">Between 1 and {limits.maxTenor} months</span>
        {errors.tenorMonths && <span role="alert" className="text-destructive">{errors.tenorMonths.message}</span>}
      </label>

      {submit.error && <p role="alert" className="text-sm text-destructive">{submit.error.message}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? 'Submitting…' : 'Submit'}
        </Button>
        <Link to="/portal" className="inline-flex h-8 items-center px-2.5 text-sm underline underline-offset-4">
          Cancel
        </Link>
      </div>
    </form>
  )
}
