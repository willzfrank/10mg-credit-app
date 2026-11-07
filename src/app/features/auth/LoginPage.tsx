import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router'
import { z } from 'zod'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { demoAccounts, type DemoAccount } from '../../mocks/tenants'
import { login } from '../../shared/auth/authApi'
import { useSession } from '../../shared/auth/authStore'
import { homePathFor } from '../../shared/auth/homePath'
import { TenantLogo } from '../tenant/TenantLogo'
import { useTenant } from '../tenant/useTenant'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { slug, name } = useTenant()
  const session = useSession(slug)
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => login(slug, values),
    onSuccess: (s) => navigate(homePathFor(s.user.role), { replace: true }),
  })

  if (session) return <Navigate to={homePathFor(session.user.role)} replace />

  const accounts = demoAccounts[slug] ?? []

  const selectDemoAccount = ({ email, password }: DemoAccount) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', password, { shouldValidate: true })
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-2 bg-white dark:bg-zinc-950">
      <div
        className="hidden lg:flex flex-col justify-center items-center p-12 text-center text-white relative"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight text-white">
            Access Credit with Confidence
          </h2>
          <p className="text-sm xl:text-base text-white/90 leading-relaxed">
            Apply in minutes, track your repayments, and manage your credit easily.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <TenantLogo className="h-9 w-auto object-contain mb-6" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Sign in to {name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1.5">
              Enter your details to sign in to your account
            </p>
          </div>

          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-normal text-gray-600 dark:text-zinc-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                className="h-11 rounded-lg bg-[#f0f4f9] dark:bg-zinc-900 border-0 px-4 text-sm text-gray-900 dark:text-white focus-visible:ring-1 focus-visible:ring-primary shadow-none"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <span role="alert" className="text-xs text-destructive block">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-normal text-gray-600 dark:text-zinc-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 rounded-lg bg-[#f0f4f9] dark:bg-zinc-900 border-0 px-4 pr-10 text-sm text-gray-900 dark:text-white focus-visible:ring-1 focus-visible:ring-primary shadow-none"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <span role="alert" className="text-xs text-destructive block">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="flex justify-end">
              <span
                className="text-xs font-medium hover:underline cursor-pointer"
                style={{ color: 'var(--primary)' }}
              >
                Forgot Password?
              </span>
            </div>

            {mutation.error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {mutation.error.message}
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-lg text-sm font-medium cursor-pointer shadow-none transition-opacity hover:opacity-90 mt-1"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Signing in…' : 'Sign in'}
            </Button>

            <p className="text-center text-xs text-gray-500 dark:text-zinc-400 mt-2">
              Don't Have An Account?{' '}
              <span
                className="font-medium hover:underline cursor-pointer"
                style={{ color: 'var(--primary)' }}
              >
                Create Account
              </span>
            </p>

            {accounts.length > 0 && (
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">
                  Demo accounts:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {accounts.map((account) => {
                    const isAdmin = account.role === 'lender_admin'
                    return (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => selectDemoAccount(account)}
                        className="flex flex-col items-start p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 hover:bg-gray-100 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                          {isAdmin ? 'Lender Admin' : 'Borrower'}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono truncate w-full mt-0.5">
                          {account.email}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-[11px] text-gray-400 dark:text-zinc-600 mt-8 font-mono">
            {slug} · {name}
          </p>
        </div>
      </div>
    </div>
  )
}
