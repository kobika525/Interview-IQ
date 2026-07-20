import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'

export default function PaywallModal({ open, onClose, feature = 'this feature', planId = 'premium' }) {
  const navigate = useNavigate()
  return (
    <Modal
      open={open} onClose={onClose} title="Premium feature" size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Not now</Button>
          <Button onClick={() => navigate(`/app/checkout?plan=${planId}`)}>Upgrade now</Button>
        </>
      }
    >
      <div className="w-12 h-12 rounded-xl bg-blue/10 text-blue flex items-center justify-center mb-4"><Sparkles size={22} /></div>
      <p className="text-sm text-text-secondary">
        {feature} is available on the Premium plan. Upgrade to unlock it along with unlimited resume scans and full report history.
      </p>
    </Modal>
  )
}
