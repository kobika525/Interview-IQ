import { useEffect, useState } from 'react'
import { Users, TrendingUp } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import DataTable from '../../components/common/DataTable'
import Badge from '../../components/common/Badge'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as adminService from '../../services/adminService'

export default function AdminSubscriptions() {
  const [stats, setStats] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [plans, setPlans] = useState([])

  useEffect(() => {
    Promise.all([adminService.getAdminStats(), adminService.getAdminSubscriptions(), adminService.getAdminPlans()])
      .then(([summary, subscriptionItems, planItems]) => {
        setStats(summary)
        setSubscriptions(subscriptionItems)
        setPlans(planItems)
      })
  }, [])

  if (!stats) return <SkeletonLoader rows={4} />
  const planNames = Object.fromEntries(plans.map((plan) => [plan.id, plan.name]))
  const columns = [
    { key: 'userId', header: 'User', render: (item) => `User #${item.userId}` },
    { key: 'planId', header: 'Plan', render: (item) => planNames[item.planId] || `Plan #${item.planId}` },
    { key: 'billingCycle', header: 'Billing cycle' },
    { key: 'status', header: 'Status', render: (item) => <Badge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'}>{item.status}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="Live plan distribution across all users." />
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <StatCard icon={Users} label="Active subscriptions" value={stats.activeSubscriptions} tone="blue" />
        <StatCard icon={TrendingUp} label="Available plans" value={plans.length} tone="cyan" />
      </div>
      <DataTable columns={columns} data={subscriptions} />
    </div>
  )
}
