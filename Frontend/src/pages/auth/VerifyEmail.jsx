import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MailCheck } from 'lucide-react'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { delay } from '../../utils/helpers'

export default function VerifyEmail() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [seconds, setSeconds] = useState(30)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (seconds <= 0) return
    const t = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [seconds])

  async function resend() {
    setResending(true)
    await delay(900)
    setResending(false)
    setSeconds(30)
    toast.success('Verification email resent.')
  }

  async function simulateVerify() {
    await delay(600)
    navigate('/verify-email-success')
  }

  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue/10 text-blue flex items-center justify-center mx-auto mb-5"><MailCheck size={26} /></div>
      <h1 className="font-display font-bold text-2xl text-white">Verify your email</h1>
      <p className="text-sm text-text-muted mt-2">
        We sent a verification link to <span className="text-text-secondary">{user?.email || 'your email address'}</span>. Click the link to activate your account.
      </p>

      <Button className="mt-6" fullWidth onClick={simulateVerify}>I've verified my email (demo)</Button>

      <div className="mt-5 text-sm text-text-muted">
        Didn&apos;t get it?{' '}
        {seconds > 0 ? (
          <span className="text-text-disabled">Resend in {seconds}s</span>
        ) : (
          <button onClick={resend} disabled={resending} className="text-blue font-semibold hover:text-cyan disabled:opacity-50">
            {resending ? 'Sending...' : 'Resend email'}
          </button>
        )}
      </div>
      <button className="text-xs text-text-muted hover:text-white mt-4">Change email address</button>
    </div>
  )
}
