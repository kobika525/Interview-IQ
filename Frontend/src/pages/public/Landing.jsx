import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText, Compass, Mic, TrendingUp, Sparkles, CheckCircle2, ArrowRight,
  Video, Keyboard, Radar, Map, Users, Star, ChevronDown,
} from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import CircularProgress from '../../components/common/CircularProgress'
import WaveformVisualizer from '../../components/interview/WaveformVisualizer'
import { useState } from 'react'

const STATS = [
  ['12,400+', 'Interviews completed'],
  ['4.8 / 5', 'Average user rating'],
  ['86%', 'Report improved confidence'],
  ['9', 'Career paths supported'],
]

const FEATURES = [
  { icon: FileText, title: 'Resume Analyzer', desc: 'ATS scoring, missing-skill detection, and grammar checks in seconds.' },
  { icon: Compass, title: 'Career Guidance', desc: 'Personalised role matches with salary and demand insight.' },
  { icon: Radar, title: 'Skill Gap Analysis', desc: 'See exactly what separates you from your target role.' },
  { icon: Mic, title: 'Mock Interviews', desc: 'Text, voice, or full video simulations with real-time AI feedback.' },
  { icon: TrendingUp, title: 'AI Evaluation', desc: 'Detailed scoring across technical, communication, and delivery.' },
  { icon: Map, title: 'Learning Roadmap', desc: 'A personalised, week-by-week plan to close your skill gaps.' },
]

const STEPS = [
  ['01', 'Upload your resume', 'Get an instant ATS score and skills breakdown.'],
  ['02', 'Get your roadmap', 'Matched careers, skill gaps, and a learning plan.'],
  ['03', 'Practice interviews', 'Text, voice, or video — with a live AI panel.'],
  ['04', 'Track your growth', 'Watch your readiness score climb, session by session.'],
]

const MODES = [
  { icon: Keyboard, title: 'Text Interview', desc: 'Type your answers at your own pace with instant AI scoring.' },
  { icon: Mic, title: 'Voice Interview', desc: 'Speak naturally — we analyse pace, filler words, and clarity.' },
  { icon: Video, title: 'Video Interview', desc: 'Full simulation with camera engagement and delivery feedback.' },
]

const TESTIMONIALS = [
  { name: 'Amara Fernando', role: 'Backend Engineer, hired 2026', quote: 'I walked into my final round already knowing my weak spots. That does not happen by accident.' },
  { name: 'Kavindu Silva', role: 'Final-year CS student', quote: 'The video interview mode felt like the real thing — I was so much calmer in my actual interviews.' },
  { name: 'Nadeesha Perera', role: 'Frontend Developer', quote: 'The skill gap analysis told me exactly what to study. No more guessing.' },
]

