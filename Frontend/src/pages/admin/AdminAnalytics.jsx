import { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import LineChartCard from '../../components/charts/LineChartCard'
import BarChartCard from '../../components/charts/BarChartCard'
import DonutChartCard from '../../components/charts/DonutChartCard'
import Select from '../../components/common/Select'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as adminService from '../../services/adminService'

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null)
  const [range, setRange] = useState('Last 6 months')
  useEffect(() => { adminService.getAdminStats().then(setStats) }, [])
  if (!stats) return <SkeletonLoader rows={5} />

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Platform-wide usage and engagement trends."
        actions={<Select options={['Last 7 days', 'Last 30 days', 'Last 6 months', 'Last 12 months']} value={range} onChange={(e) => setRange(e.target.value)} containerClassName="w-48" />}
      />

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <LineChartCard title="User growth" data={stats.userGrowth.map((d) => ({ label: d.month, overall: d.users }))} lines={['overall']} />
        <DonutChartCard title="Interview mode usage" data={stats.modeUsage} />
      </div>
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <BarChartCard title="Role popularity" data={stats.popularRoles} nameKey="role" dataKey="count" color="#1EA7FF" />
        <BarChartCard title="Weekly interview activity" data={stats.interviewActivity} nameKey="day" dataKey="interviews" color="#00D5FF" />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <BarChartCard title="Resume analysis volume" data={stats.userGrowth.map((d) => ({ name: d.month, value: Math.round(d.users * 0.6) }))} color="#FF4964" />
        <BarChartCard title="Resource engagement" data={[{ name: 'Courses', value: 420 }, { name: 'Articles', value: 260 }, { name: 'Videos', value: 310 }, { name: 'Exercises', value: 180 }]} color="#F59E0B" />
      </div>
    </div>
  )
}
