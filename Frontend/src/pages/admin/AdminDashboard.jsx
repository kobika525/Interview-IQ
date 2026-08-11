import { useEffect, useState } from 'react'
import { Users, FileText, Mic, TrendingUp, BookOpen, UserCheck } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import DonutChartCard from '../../components/charts/DonutChartCard'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as adminService from '../../services/adminService'
import { formatDate, scoreTone } from '../../utils/formatters'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])

  useEffect(() => {
    Promise.all([adminService.getAdminStats(), adminService.getAdminUsers(), adminService.getAdminInterviewReports()])
      .then(([summary, userItems, reportItems]) => {
        setStats(summary)
        setUsers(userItems)
        setReports(reportItems)
      })
  }, [])

  if (!stats) return <SkeletonLoader rows={5} />

  return (
    <div>
      <PageHeader title="Admin Overview" subtitle="Platform-wide activity and performance." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} tone="blue" />
        <StatCard icon={UserCheck} label="Active users" value={stats.activeUsers} tone="cyan" />
        <StatCard icon={FileText} label="Total resumes" value={stats.totalResumes} tone="blue" />
        <StatCard icon={Mic} label="Completed interviews" value={stats.totalInterviews} tone="coral" />
        <StatCard icon={TrendingUp} label="Avg interview score" value={stats.avgInterviewScore} tone="success" />
        <StatCard icon={BookOpen} label="Active subscriptions" value={stats.activeSubscriptions} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Card className="lg:col-span-2">
          <h3 className="font-display font-semibold text-text-primary text-sm mb-3">Popular job roles</h3>
          {stats.popularRoles.length ? stats.popularRoles.map((role) => (
            <div key={role.role} className="flex justify-between py-2 border-b border-border-subtle">
              <span className="text-sm text-text-secondary">{role.role}</span>
              <Badge tone="blue">{role.count}</Badge>
            </div>
          )) : <p className="text-sm text-text-muted">No completed role activity yet.</p>}
        </Card>
        <DonutChartCard title="Interview mode usage" data={stats.modeUsage} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="font-display font-semibold text-text-primary text-sm mb-3">Recent users</h3>
          {users.slice(0, 4).map((user) => (
            <div key={user.id} className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0">
              <div><p className="text-sm text-text-primary">{user.fullName}</p><p className="text-xs text-text-muted">{formatDate(user.createdAt)}</p></div>
              <Badge tone={user.accountStatus === 'ACTIVE' ? 'success' : 'warning'}>{user.accountStatus}</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="font-display font-semibold text-text-primary text-sm mb-3">Recent interview reports</h3>
          {reports.slice(0, 4).map((report) => (
            <div key={report.id} className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0">
              <div><p className="text-sm text-text-primary">Session #{report.sessionId}</p><p className="text-xs text-text-muted">{formatDate(report.createdAt)}</p></div>
              <Badge tone={scoreTone(report.overallScore) === 'success' ? 'success' : 'warning'}>{report.overallScore}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
