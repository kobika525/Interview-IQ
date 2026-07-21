import { z } from 'zod'

const email = z.string().trim().email('Enter a valid email address')
const password = z.string().min(8, 'Password must contain at least 8 characters')
export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') })
export const forgotPasswordSchema = z.object({ email })
export const resetPasswordSchema = z.object({ password, confirmPassword: z.string() }).refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'), email,
  phone: z.string().trim().min(7, 'Enter a valid phone number'), password,
  confirmPassword: z.string(), degree: z.string().trim().min(1, 'Degree is required'),
  institute: z.string().trim().min(1, 'Institute is required'), studyLevel: z.string().min(1, 'Select your study level'),
  targetCareer: z.string().min(1, 'Select a target career'), terms: z.literal(true, { error: 'You must accept the terms' }),
}).refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
export function passwordStrength(value = '') {
  const checks = [value.length >= 8, /[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)]
  const score = checks.filter(Boolean).length
  return { score, label: ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][score] }
}
