import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Tabs from '../../components/common/Tabs'
import NotificationItem from '../../components/common/NotificationItem'
import EmptyState from '../../components/common/EmptyState'
import Button from '../../components/common/Button'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as notificationService from '../../services/notificationService'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  useEffect(() => { notificationService.getNotifications().then((d) => { setItems(d); setLoading(false) }) }, [])

  const filtered = items.filter((n) => tab === 'all' || (tab === 'unread' ? !n.read : n.read))

  async function markRead(id) { setItems(await notificationService.markAsRead(id)) }
  async function markAll() { setItems(await notificationService.markAllAsRead()) }
  async function remove(id) { setItems(await notificationService.deleteNotification(id)) }

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Stay on top of interview reminders and recommendations." actions={<Button variant="outline" onClick={markAll}>Mark all as read</Button>} />
      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-5" />

      {loading ? <SkeletonLoader rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon={Bell} title="Nothing here" message="You're all caught up." />
      ) : (
        <div className="space-y-2 max-w-2xl">
          {filtered.map((n) => <NotificationItem key={n.id} notification={n} onRead={markRead} onDelete={remove} />)}
        </div>
      )}
    </div>
  )
}
