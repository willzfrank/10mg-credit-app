import type { Role } from './authStore'

export const homePathFor = (role: Role) => (role === 'lender_admin' ? '/admin' : '/portal')
