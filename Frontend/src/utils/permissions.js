export const ROLES = { USER: 'user', ADMIN: 'admin' }

export function isAdmin(user) {
  return Boolean(user?.is_admin || user?.isAdmin || user?.role?.toLowerCase() === ROLES.ADMIN)
}

export function isAuthenticated(user) {
  return Boolean(user)
}

export function isPremium(user) {
  return user?.plan === 'basic' || user?.plan === 'premium' || user?.plan === 'pro'
}

export function canUseVideoInterview(user) {
  if (isPremium(user)) return true
  const used = user?.usage?.videoInterviewsUsed ?? user?.usage?.videoInterviewsThisMonth ?? 0
  return used < 2
}

export function canScanAnotherResume(user) {
  if (isPremium(user)) return true
  const used = user?.usage?.resumeScansThisMonth ?? 0
  return used < 3
}
