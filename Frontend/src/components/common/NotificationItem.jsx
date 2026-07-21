import { Calendar, FileText, Sparkles, TrendingUp, Bell, Trash2 } from 'lucide-react'

const ICONS = { interview: Calendar, resume: FileText, resource: Sparkles, progress: TrendingUp, system: Bell }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return 'Just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationItem({ notification, onRead, onDelete }) {
  const Icon = ICONS[notification.type] || Bell
  return (
    <div
      onClick={() => !notification.read && onRead?.(notification.id)}
      className={`flex gap-3 p-3.5 rounded-xl cursor-pointer transition-colors ${notification.read ? 'hover:bg-black/[0.035]' : 'bg-blue/5 hover:bg-blue/10'}`}
    >
      <div className="w-9 h-9 rounded-lg bg-black/[0.045] text-blue flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-text-primary truncate">{notification.title}</p>
          {!notification.read && <span className="w-1.5 h-1.5 rounded-full bg-blue shrink-0" />}
        </div>
        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-[11px] text-text-disabled mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
      {onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }} className="text-text-muted hover:text-error transition-colors self-start">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
