export type FrontendSessionUser = {
  email: string
  role: string | null
}

export type FrontendSessionResponse = {
  user: FrontendSessionUser | null
}

export const isFrontendSessionResponse = (value: unknown): value is FrontendSessionResponse => {
  if (!value || typeof value !== 'object' || !('user' in value)) return false
  const user = value.user
  if (user === null) return true
  if (!user || typeof user !== 'object') return false

  return (
    'email' in user &&
    typeof user.email === 'string' &&
    'role' in user &&
    (typeof user.role === 'string' || user.role === null)
  )
}

export const formatCMSRoleLabel = (role?: string | null): string => {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'siteManager':
      return 'Site Manager'
    default:
      return 'CMS User'
  }
}
