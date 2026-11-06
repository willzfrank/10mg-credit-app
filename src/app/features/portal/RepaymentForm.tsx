import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AmountInput } from '../../shared/AmountInput'
import { useFormatters } from '../dashboard/hooks'
import { useTenant } from '../tenant/useTenant'
import { useMakeRepayment } from './hooks'

const hasAtMostTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6

const makeRepaymentSchema = (outstandingMinor: number, formattedOutstanding: string) =>
  z.object({
    amount: z
      .number({ error: 'Enter an amount' })
      .positive('Amount must be greater than zero')
      .refine(hasAtMostTwoDecimals, 'Use at most 2 decimal places')
      .refine((v) => Math.round(v * 100) <= outstandingMinor, `Amount can be at most ${formattedOutstanding}`),
  })

export function RepaymentForm({ loanId, outstandingMinor }: { loanId: string; outstandingMinor: number }) {
  const { settings } = useTenant()
  const { money } = useFormatters()
  const repay = useMakeRepayment(loanId)

  const formattedOutstanding = money(outstandingMinor)
  const schema = useMemo(
    () => makeRepaymentSchema(outstandingMinor, formattedOutstanding),
    [outstandingMinor, formattedOutstanding],
  )
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { amount: undefined } })

  const onSubmit = ({ amount }: z.infer<typeof schema>) =>
    repay.mutate({ amountMinor: Math.round(amount * 100) }, { onSuccess: () => reset({ amount: undefined }) })

  return (
    <section
      aria-label="Make a repayment"
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:p-5 shadow-2xs"
    >
      <h2 className="text-sm font-semibold tracking-tight text-foreground">Make a repayment</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
        <Label className="flex-col items-stretch gap-1.5 text-xs font-medium text-foreground">
          <span>Amount ({settings.currency})</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <AmountInput
                  placeholder="0.00"
                  className="h-9 text-xs font-medium tabular-nums sm:max-w-56"
                  aria-invalid={!!errors.amount}
                  name={field.name}
                  onBlur={field.onBlur}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 text-xs cursor-pointer"
              onClick={() => setValue('amount', outstandingMinor / 100, { shouldValidate: true })}
            >
              Pay full balance
            </Button>
          </div>
          <span className="text-[11px] font-normal text-muted-foreground">Outstanding: {formattedOutstanding}</span>
          {errors.amount && (
            <span role="alert" className="text-xs font-normal text-destructive">
              {errors.amount.message}
            </span>
          )}
        </Label>

        {repay.error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            {repay.error.message}
          </p>
        )}
        {repay.isSuccess && (
          <p role="status" className="text-xs font-medium text-emerald-600">
            Repayment recorded.
          </p>
        )}

        <div>
          <Button type="submit" disabled={repay.isPending} className="h-8 px-4 text-xs font-medium cursor-pointer">
            {repay.isPending ? 'Paying…' : 'Pay'}
          </Button>
        </div>
      </form>
    </section>
  )
}
