import { FileText, Compass, Radar, Mic, TrendingUp, Map, BookOpen, Bell } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'

const FEATURES = [
  { icon: FileText, title: 'Resume Analyzer', desc: 'ATS scoring, skills detected vs missing, grammar and formatting checks, and section-by-section suggestions.' },
  { icon: Compass, title: 'Career Guidance', desc: 'Personalised role recommendations with match percentage, salary insight, and demand level.' },
  { icon: Radar, title: 'Skill Gap Analysis', desc: 'A clear breakdown of what separates your current skillset from your target role.' },
  { icon: Mic, title: 'Mock Interviews', desc: 'Text, voice, and video interview modes with a live AI interviewer panel.' },
  { icon: TrendingUp, title: 'AI Evaluation & Reports', desc: 'Detailed scoring across technical accuracy, communication, and delivery, with question-by-question breakdowns.' },
  { icon: Map, title: 'Learning Roadmap', desc: 'A personalised, staged roadmap of skills, tasks, and resources building toward interview readiness.' },
  { icon: BookOpen, title: 'Learning Resources', desc: 'Curated courses, articles, and practice exercises matched to your skill gaps.' },
  { icon: Bell, title: 'Progress & Notifications', desc: 'Track your readiness trend over time and stay on top of reminders and recommendations.' },
]

export default function Features() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-16">
      <Badge tone="cyan">Platform</Badge>
      <h1 className="font-display font-bold text-3xl md:text-4xl text-text-primary mt-4">Everything you need to prepare</h1>
      <p className="text-text-secondary mt-3 max-w-2xl">A connected set of tools that take you from resume to ready.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
        {FEATURES.map((f) => (
          <Card key={f.title} hover>
            <div className="w-11 h-11 rounded-xl bg-blue/10 text-blue flex items-center justify-center"><f.icon size={20} /></div>
            <h3 className="font-display font-semibold text-text-primary mt-4">{f.title}</h3>
            <p className="text-sm text-text-muted mt-1.5">{f.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
