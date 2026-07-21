import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Mic, Compass, BookOpen, Award, Flame, Target, TrendingUp, CheckCircle2, Circle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import ProgressBar from '../../components/common/ProgressBar'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import LineChartCard from '../../components/charts/LineChartCard'
import RadarChartCard from '../../components/charts/RadarChartCard'
import { useAuth } from '../../hooks/useAuth'
import * as progressService from '../../services/progressService'
import * as interviewService from '../../services/interviewService'
import { RESUME_ANALYSES, SKILL_GAP_RESULT, LEARNING_RESOURCES } from '../../data/mockData'
import { CAREERS } from '../../data/careerData'
import { formatDate, scoreTone } from '../../utils/formatters'

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Upload Resume', to: '/app/resume-analyzer', tone: 'blue' },
  { icon: Mic, label: 'Start Mock Interview', to: '/app/interviews/setup', tone: 'coral' },
  { icon: Compass, label: 'View Career Matches', to: '/app/career-guidance', tone: 'cyan' },
  { icon: BookOpen, label: 'Continue Learning', to: '/app/learning-roadmap', tone: 'blue' },
]

const CHECKLIST = [
  { label: 'Upload your resume', done: true },
  { label: 'Complete a skill gap analysis', done: true },
  { label: 'Finish your first mock interview', done: true },
  { label: 'Review your interview report', done: false },
  { label: 'Complete one learning module this week', done: false },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [progress, setProgress] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([progressService.getProgressOverview(), interviewService.getInterviewHistory()]).then(([p, h]) => {
      setProgress(p)
      setHistory(h)
      setLoading(false)
    })
  }, [])

  const latestResume = RESUME_ANALYSES[0]
  const topCareer = CAREERS[0]

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(' ')[0] || 'there'}`}
        subtitle="Continue improving your interview skills and career readiness."
        actions={<Link to="/app/interviews/setup"><Button icon={Mic}>Start Mock Interview</Button></Link>}
      />

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.label} to={a.to}>
            <Card hover className="flex flex-col items-center text-center gap-2 !p-4">
              <div className="w-10 h-10 rounded-xl bg-blue/10 text-blue flex items-center justify-center"><a.icon size={18} /></div>
              <span className="text-xs font-medium text-text-secondary">{a.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {loading ? (
        <SkeletonLoader rows={4} />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard icon={FileText} label="Latest ATS Score" value={latestResume.atsScore} trend={8} tone="blue" tooltip="From your most recent resume scan" />
            <StatCard icon={TrendingUp} label="Avg Interview Score" value={progress.avgScore} trend={6} tone="cyan" progress={progress.avgScore} />
            <StatCard icon={Mic} label="Completed Interviews" value={progress.totalInterviews} tone="coral" />
            <StatCard icon={Target} label="Career Readiness" value={SKILL_GAP_RESULT.readiness} suffix="%" tone="blue" progress={SKILL_GAP_RESULT.readiness} />
            <StatCard icon={Flame} label="Learning Streak" value={progress.streak} suffix="days" tone="warning" />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-5 mb-6">
            <div className="lg:col-span-2">
              <LineChartCard title="Interview performance" subtitle="Overall score trend across sessions" data={progress.trend} lines={['overall', 'technical', 'communication']} />
            </div>
            <RadarChartCard title="Skill progress" subtitle="Readiness by category" data={SKILL_GAP_RESULT.radar} />
          </div>

          <div className="grid lg:grid-cols-3 gap-5 mb-6">
            {/* Recent interviews */}
            <Card className="lg:col-span-2 !p-0 overflow-hidden">
              <div className="flex items-center justify-between p-5 pb-0">
                <h3 className="font-display font-semibold text-text-primary">Recent interviews</h3>
                <Link to="/app/interviews/history" className="text-xs font-semibold text-blue hover:text-cyan">View all</Link>
              </div>
              <div className="p-5 space-y-1">
                {history.slice(0, 4).map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{h.role}</p>
                      <p className="text-xs text-text-muted mt-0.5">{h.type} · {h.mode} · {formatDate(h.date)}</p>
                    </div>
                    <Badge tone={scoreTone(h.score) === 'success' ? 'success' : scoreTone(h.score) === 'warning' ? 'warning' : 'error'}>{h.score}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Resume + career */}
            <div className="space-y-5">
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-semibold text-text-primary text-sm">Latest resume analysis</h3>
                  <Badge tone="success">{latestResume.atsScore}/100</Badge>
                </div>
                <p className="text-xs text-text-muted">{latestResume.name}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {latestResume.missingSkills.slice(0, 3).map((s) => <Badge key={s} tone="warning">{s}</Badge>)}
                </div>
                <Link to="/app/resume-analyzer"><Button variant="outline" fullWidth className="mt-4 !text-xs !py-2">View analysis</Button></Link>
              </Card>
              <Card>
                <h3 className="font-display font-semibold text-text-primary text-sm mb-2">Recommended career</h3>
                <p className="text-sm text-text-primary font-medium">{topCareer.title}</p>
                <ProgressBar value={topCareer.match} className="mt-2.5" />
                <p className="text-xs text-text-muted mt-1.5">{topCareer.match}% match</p>
                <Link to="/app/career-guidance"><Button variant="outline" fullWidth className="mt-4 !text-xs !py-2">See all matches</Button></Link>
              </Card>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Missing skills + resources */}
            <Card>
              <h3 className="font-display font-semibold text-text-primary text-sm mb-3">Missing skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_GAP_RESULT.missingSkills.map((s) => <Badge key={s} tone="warning">{s}</Badge>)}
              </div>
              <h3 className="font-display font-semibold text-text-primary text-sm mt-5 mb-2">Recommended resources</h3>
              <ul className="space-y-2">
                {LEARNING_RESOURCES.filter((r) => r.recommended).slice(0, 2).map((r) => (
                  <li key={r.id} className="text-sm text-text-secondary flex items-center gap-2"><BookOpen size={13} className="text-blue shrink-0" />{r.title}</li>
                ))}
              </ul>
            </Card>

            {/* Weekly goal + checklist */}
            <Card>
              <h3 className="font-display font-semibold text-text-primary text-sm mb-2">Weekly goal</h3>
              <ProgressBar value={60} tone="cyan" />
              <p className="text-xs text-text-muted mt-1.5">3 of 5 tasks complete this week</p>
              <h3 className="font-display font-semibold text-text-primary text-sm mt-5 mb-2">Quick checklist</h3>
              <ul className="space-y-2">
                {CHECKLIST.map((c) => (
                  <li key={c.label} className="flex items-center gap-2.5 text-sm">
                    {c.done ? <CheckCircle2 size={15} className="text-success shrink-0" /> : <Circle size={15} className="text-text-muted shrink-0" />}
                    <span className={c.done ? 'text-text-secondary line-through decoration-text-disabled' : 'text-text-secondary'}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Achievements */}
            <Card>
              <h3 className="font-display font-semibold text-text-primary text-sm mb-3">Achievements</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Flame, label: '5-day streak' },
                  { icon: Award, label: 'First 80+ score' },
                  { icon: Mic, label: '10 interviews' },
                  { icon: TrendingUp, label: 'Resume +22' },
                ].map((a) => (
                  <div key={a.label} className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-black/[0.035]">
                    <a.icon size={18} className="text-cyan" />
                    <span className="text-[11px] text-text-muted">{a.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
