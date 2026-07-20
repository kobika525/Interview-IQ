import { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import DataTable from '../../components/common/DataTable'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import DonutChartCard from '../../components/charts/DonutChartCard'
import LineChartCard from '../../components/charts/LineChartCard'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import { Users, TrendingUp, XCircle, DollarSign } from 'lucide-react'
import * as adminService from '../../services/adminService'
import { ADMIN_USERS, PLANS } from '../../data/mockData'
import { formatDate } from '../../utils/formatters'

export default function AdminSubscriptions() {
  const [stats, setStats] = useState(null)
  useEffect(() => { adminService.getAdminStats().then(setStats) }, [])
  if (!stats) return <SkeletonLoader rows={4} />

  const planUsers = ADMIN_USERS.map((u, i) => ({ ...u, plan: ['free', 'premium', 'pro', 'free', 'premium'][i % 5] }))
  const distribution = PLANS.map((p) => ({ name: p.name, value: planUsers.filter((u) => u.plan === p.id).length || 1 }))

  const columns = [
    { key: 'name', header: 'User', render: (u) => <span className="text-text-primary font-medium">{u.name}</span> },
    { key: 'plan', header: 'Plan', render: (u) => <Badge tone={u.plan === 'pro' ? 'coral' : u.plan === 'premium' ? 'blue' : 'neutral'} className="capitalize">{u.plan}</Badge> },
    { key: 'registeredAt', header: 'Since', render: (u) => formatDate(u.registeredAt) },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.status === 'Active' ? 'success' : 'neutral'}>{u.status === 'Active' ? 'Active' : 'Cancelled'}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="Plan distribution and revenue overview across all users." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Active subscriptions" value="1,204" trend={9} tone="blue" />
        <StatCard icon={TrendingUp} label="New this month" value="86" trend={14} tone="cyan" />
        <StatCard icon={XCircle} label="Cancelled this month" value="12" trend={-3} tone="warning" />
        <StatCard icon={DollarSign} label="Monthly revenue (demo)" value="$10,836" trend={11} tone="success" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <LineChartCard title="Revenue trend (demo)" data={stats.userGrowth.map((d) => ({ label: d.month, overall: Math.round(d.users * 2.2) }))} lines={['overall']} />
        </div>
        <DonutChartCard title="Plan distribution" data={distribution} />
      </div>

      <h3 className="font-display font-semibold text-text-primary mb-3">User subscriptions</h3>
      <DataTable columns={columns} data={planUsers} renderMobileCard={(u) => (
        <Card><p className="text-sm text-text-primary">{u.name}</p><p className="text-xs text-text-muted mt-1 capitalize">{u.plan} plan</p></Card>
      )} />
    </div>
  )
}
