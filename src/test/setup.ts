import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { resetDb } from '../app/mocks/db'
import { useAuthStore } from '../app/shared/auth/authStore'
import { queryClient } from '../app/shared/queryClient'

beforeEach(() => {
  sessionStorage.clear()
  resetDb()
  useAuthStore.setState({ sessions: new Map() })
  queryClient.clear()
})

afterEach(cleanup)
