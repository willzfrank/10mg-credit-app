import { createContext } from 'react'
import type { TenantConfig } from './types'

export const TenantContext = createContext<TenantConfig | null>(null)
