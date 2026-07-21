import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Drawer from '../common/Drawer'
import NotificationItem from '../common/NotificationItem'
import EmptyState from '../common/EmptyState'
import Button from '../common/Button'
import { Bell } from 'lucide-react'
import * as notificationService from '../../services/notificationService'

export default function NotificationDrawer({ open, onClose }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    if (open) notificationService.getNotifications().then(setItems)
  }, [open])

  async function markRead(id) {
    setItems(await notificationService.markAsRead(id))
  }
  async function markAll() {
    setItems(await notificationService.markAllAsRead())
  }

  return (
    <Drawer open={open} onClose={onClose} title="Notifications">
      {items.length > 0 && (
        <div className="flex justify-end mb-2">
          <Button variant="ghost" onClick={markAll} className="!text-xs !py-1.5">Mark all as read</Button>
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" message="You're all caught up." />
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 6).map((n) => <NotificationItem key={n.id} notification={n} onRead={markRead} />)}
        </div>
      )}
      <div className="mt-4">
        <Link to="/app/notifications" onClick={onClose}>
          <Button variant="outline" fullWidth>View all notifications</Button>
        </Link>
      </div>
    </Drawer>
  )
}
