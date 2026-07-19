import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import * as authService from '../../services/authService'
import { resetPasswordSchema } from '../../utils/validators'
import PasswordInput from '../../components/common/PasswordInput'
import PasswordStrengthMeter from '../../components/auth/PasswordStrengthMeter'
import Button from '../../components/common/Button'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  })
  const password = watch('password')

  async function onSubmit(data) {
    await authService.resetPassword(data)
    setSuccess(true)
    toast.success('Password reset successfully.')
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-5"><CheckCircle2 size={26} /></div>
        <h1 className="font-display font-bold text-2xl text-white">Password reset</h1>
        <p className="text-sm text-text-muted mt-2">Your password has been updated successfully.</p>
        <Button className="mt-6" onClick={() => navigate('/login')}>Back to login</Button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Set a new password</h1>
      <p className="text-sm text-text-muted mt-2">Choose a strong password you haven&apos;t used before.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <PasswordInput label="New password" error={errors.password?.message} {...register('password')} />
        <PasswordStrengthMeter password={password} />
        <PasswordInput label="Confirm new password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" fullWidth loading={isSubmitting}>Reset password</Button>
      </form>
      <p className="text-sm text-text-muted mt-7 text-center">
        Remembered it? <Link to="/login" className="text-blue font-semibold hover:text-cyan">Log in</Link>
      </p>
    </div>
  )
}
