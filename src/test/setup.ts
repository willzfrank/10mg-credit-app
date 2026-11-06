import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { resetDb } from '../app/mocks/db'
import { useAuthStore } from '../app/shared/auth/authStore'
import { queryClient } from '../app/shared/queryClient'

if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }) as MediaQueryList
}

beforeEach(() => {
  sessionStorage.clear()
  resetDb()
  useAuthStore.setState({ sessions: new Map() })
  queryClient.clear()
})

afterEach(cleanup)
