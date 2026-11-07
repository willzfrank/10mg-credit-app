import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Toaster } from './components/ui/toaster'
import { AppShell } from './app/features/shell/AppShell'
import { useTenant } from './app/features/tenant/useTenant'
import { LoadingScreen } from './app/shared/LoadingScreen'
import { useSession } from './app/shared/auth/authStore'
import { homePathFor } from './app/shared/auth/homePath'
import { RequireRole } from './app/shared/auth/RequireRole'

const LoginPage = lazy(() => import('./app/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('./app/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const TenantConfigPage = lazy(() => import('./app/features/tenant/TenantConfigPage').then((m) => ({ default: m.TenantConfigPage })))
const MyLoansPage = lazy(() => import('./app/features/portal/MyLoansPage').then((m) => ({ default: m.MyLoansPage })))
const ApplyPage = lazy(() => import('./app/features/portal/ApplyPage').then((m) => ({ default: m.ApplyPage })))
const LoanDetailsPage = lazy(() => import('./app/features/portal/LoanDetailsPage').then((m) => ({ default: m.LoanDetailsPage })))

function HomeRedirect() {
  const session = useSession(useTenant().slug)
  return <Navigate to={session ? homePathFor(session.user.role) : '/login'} replace />
}

export default function App() {
  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <RequireRole roles={['lender_admin']}>
                <AppShell
                  nav={[
                    { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
                    { to: '/admin/settings', label: 'Settings', icon: 'settings' },
                  ]}
                />
              </RequireRole>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="settings" element={<TenantConfigPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route
            path="/portal"
            element={
              <RequireRole roles={['customer']}>
                <AppShell
                  nav={[
                    { to: '/portal', label: 'My loans', icon: 'loans' },
                    { to: '/portal/apply', label: 'Apply', icon: 'apply' },
                  ]}
                />
              </RequireRole>
            }
          >
            <Route index element={<MyLoansPage />} />
            <Route path="apply" element={<ApplyPage />} />
            <Route path="loans/:id" element={<LoanDetailsPage />} />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  )
}
