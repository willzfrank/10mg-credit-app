import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TenantProvider } from './app/features/tenant/TenantProvider'
import { queryClient } from './app/shared/queryClient'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <App />
      </TenantProvider>
    </QueryClientProvider>
  </StrictMode>,
)
