import { useEffect, useState } from 'react'
import { Mic, TrendingUp, Award, FileText, Flame, BookOpen } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import LineChartCard from '../../components/charts/LineChartCard'
import BarChartCard from '../../components/charts/BarChartCard'
import DonutChartCard from '../../components/charts/DonutChartCard'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as progressService from '../../services/progressService'
import { RESUME_ANALYSES, ADMIN_STATS } from '../../data/mockData'

const TOPIC_PERFORMANCE = [
  { name: 'React', value: 82 }, { name: 'System Design', value: 58 }, { name: 'SQL', value: 76 },
  { name: 'Behavioral', value: 88 }, { name: 'JavaScript', value: 80 },
]
const MONTHLY_ACTIVITY = [
  { name: 'Mar', value: 4 }, { name: 'Apr', value: 6 }, { name: 'May', value: 5 }, { name: 'Jun', value: 8 }, { name: 'Jul', value: 9 },
]

export default function Progress() {
  const [data, setData] = useState(null)

  useEffect(() => { progressService.getProgressOverview().then(setData) }, [])

  if (!data) return <SkeletonLoader rows={5} />

  const resumeDelta = RESUME_ANALYSES[0].atsScore - RESUME_ANALYSES[RESUME_ANALYSES.length - 1].atsScore

  return (
    <div>
      <PageHeader title="Progress Tracking" subtitle="Your growth across every dimension we measure." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Mic} label="Total interviews" value={data.totalInterviews} tone="blue" />
        <StatCard icon={TrendingUp} label="Average score" value={data.avgScore} tone="cyan" progress={data.avgScore} />
        <StatCard icon={Award} label="Highest score" value={data.highestScore} tone="success" />
        <StatCard icon={Flame} label="Current streak" value={data.streak} suffix="days" tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2">
          <LineChartCard title="Interview score trend" subtitle="Overall, technical & communication" data={data.trend} lines={['overall', 'technical', 'communication']} />
        </div>
        <DonutChartCard title="Interview mode comparison" data={ADMIN_STATS.modeUsage} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <BarChartCard title="Topic performance" subtitle="Average score by topic" data={TOPIC_PERFORMANCE} color="#00D5FF" />
        <BarChartCard title="Monthly activity" subtitle="Interviews completed per month" data={MONTHLY_ACTIVITY} color="#1EA7FF" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <p className="field-label mb-3">Resume ATS improvement</p>
          <div className="flex items-center gap-3">
            <FileText size={22} className="text-blue" />
            <div><p className="font-display font-bold text-2xl text-text-primary">+{resumeDelta}</p><p className="text-xs text-text-muted">points since your first scan</p></div>
          </div>
        </Card>
        <Card>
          <p className="field-label mb-3">Skill growth</p>
          <div className="flex items-center gap-3">
            <TrendingUp size={22} className="text-cyan" />
            <div><p className="font-display font-bold text-2xl text-text-primary">{data.skillGrowth}%</p><p className="text-xs text-text-muted">increase in matched skills</p></div>
          </div>
        </Card>
        <Card>
          <p className="field-label mb-3">Learning modules completed</p>
          <div className="flex items-center gap-3">
            <BookOpen size={22} className="text-blue" />
            <div><p className="font-display font-bold text-2xl text-text-primary">{data.completedModules}</p><p className="text-xs text-text-muted">out of 14 total modules</p></div>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <p className="field-label mb-3">Recommended next action</p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-text-secondary">Your system design score is your biggest opportunity — practice a technical video interview focused on that topic.</p>
          <Badge tone="blue">Start interview</Badge>
        </div>
      </Card>
    </div>
  )
}
