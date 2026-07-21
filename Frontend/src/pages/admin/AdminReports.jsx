import PageHeader from '../../components/common/PageHeader'
import LineChartCard from '../../components/charts/LineChartCard'
import BarChartCard from '../../components/charts/BarChartCard'
import { PROGRESS_TREND, ADMIN_STATS } from '../../data/mockData'

export default function AdminReports() {
  return (
    <div>
      <PageHeader title="Platform Reports" subtitle="Aggregate performance and engagement metrics." />
      <div className="grid lg:grid-cols-2 gap-5">
        <LineChartCard title="Average score trend" data={PROGRESS_TREND} lines={['overall']} />
        <BarChartCard title="Popular job roles" data={ADMIN_STATS.popularRoles} nameKey="role" dataKey="count" color="#1EA7FF" />
      </div>
    </div>
  )
}
