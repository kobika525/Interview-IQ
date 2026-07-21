import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import Button from '../common/Button'

export default function UpgradeBanner({ title = 'Upgrade to unlock this feature', message, to = '/pricing' }) {
  return (
    <div className="rounded-2xl border border-blue/25 bg-gradient-to-br from-blue/10 to-cyan/5 p-5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue/15 text-blue flex items-center justify-center shrink-0"><Sparkles size={18} /></div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          {message && <p className="text-xs text-text-muted mt-1 max-w-md">{message}</p>}
        </div>
      </div>
      <Link to={to}><Button className="!text-xs !py-2">View plans</Button></Link>
    </div>
  )
}
