import { TrendingUp, TrendingDown } from 'lucide-react'
import Card from './Card'
import ProgressBar from './ProgressBar'

const TONE_CHIP = {
  blue: 'bg-blue/10 text-blue',
  cyan: 'bg-cyan/10 text-cyan',
  coral: 'bg-coral/10 text-coral',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
}

export default function StatCard({ icon: Icon, label, value, suffix, trend, progress, tone = 'blue', tooltip }) {
  const positive = trend >= 0
  return (
    <Card hover className="relative group">
      <div className="flex items-start justify-between">
        <div className={`icon-chip w-10 h-10 rounded-xl flex items-center justify-center ${TONE_CHIP[tone]}`}>
          <Icon size={19} />
        </div>
        {typeof trend === 'number' && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-success' : 'text-error'}`}>
            {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4 font-display font-bold text-3xl text-text-primary">
        {value}{suffix && <span className="text-sm text-text-muted ml-1">{suffix}</span>}
      </div>
      <div className="text-xs text-text-muted mt-1">{label}</div>
      {typeof progress === 'number' && <ProgressBar value={progress} className="mt-3" />}
      {tooltip && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-card-elevated border border-border text-[11px] text-text-secondary rounded-lg px-2.5 py-1.5 whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </Card>
  )
}
