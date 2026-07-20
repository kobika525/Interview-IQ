import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react'
import * as authService from '../../services/authService'
import { forgotPasswordSchema } from '../../utils/validators'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data) {
    await authService.forgotPassword(data)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-5"><CheckCircle2 size={26} /></div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Check your email</h1>
        <p className="text-sm text-text-muted mt-2">We sent a password reset link to <span className="text-text-secondary">{getValues('email')}</span>.</p>
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue mt-6 hover:text-cyan"><ArrowLeft size={14} />Back to login</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">Forgot your password?</h1>
      <p className="text-sm text-text-muted mt-2">Enter your email and we&apos;ll send you a reset link.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <Input label="Email address" icon={Mail} type="email" placeholder="you@email.com" error={errors.email?.message} {...register('email')} />
        <Button type="submit" fullWidth loading={isSubmitting}>Send reset link</Button>
      </form>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue mt-6 hover:text-cyan"><ArrowLeft size={14} />Back to login</Link>
    </div>
  )
}
