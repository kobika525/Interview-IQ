import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Mic, Compass, BookOpen, Award, Flame, Target, TrendingUp, CheckCircle2, Circle, CreditCard } from 'lucide-react'
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
import * as resumeService from '../../services/resumeService'
import * as resourceService from '../../services/resourceService'
import * as billingService from '../../services/billingService'
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
  const [resumes, setResumes] = useState([])
  const [resources, setResources] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      progressService.getProgressOverview(),
      interviewService.getInterviewHistory(),
      resumeService.getResumeHistory(),
      resourceService.getResources(),
      billingService.getPayments(),
    ]).then(([p, h, resumeItems, resourceItems, paymentItems]) => {
      setProgress(p)
      setHistory(h)
      setResumes(resumeItems)
      setResources(resourceItems)
      setPayments(paymentItems)
      setLoading(false)
    })
  }, [])

  const latestResume = resumes[0]
  const readiness = Math.round(progress?.careerReadiness || 0)
  const missingSkills = latestResume?.missingSkills || []
  const aiFeedback = progress?.aiFeedback || {}
  const voiceMetrics = progress?.voiceMetrics || {}
  const videoMetrics = progress?.videoMetrics || {}
  const scoreMetrics = [
    ['Communication', progress?.communicationScore],
    ['Grammar', progress?.grammarScore],
    ['Confidence', progress?.confidenceScore],
    ['Voice quality', voiceMetrics.clarity],
    ['Eye contact', videoMetrics.eyeContact ?? progress?.eyeContactScore],
    ['Visual presentation', videoMetrics.visualPresentation],
  ]
  const presentationMetrics = [
    ['Duration', voiceMetrics.recordingDurationSeconds != null ? `${Math.round(voiceMetrics.recordingDurationSeconds)}s` : null],
    ['Speaking rate', voiceMetrics.wpm != null ? `${voiceMetrics.wpm} WPM` : null],
    ['Speaking speed', voiceMetrics.speakingSpeed],
    ['Average pause', voiceMetrics.averagePauseSeconds != null ? `${voiceMetrics.averagePauseSeconds}s` : null],
    ['Longest pause', voiceMetrics.longestPauseSeconds != null ? `${voiceMetrics.longestPauseSeconds}s` : null],
    ['Long pauses', voiceMetrics.longPauseCount],
    ['Filler words', voiceMetrics.fillerCount],
    ['Voice confidence', voiceMetrics.confidence],
    ['Voice fluency', voiceMetrics.fluency],
    ['Pronunciation', voiceMetrics.pronunciation],
    ['Voice clarity', voiceMetrics.clarity],
    ['Head stability', videoMetrics.headStability],
    ['Camera framing', videoMetrics.cameraFraming],
    ['Visual presentation', videoMetrics.visualPresentation],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '')
  const timeline = progress?.improvementTimeline || []
  const scoreChange = timeline.length > 1
    ? Math.round(timeline[timeline.length - 1].overall - timeline[0].overall)
    : undefined

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
            <StatCard icon={FileText} label="Latest ATS Score" value={latestResume?.overallScore ?? latestResume?.atsScore ?? 0} tone="blue" tooltip="From your most recent resume scan" />
            <StatCard icon={TrendingUp} label="Interview Score" value={progress.latestInterviewScore || progress.avgScore} trend={scoreChange} tone="cyan" progress={progress.latestInterviewScore || progress.avgScore} tooltip={`Average across interviews: ${progress.avgScore}/100`} />
            <StatCard icon={Mic} label="Completed Interviews" value={progress.totalInterviews} tone="coral" />
            <StatCard icon={Target} label="Career Readiness" value={readiness} suffix="%" tone="blue" progress={readiness} />
            <StatCard icon={Flame} label="Learning Streak" value={progress.streak} suffix="days" tone="warning" />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-5 mb-6">
            <div className="lg:col-span-2">
              <LineChartCard title="Improvement timeline" subtitle="Interview skill scores across recent sessions" data={progress.improvementTimeline} lines={['overall', 'technical', 'communication', 'grammar', 'confidence']} />
            </div>
            <RadarChartCard title="Skill progress" subtitle="Readiness by category" data={progress.skillBreakdown || []} />
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
                    <div className="flex items-center gap-3">
                      <Badge tone={scoreTone(h.score) === 'success' ? 'success' : scoreTone(h.score) === 'warning' ? 'warning' : 'error'}>{h.score}</Badge>
                      {h.hasReport && (
                        <Link to={`/app/interviews/report/${h.id}`} className="text-xs font-semibold text-blue hover:text-cyan">
                          View report
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                {history.length === 0 && <p className="py-5 text-sm text-text-muted">Complete an interview to see your scores and feedback.</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4">
                  {scoreMetrics.map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-white/[0.035] p-3">
                      <p className="text-[11px] text-text-muted">{label}</p>
                      <p className="mt-1 font-display font-semibold text-text-primary">{value != null ? `${Math.round(value)}/100` : '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Resume + career */}
            <div className="space-y-5">
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-semibold text-text-primary text-sm">Latest resume analysis</h3>
                  <Badge tone="success">{latestResume?.overallScore ?? latestResume?.atsScore ?? 0}/100</Badge>
                </div>
                <p className="text-xs text-text-muted">{latestResume?.originalFilename || latestResume?.name || 'No resume uploaded'}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {missingSkills.slice(0, 3).map((s) => <Badge key={s} tone="warning">{s}</Badge>)}
                </div>
                <Link to="/app/resume-analyzer"><Button variant="outline" fullWidth className="mt-4 !text-xs !py-2">View analysis</Button></Link>
              </Card>
              <Card>
                <h3 className="font-display font-semibold text-text-primary text-sm mb-2">Recommended career</h3>
                <p className="text-sm text-text-primary font-medium">{user?.targetCareer || 'Generate your career matches'}</p>
                {progress.careerSuggestions?.[0] && <p className="text-xs text-text-secondary mt-2 line-clamp-3">{progress.careerSuggestions[0]}</p>}
                <ProgressBar value={readiness} className="mt-2.5" />
                <p className="text-xs text-text-muted mt-1.5">{readiness}% readiness</p>
                <Link to="/app/career-guidance"><Button variant="outline" fullWidth className="mt-4 !text-xs !py-2">See all matches</Button></Link>
              </Card>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Missing skills + resources */}
            <Card>
              <h3 className="font-display font-semibold text-text-primary text-sm mb-3">Missing skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((s) => <Badge key={s} tone="warning">{s}</Badge>)}
              </div>
              <h3 className="font-display font-semibold text-text-primary text-sm mt-5 mb-2">Recommended resources</h3>
              <ul className="space-y-2">
                {resources.slice(0, 2).map((r) => (
                  <li key={r.id} className="text-sm text-text-secondary flex items-center gap-2"><BookOpen size={13} className="text-blue shrink-0" />{r.title}</li>
                ))}
              </ul>
              {(aiFeedback.summary || aiFeedback.improvements?.length > 0) && (
                <div className="mt-5 pt-4 border-t border-border-subtle">
                  <h3 className="font-display font-semibold text-text-primary text-sm mb-2">AI feedback</h3>
                  {aiFeedback.summary && <p className="text-xs text-text-secondary line-clamp-4">{aiFeedback.summary}</p>}
                  {aiFeedback.improvements?.slice(0, 2).map((item) => (
                    <p key={item} className="text-xs text-text-secondary mt-2">• {item}</p>
                  ))}
                </div>
              )}
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
              <h3 className="font-display font-semibold text-text-primary text-sm mb-3">Voice &amp; presentation</h3>
              {presentationMetrics.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {presentationMetrics.map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <p className="text-[10px] text-text-muted">{label}</p>
                      <p className="text-xs font-semibold text-text-secondary truncate">{typeof value === 'number' && label !== 'Long pauses' && label !== 'Filler words' ? `${Math.round(value)}/100` : value}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-text-muted">Complete a voice or video interview to view delivery metrics.</p>}
              <h3 className="font-display font-semibold text-text-primary text-sm mt-5 mb-3">Achievements</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Flame, label: '5-day streak' },
                  { icon: Award, label: 'First 80+ score' },
                  { icon: Mic, label: '10 interviews' },
                  { icon: TrendingUp, label: 'Resume +22' },
                ].map((a) => (
                  <div key={a.label} className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-white/[0.035]">
                    <a.icon size={18} className="text-cyan" />
                    <span className="text-[11px] text-text-muted">{a.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-text-primary text-sm flex items-center gap-2"><CreditCard size={16} className="text-blue" />Payment history</h3>
              <Link to="/app/billing" className="text-xs font-semibold text-blue hover:text-cyan">View billing</Link>
            </div>
            {payments.length === 0 ? <p className="text-xs text-text-muted">No payment attempts yet.</p> : (
              <div className="space-y-2">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-4 py-2 border-b border-border-subtle last:border-0">
                    <div><p className="text-sm text-text-secondary">{payment.plan}</p><p className="text-xs text-text-muted">{formatDate(payment.date)} · {payment.orderId}</p></div>
                    <div className="text-right"><p className="text-sm font-medium text-text-primary">{payment.currency} {payment.amount.toFixed(2)}</p><Badge tone={payment.status === 'PAID' ? 'success' : payment.status === 'PENDING' ? 'warning' : 'error'}>{payment.status}</Badge></div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
