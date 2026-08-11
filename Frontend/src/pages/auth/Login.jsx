import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { loginSchema } from '../../utils/validators'
import Input from '../../components/common/Input'
import PasswordInput from '../../components/common/PasswordInput'
import Checkbox from '../../components/common/Checkbox'
import Button from '../../components/common/Button'
import { isAdmin } from '../../utils/permissions'

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
      const loggedInUser = await login(data)
      toast.success('Welcome back!')
      navigate(location.state?.from?.pathname || (isAdmin(loggedInUser) ? '/admin' : '/app/dashboard'), { replace: true })
    } catch (err) {
      const msg = err.code === 'INVALID_CREDENTIALS'
        ? 'Incorrect email or password.'
        : !err.status
          ? 'Cannot connect to the server. Please make sure the backend is running and try again.'
          : err.message || 'Something went wrong. Please try again.'
      setApiError(msg)
      toast.error(msg)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input type="email" placeholder="Email Address" className="!rounded-full !px-5" error={errors.email?.message} {...register('email')} />
        <PasswordInput placeholder="Password" className="!rounded-full" error={errors.password?.message} {...register('password')} />

        {apiError && <p className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2.5">{apiError}</p>}

        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" {...register('remember')} defaultChecked />
          <Link to="/forgot-password" className="text-xs font-medium text-blue hover:text-cyan transition-colors">Forgot password?</Link>
        </div>

        <Button type="submit" fullWidth loading={isSubmitting} className="!rounded-full !py-3">Login</Button>
      </form>

      <p className="text-sm text-text-secondary mt-6 text-center">
        Not a member? <Link to="/register" className="font-medium text-blue hover:text-cyan">Signup now</Link>
      </p>
    </div>
  )
}
