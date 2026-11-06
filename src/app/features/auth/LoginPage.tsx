import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router'
import { z } from 'zod'
import { ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, ShieldCheckIcon } from 'lucide-react'
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
    <main
      className="relative min-h-screen w-full flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans antialiased overflow-x-hidden selection:bg-primary/20"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% -5%, color-mix(in srgb, var(--primary) 18%, transparent) 0%, transparent 55%),
          radial-gradient(circle at 10% 90%, color-mix(in srgb, var(--secondary) 12%, transparent) 0%, transparent 45%),
          radial-gradient(circle at 90% 90%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 45%)
        `,
      }}
    >
      {/* Precision architectural grid overlay tinted with company primary color */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 transition-opacity"
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in srgb, var(--primary) 8%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in srgb, var(--primary) 8%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 60%, transparent 100%)',
        }}
      />

      {/* Ambient company-branded radial aura behind the card */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 sm:size-[520px] rounded-full blur-[140px] opacity-25 transition-all duration-700"
        style={{ backgroundColor: 'var(--primary)' }}
      />

      {/* Central Modern Minimalist Sign-In Card */}
      <div className="relative z-10 w-full max-w-[420px] my-auto py-8">
        <div className="relative rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-xl shadow-primary/5 p-6 sm:p-8">
          {/* Company dynamic hairline accent on card top */}
          <div
            className="absolute inset-x-6 top-0 h-0.5 rounded-t-full opacity-80"
            style={{
              background: `linear-gradient(90deg, transparent, var(--primary), transparent)`,
            }}
          />

          {/* Company Identity */}
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className="flex size-14 items-center justify-center rounded-2xl border mb-3 shadow-2xs transition-transform duration-200 hover:scale-105"
              style={{
                borderColor: `color-mix(in srgb, var(--primary) 25%, var(--border))`,
                backgroundColor: `color-mix(in srgb, var(--primary) 8%, transparent)`,
              }}
            >
              <TenantLogo className="h-7 w-auto object-contain" />
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Sign in to {name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Institutional lending portal & borrower self-service
            </p>
          </div>

          {/* Sign In Form */}
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="flex flex-col gap-4"
            noValidate
          >
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email address
              </Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="name@institution.com"
                  className="h-10 pl-9.5 text-xs transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <span role="alert" className="text-[11px] text-destructive block mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <span className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="h-10 pl-9.5 pr-10 text-xs transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <span role="alert" className="text-[11px] text-destructive block mt-1">
                  {errors.password.message}
                </span>
              )}
            </div>

            {mutation.error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {mutation.error.message}
              </div>
            )}

            <Button
              type="submit"
              size="default"
              className="h-10 w-full text-xs font-medium cursor-pointer shadow-sm active:scale-[0.99] transition-all mt-1"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Signing in…' : 'Sign in'}
            </Button>

            {/* Quick demo access, driven by the tenant's demo accounts */}
            {accounts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Demo Access
                  </span>
                  <span className="text-[10px] text-muted-foreground/80">Click to fill</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {accounts.map((account) => {
                    const isAdmin = account.role === 'lender_admin'
                    return (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => selectDemoAccount(account)}
                        className="group relative flex flex-col items-start p-2.5 rounded-lg border border-border/80 bg-background/60 hover:bg-muted/80 hover:border-primary/40 text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isAdmin ? 'Admin' : 'Borrower'}
                          </span>
                          <ArrowRightIcon className="size-3 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {isAdmin ? 'Lender Admin' : 'Borrower'}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate w-full mt-0.5">
                          {account.email}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Minimalist Trust & Infrastructure Footer */}
      <footer className="relative z-10 w-full max-w-4xl text-center py-4 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border/40">
        <div className="flex items-center gap-2 text-[11px]">
          <ShieldCheckIcon className="size-3.5 text-primary" />
          <span>Multi-tenant encrypted lending infrastructure</span>
        </div>
        <div className="text-[11px] text-muted-foreground/70 font-mono">
          {slug} · {name}
        </div>
      </footer>
    </main>
  )
}
