import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Mail, User as UserIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { registerSchema } from '../../utils/validators'
import { JOB_ROLES, STUDY_LEVELS } from '../../utils/constants'
import Input from '../../components/common/Input'
import PasswordInput from '../../components/common/PasswordInput'
import PasswordStrengthMeter from '../../components/auth/PasswordStrengthMeter'
import Select from '../../components/common/Select'
import MultiSelect from '../../components/common/MultiSelect'
import Checkbox from '../../components/common/Checkbox'
import Button from '../../components/common/Button'

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '', email: '', password: '', confirmPassword: '',
      degree: '', institute: '', studyLevel: '', targetCareer: '', terms: false,
    },
  })
  const [skills, setSkills] = useState([])
  const password = watch('password')

  async function onSubmit(data) {
    setApiError('')
    try {
      await registerUser({ ...data, fullName: data.fullName, skills })
      toast.success('Account created — welcome to Interview IQ!')
      navigate('/app/dashboard', { replace: true })
    } catch (error) {
      const detail = error.details?.[0]?.msg?.replace(/^Value error,\s*/i, '')
      const message = detail || error.message || 'Registration failed. Please try again.'
      setApiError(message)
      toast.error(message)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full name" icon={UserIcon} placeholder="Your name" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Email address" icon={Mail} type="email" placeholder="you@email.com" error={errors.email?.message} {...register('email')} />
        </div>
        <Select label="Current study level" options={STUDY_LEVELS} error={errors.studyLevel?.message} {...register('studyLevel')} />
        <div className="grid sm:grid-cols-2 gap-4">
          <PasswordInput label="Password" error={errors.password?.message} {...register('password')} />
          <PasswordInput label="Confirm password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        </div>
        <PasswordStrengthMeter password={password} />

        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Degree" placeholder="BSc Computer Science" error={errors.degree?.message} {...register('degree')} />
          <Input label="University / institute" placeholder="University of Colombo" error={errors.institute?.message} {...register('institute')} />
        </div>
        <Select label="Target career" options={JOB_ROLES} error={errors.targetCareer?.message} {...register('targetCareer')} />
        <MultiSelect label="Existing skills" value={skills} onChange={setSkills} />

        {apiError && <p className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2.5">{apiError}</p>}

        <Controller
          name="terms" control={control}
          render={({ field }) => (
            <Checkbox label="I agree to the Terms and Conditions and Privacy Policy" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} error={errors.terms?.message} />
          )}
        />

        <Button type="submit" fullWidth loading={isSubmitting} className="!rounded-full !py-3">Create account</Button>
      </form>

      <p className="text-sm text-text-secondary mt-6 text-center">
        Already have an account? <Link to="/login" className="font-medium text-blue hover:text-cyan">Log in</Link>
      </p>
    </div>
  )
}
