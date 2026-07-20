import { WifiOff } from 'lucide-react'
import Button from '../../components/common/Button'
import Logo from '../../components/common/Logo'

export default function Offline() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-app text-text-primary">
      <div className="mb-6"><Logo to={null} /></div>
      <div className="w-16 h-16 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mb-5"><WifiOff size={28} /></div>
      <h1 className="font-display font-bold text-3xl">You're offline</h1>
      <p className="text-text-muted mt-2 max-w-sm">Check your internet connection — we'll reconnect automatically once you're back online.</p>
      <Button className="mt-6" onClick={() => window.location.reload()}>Retry</Button>
    </div>
  )
}
