import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Keyboard, Mic, Video } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import InterviewModeCard from '../../components/interview/InterviewModeCard'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import CircularProgress from '../../components/common/CircularProgress'
import PaywallModal from '../../components/billing/PaywallModal'
import { useAuth } from '../../hooks/useAuth'
import { canUseVideoInterview } from '../../utils/permissions'
import * as interviewService from '../../services/interviewService'
import { formatDate, scoreTone } from '../../utils/formatters'

const MODES = [
  { icon: Keyboard, title: 'Text Interview', description: 'Type your answers at your own pace with instant AI scoring.', duration: '15-20 min', features: ['Autosave', 'Hints', 'Word count'], to: '/app/interviews/setup?mode=text', tone: 'blue' },
  { icon: Mic, title: 'Voice Interview', description: 'Speak naturally — we analyse pace, filler words, and clarity.', duration: '15-25 min', features: ['Live transcript', 'Waveform', 'Playback'], to: '/app/interviews/setup?mode=voice', tone: 'cyan' },
  { icon: Video, title: 'Video Interview', description: 'Full simulation with camera engagement and delivery feedback.', duration: '20-30 min', features: ['Face visibility', 'Camera-facing %', 'Recording'], to: '/app/interviews/setup?mode=video', tone: 'coral', premium: true },
]

export default function InterviewHome() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [paywallOpen, setPaywallOpen] = useState(false)

  useEffect(() => { interviewService.getInterviewHistory().then(setHistory) }, [])
  const recent = history[0]
  const videoUnlocked = canUseVideoInterview(user)

  return (
    <div>
      <PageHeader title="Mock Interviews" subtitle="Choose how you want to practise today." />

      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {MODES.map((m) => (
          <InterviewModeCard
            key={m.title} {...m}
            locked={Boolean(m.premium) && !videoUnlocked}
            onLockedClick={() => setPaywallOpen(true)}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="flex items-center gap-5">
          <CircularProgress value={78} size={80} label="ready" />
          <div>
            <h3 className="font-display font-semibold text-text-primary text-sm">Interview readiness</h3>
            <p className="text-xs text-text-muted mt-1">Based on your last 5 sessions</p>
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-semibold text-text-primary text-sm mb-2">Recommended next interview</h3>
          <p className="text-sm text-text-secondary">Video · Backend Developer · Hard</p>
          <p className="text-xs text-text-muted mt-1">Focus on system design — your weakest area recently.</p>
          <Link to="/app/interviews/setup"><Badge tone="blue" className="mt-3 cursor-pointer">Start now</Badge></Link>
        </Card>
        <Card>
          <h3 className="font-display font-semibold text-text-primary text-sm mb-2">Recent score</h3>
          {recent ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">{recent.role}</p>
                <p className="text-xs text-text-muted">{formatDate(recent.date)}</p>
              </div>
              <Badge tone={scoreTone(recent.score) === 'success' ? 'success' : 'warning'}>{recent.score}</Badge>
            </div>
          ) : <p className="text-sm text-text-muted">No interviews yet.</p>}
        </Card>
      </div>

      <Card className="mt-5">
        <h3 className="font-display font-semibold text-text-primary text-sm mb-3">Preparation tips</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm text-text-secondary">
          <p>• Use the STAR method for behavioural questions.</p>
          <p>• Keep technical answers structured: approach, trade-offs, example.</p>
          <p>• For video mode, check your lighting and camera framing first.</p>
          <p>• Review your last report before starting a new session.</p>
        </div>
      </Card>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} feature="Video interviews" />
    </div>
  )
}
