import { useMutation } from '@tanstack/react-query'
import { NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { logout } from '../../shared/auth/authApi'
import { TenantLogo } from '../tenant/TenantLogo'
import { useTenant } from '../tenant/useTenant'

export interface NavItem {
  to: string
  label: string
}

export function AppShell({ nav }: { nav: NavItem[] }) {
  const { slug, name } = useTenant()
  const signOut = useMutation({ mutationFn: () => logout(slug) })

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-4 border-b px-6 py-3">
        <TenantLogo className="h-8 w-auto" />
        <span className="font-semibold">{name}</span>
        <nav aria-label="Main" className="ml-6 flex gap-4 text-sm">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => (isActive ? 'font-medium underline underline-offset-4' : 'opacity-70')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="outline" className="ml-auto" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
          Sign out
        </Button>
      </header>
      <main className="mx-auto max-w-3xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
