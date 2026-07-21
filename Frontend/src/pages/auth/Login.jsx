import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Mail } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { loginSchema } from '../../utils/validators'
import Input from '../../components/common/Input'
import PasswordInput from '../../components/common/PasswordInput'
import Checkbox from '../../components/common/Checkbox'
import Button from '../../components/common/Button'
import SocialButtons from '../../components/auth/SocialButtons'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  })

  async function onSubmit(data) {
    setApiError('')
    try {
      await login(data)
      toast.success('Welcome back!')
      navigate(location.state?.from?.pathname || '/app/dashboard', { replace: true })
    } catch (err) {
      const msg = err.code === 'INVALID_CREDENTIALS' ? 'Incorrect email or password.' : 'Something went wrong. Please try again.'
      setApiError(msg)
      toast.error(msg)
    }
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">Welcome back</h1>
      <p className="text-sm text-text-muted mt-2">Log in to continue your interview prep.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <Input label="Email address" icon={Mail} type="email" placeholder="you@email.com" error={errors.email?.message} {...register('email')} />
        <PasswordInput label="Password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />

        {apiError && <p className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2.5">{apiError}</p>}

        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" {...register('remember')} defaultChecked />
          <Link to="/forgot-password" className="text-xs font-semibold text-blue hover:text-cyan transition-colors">Forgot password?</Link>
        </div>

        <Button type="submit" fullWidth loading={isSubmitting}>Log in</Button>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-border-subtle" /><span className="text-xs text-text-disabled">or continue with</span><span className="h-px flex-1 bg-border-subtle" />
        </div>
        <SocialButtons />
      </form>

      <p className="text-sm text-text-muted mt-7 text-center">
        Don&apos;t have an account? <Link to="/register" className="text-blue font-semibold hover:text-cyan">Create one</Link>
      </p>
      <p className="text-[11px] text-text-disabled mt-4 text-center">Demo tip: any email + a 6+ character password logs you in. Use admin@interviewiq.app for the admin console.</p>
    </div>
  )
}
