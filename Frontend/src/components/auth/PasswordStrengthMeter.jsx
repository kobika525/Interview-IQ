import { passwordStrength } from '../../utils/validators'

const LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS = ['bg-error', 'bg-error', 'bg-warning', 'bg-blue', 'bg-success']

export default function PasswordStrengthMeter({ password }) {
  const score = passwordStrength(password)
  if (!password) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i < score ? COLORS[score] : 'bg-black/[0.08]'}`} />
        ))}
      </div>
      <p className="text-[11px] text-text-muted mt-1">{LABELS[score]}</p>
    </div>
  )
}
