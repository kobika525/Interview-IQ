import { AlertTriangle } from 'lucide-react'
import Button from './Button'

export default function ErrorState({ title = 'Something went wrong', message = 'Please try again in a moment.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center text-error mb-4">
        <AlertTriangle size={24} />
      </div>
      <h3 className="font-display font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-muted mt-1.5 max-w-sm">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="outline" onClick={onRetry}>Try again</Button>
        </div>
      )}
    </div>
  )
}