const FAQS = [
  { q: 'Is Interview IQ free to use?', a: 'You can start with a free mock interview and resume scan. Extended features are part of our upcoming premium tier.' },
  { q: 'Which interview modes are supported?', a: 'Text, voice, and video — each with tailored AI feedback suited to that format.' },
  { q: 'Do I need to install anything?', a: 'No — Interview IQ runs entirely in your browser, including microphone and camera-based practice.' },
  { q: 'Is my resume data kept private?', a: 'Yes. Your resume and interview data are only used to generate your personal feedback and reports.' },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="surface-card p-5">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-4 text-left">
        <span className="font-medium text-text-primary">{q}</span>
        <ChevronDown size={18} className={`text-text-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-text-muted mt-3">{a}</p>}
    </div>
  )
}

export default function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue/10 blur-[140px]" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-20 grid lg:grid-cols-2 gap-14 items-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge tone="blue"><Sparkles size={12} />AI-Powered Career Platform</Badge>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-[3.4rem] leading-[1.08] mt-5 text-text-primary">
              Build Confidence.<br />Master Interviews.<br />
              <span className="bg-gradient-to-r from-cyan to-blue bg-clip-text text-transparent">Launch Your Career.</span>
            </h1>
            <p className="text-text-secondary mt-6 max-w-lg leading-relaxed">
              Interview IQ helps students, fresh graduates and job seekers analyse their resumes, identify skill gaps,
              practise realistic interviews and improve their career readiness.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/register"><Button icon={ArrowRight}>Start Free Interview</Button></Link>
              <Link to="/app/resume-analyzer"><Button variant="outline">Analyse My Resume</Button></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12">
              {STATS.map(([val, label]) => (
                <div key={label}>
                  <div className="font-display font-bold text-xl md:text-2xl text-text-primary">{val}</div>
                  <div className="text-xs text-text-muted mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative">
            <div className="glass p-5 space-y-4 glow-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted">RESUME ATS SCORE</span>
                <Badge tone="success"><CheckCircle2 size={11} />Analysed</Badge>
              </div>
              <div className="flex items-center gap-5">
                <CircularProgress value={86} size={72} />
                <div className="flex-1 grid grid-cols-3 gap-2">
                  {[['Skills', 90], ['Grammar', 88], ['Format', 82]].map(([l, v]) => (
                    <div key={l} className="text-center">
                      <div className="font-mono text-sm font-semibold text-text-primary">{v}</div>
                      <div className="text-[10px] text-text-muted">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border-subtle pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-muted">VOICE INTERVIEW · LIVE</span>
                  <span className="text-[11px] font-mono text-cyan">00:42</span>
                </div>
                <WaveformVisualizer active bars={28} />
              </div>
              <div className="border-t border-border-subtle pt-4 grid grid-cols-2 gap-3">
                <div className="surface-card !bg-black/[0.035] p-3">
                  <p className="text-[10px] text-text-muted">CAREER MATCH</p>
                  <p className="font-display font-bold text-text-primary mt-0.5">Backend Dev · 92%</p>
                </div>
                <div className="surface-card !bg-black/[0.035] p-3">
                  <p className="text-[10px] text-text-muted">READINESS TREND</p>
                  <p className="font-display font-bold text-success mt-0.5">+14 this week</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <Badge tone="cyan">Platform</Badge>
          <h2 className="font-display font-bold text-3xl text-text-primary mt-3">Everything between "applied" and "hired"</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <Card key={f.title} hover>
              <div className="w-11 h-11 rounded-xl bg-blue/10 text-blue flex items-center justify-center"><f.icon size={20} /></div>
              <h3 className="font-display font-semibold text-text-primary mt-4">{f.title}</h3>
              <p className="text-sm text-text-muted mt-1.5">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <Badge tone="blue">Process</Badge>
          <h2 className="font-display font-bold text-3xl text-text-primary mt-3">How Interview IQ works</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map(([num, title, desc]) => (
            <div key={num} className="relative">
              <span className="font-display font-extrabold text-4xl bg-gradient-to-br from-blue to-cyan bg-clip-text text-transparent">{num}</span>
              <h3 className="font-display font-semibold text-text-primary mt-2">{title}</h3>
              <p className="text-sm text-text-muted mt-1.5">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* INTERVIEW MODES */}
      <section id="interview-modes" className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <Badge tone="coral">Practice</Badge>
          <h2 className="font-display font-bold text-3xl text-text-primary mt-3">Three ways to practise</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {MODES.map((m) => (
            <Card key={m.title} hover className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue/20 to-cyan/20 text-cyan flex items-center justify-center mx-auto"><m.icon size={24} /></div>
              <h3 className="font-display font-semibold text-text-primary mt-4">{m.title}</h3>
              <p className="text-sm text-text-muted mt-1.5">{m.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Badge tone="blue">Why Interview IQ</Badge>
          <h2 className="font-display font-bold text-3xl text-text-primary mt-3">Preparation that actually transfers to the real interview</h2>
          <ul className="mt-6 space-y-3.5">
            {['Realistic AI panel across text, voice and video', 'Actionable, question-by-question feedback', 'A learning roadmap built around your gaps', 'Progress tracking that shows real improvement'].map((b) => (
              <li key={b} className="flex items-start gap-3 text-text-secondary text-sm">
                <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />{b}
              </li>
            ))}
          </ul>
        </div>
        <Card elevated className="flex items-center gap-5">
          <Users size={36} className="text-blue shrink-0" />
          <div>
            <p className="font-display font-bold text-2xl text-text-primary">12,400+ candidates</p>
            <p className="text-sm text-text-muted mt-1">have practised with Interview IQ to prepare for real interviews across technical and HR rounds.</p>
          </div>
        </Card>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <Badge tone="cyan">Testimonials</Badge>
          <h2 className="font-display font-bold text-3xl text-text-primary mt-3">Trusted by job seekers</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name}>
              <div className="flex gap-0.5 text-warning mb-3">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              <p className="text-sm text-text-secondary leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-border-subtle">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue to-cyan flex items-center justify-center text-[11px] font-semibold text-white">{t.name[0]}</div>
                <div>
                  <p className="text-xs font-medium text-text-primary">{t.name}</p>
                  <p className="text-[11px] text-text-muted">{t.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-10">
          <Badge tone="blue">FAQ</Badge>
          <h2 className="font-display font-bold text-3xl text-text-primary mt-3">Frequently asked questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f) => <FAQItem key={f.q} {...f} />)}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-20">
        <Card elevated className="text-center py-14 px-6 relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-blue/15 blur-[100px]" />
          <h2 className="font-display font-bold text-3xl text-text-primary relative z-10">Your next interview doesn&apos;t have to be the first time you answer these questions.</h2>
          <div className="flex flex-wrap justify-center gap-3 mt-7 relative z-10">
            <Link to="/register"><Button icon={ArrowRight}>Create free account</Button></Link>
          </div>
        </Card>
      </section>
    </div>
  )
}
