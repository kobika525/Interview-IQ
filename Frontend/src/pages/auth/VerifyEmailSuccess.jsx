import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import Button from '../../components/common/Button'

export default function VerifyEmailSuccess() {
  const navigate = useNavigate()
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-5"
      >
        <CheckCircle2 size={30} />
      </motion.div>
      <h1 className="font-display font-bold text-2xl text-white">Email verified!</h1>
      <p className="text-sm text-text-muted mt-2">Your account is active. Let&apos;s set up your profile so we can personalise your prep.</p>
      <Button className="mt-6" fullWidth onClick={() => navigate('/onboarding')}>Continue to onboarding</Button>
    </div>
  )
}
