import { Wrench } from 'lucide-react'
import Logo from '../../components/common/Logo'

export default function Maintenance() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-app text-text-primary">
      <div className="mb-6"><Logo to={null} /></div>
      <div className="w-16 h-16 rounded-2xl bg-blue/10 text-blue flex items-center justify-center mb-5 animate-pulse-glow"><Wrench size={28} /></div>
      <h1 className="font-display font-bold text-3xl">Scheduled maintenance</h1>
      <p className="text-text-muted mt-2 max-w-sm">Interview IQ is currently undergoing scheduled maintenance. We'll be back shortly — thanks for your patience.</p>
    </div>
  )
}
