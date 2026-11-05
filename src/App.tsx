import { Navigate, Route, Routes } from 'react-router'
import { DashboardPage } from './app/features/dashboard/DashboardPage'
import { LoginPage } from './app/features/auth/LoginPage'
import { ApplyPage } from './app/features/portal/ApplyPage'
import { LoanDetailsPage } from './app/features/portal/LoanDetailsPage'
import { MyLoansPage } from './app/features/portal/MyLoansPage'
import { AppShell } from './app/features/shell/AppShell'
import { TenantConfigPage } from './app/features/tenant/TenantConfigPage'
import { useTenant } from './app/features/tenant/useTenant'
import { useSession } from './app/shared/auth/authStore'
import { homePathFor } from './app/shared/auth/homePath'
import { RequireRole } from './app/shared/auth/RequireRole'

function HomeRedirect() {
  const session = useSession(useTenant().slug)
  return <Navigate to={session ? homePathFor(session.user.role) : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireRole roles={['lender_admin']}>
            <AppShell
              nav={[
                { to: '/admin', label: 'Dashboard' },
                { to: '/admin/settings', label: 'Settings' },
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
                { to: '/portal', label: 'My loans' },
                { to: '/portal/apply', label: 'Apply' },
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
  )
}
