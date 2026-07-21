import { FREE_RESUME_SCAN_LIMIT } from './constants'
export const isAdmin = (user) => user?.role === 'admin'
export const isPremium = (user) => ['premium', 'pro'].includes(user?.plan)
export const canUseVideoInterview = isPremium
export const canScanAnotherResume = (user) => isPremium(user) || (user?.usage?.resumeScansThisMonth ?? 0) < FREE_RESUME_SCAN_LIMIT
