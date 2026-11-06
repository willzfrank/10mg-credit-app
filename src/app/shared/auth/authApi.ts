import { authenticateCredentials, revokeToken } from '../../mocks/db'
import { delay } from '../../mocks/delay'
import { queryClient } from '../queryClient'
import { getSession, useAuthStore, type Session } from './authStore'

interface Credentials {
  email: string
  password: string
}

export async function login(slug: string, credentials: Credentials): Promise<Session> {
  await delay()
  const session = authenticateCredentials(slug, {
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  })
  useAuthStore.getState().setSession(slug, session)
  return session
}

export async function logout(slug: string): Promise<void> {
  const token = getSession(slug)?.accessToken
  await delay()
  if (token) revokeToken(token)
  useAuthStore.getState().clearSession(slug)
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'tenant' })
}
