import { Inbox } from 'lucide-react'
import Button from './Button'

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl bg-black/[0.045] flex items-center justify-center text-text-muted mb-4">
        <Icon size={24} />
      </div>
      <h3 className="font-display font-semibold text-text-primary">{title}</h3>
      {message && <p className="text-sm text-text-muted mt-1.5 max-w-sm">{message}</p>}
      {action && (
        <div className="mt-5">
          <Button variant="outline" onClick={action}>{actionLabel}</Button>
        </div>
      )}
    </div>
  )
}
