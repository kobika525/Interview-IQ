import { useEffect, useState } from 'react'
import { Users, FileText, Mic, TrendingUp, BookOpen, UserCheck } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import LineChartCard from '../../components/charts/LineChartCard'
import BarChartCard from '../../components/charts/BarChartCard'
import DonutChartCard from '../../components/charts/DonutChartCard'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as adminService from '../../services/adminService'
import { ADMIN_USERS, INTERVIEW_HISTORY } from '../../data/mockData'
import { formatDate, scoreTone } from '../../utils/formatters'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  useEffect(() => { adminService.getAdminStats().then(setStats) }, [])
  if (!stats) return <SkeletonLoader rows={5} />

  return (
    <div>
      <PageHeader title="Admin Overview" subtitle="Platform-wide activity and performance." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers.toLocaleString()} trend={12} tone="blue" />
        <StatCard icon={UserCheck} label="Active users" value={stats.activeUsers.toLocaleString()} trend={6} tone="cyan" />
        <StatCard icon={FileText} label="Total resumes" value={stats.totalResumes.toLocaleString()} trend={9} tone="blue" />
        <StatCard icon={Mic} label="Total interviews" value={stats.totalInterviews.toLocaleString()} trend={15} tone="coral" />
        <StatCard icon={TrendingUp} label="Avg interview score" value={stats.avgInterviewScore} tone="success" />
        <StatCard icon={BookOpen} label="Total resources" value={stats.totalResources} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2">
          <LineChartCard title="User growth" subtitle="Registered users by month" data={stats.userGrowth.map((d) => ({ label: d.month, overall: d.users }))} lines={['overall']} />
        </div>
        <DonutChartCard title="Interview mode usage" data={stats.modeUsage} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <BarChartCard title="Interview activity" subtitle="Sessions per day, this week" data={stats.interviewActivity} nameKey="day" dataKey="interviews" color="#1EA7FF" />
        <BarChartCard title="Popular job roles" subtitle="Interviews by target role" data={stats.popularRoles} nameKey="role" dataKey="count" color="#00D5FF" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="!p-0 overflow-hidden">
          <h3 className="font-display font-semibold text-text-primary text-sm p-5 pb-3">Recent users</h3>
          <div className="px-5 pb-5 space-y-1">
            {ADMIN_USERS.slice(0, 4).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0">
                <div><p className="text-sm text-text-primary">{u.name}</p><p className="text-xs text-text-muted">{formatDate(u.registeredAt)}</p></div>
                <Badge tone={u.status === 'Active' ? 'success' : u.status === 'Suspended' ? 'error' : 'neutral'}>{u.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="!p-0 overflow-hidden">
          <h3 className="font-display font-semibold text-text-primary text-sm p-5 pb-3">Recent interviews</h3>
          <div className="px-5 pb-5 space-y-1">
            {INTERVIEW_HISTORY.slice(0, 4).map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0">
                <div><p className="text-sm text-text-primary">{h.role}</p><p className="text-xs text-text-muted">{h.mode} · {formatDate(h.date)}</p></div>
                <Badge tone={scoreTone(h.score) === 'success' ? 'success' : 'warning'}>{h.score}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
