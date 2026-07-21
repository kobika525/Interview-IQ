export const ROLES = { USER: 'user', ADMIN: 'admin' }

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN
}

export function isAuthenticated(user) {
  return Boolean(user)
}

export function isPremium(user) {
  return user?.plan === 'premium' || user?.plan === 'pro'
}

export function canUseVideoInterview(user) {
  return isPremium(user)
}

export function canScanAnotherResume(user) {
  if (isPremium(user)) return true
  const used = user?.usage?.resumeScansThisMonth ?? 0
  return used < 3
}
