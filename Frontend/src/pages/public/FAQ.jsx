import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Badge from '../../components/common/Badge'
import Tabs from '../../components/common/Tabs'

const CATEGORIES = {
  General: [
    { q: 'What is Interview IQ?', a: 'An AI-powered mock interview and career guidance platform that helps you analyse your resume, close skill gaps, and practise realistic interviews.' },
    { q: 'Who is Interview IQ for?', a: 'Undergraduate students, fresh graduates, internship seekers, job seekers, and junior software engineers preparing for interviews.' },
  ],
  'Resume Analyzer': [
    { q: 'What file types are supported?', a: 'PDF and DOCX files, up to 5MB.' },
    { q: 'Is the ATS score guaranteed accurate?', a: 'No — it is an estimated, AI-assisted readiness score meant to guide improvement, not a guarantee of applicant tracking system behaviour.' },
  ],
  Interviews: [
    { q: 'What interview modes are available?', a: 'Text, voice, and video — each with tailored AI feedback for that format.' },
    { q: 'Can I retake an interview?', a: 'Yes, from Interview History you can retake any past session in a new attempt.' },
  ],
  'Career Guidance': [
    { q: 'How are careers matched to me?', a: 'Based on your skills, education, interests, and stated goals, weighed against typical requirements for each role.' },
  ],
  Subscription: [
    { q: 'Can I cancel anytime?', a: 'Yes, from Settings → Billing. You keep access until the end of the current billing period.' },
    { q: 'Is there a free plan?', a: 'Yes — the Free plan includes limited resume scans and text/voice interviews with no time limit.' },
  ],
  Privacy: [
    { q: 'Is my resume data private?', a: 'Yes, your resume and interview data are used only to generate your personal feedback and reports.' },
  ],
  'Technical Support': [
    { q: 'The app is not loading — what should I do?', a: 'Try refreshing, checking your internet connection, or visiting our Support page to open a ticket.' },
  ],
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="surface-card p-5">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-4 text-left" aria-expanded={open}>
        <span className="font-medium text-text-primary text-sm">{q}</span>
        <ChevronDown size={16} className={`text-text-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-text-muted mt-3">{a}</p>}
    </div>
  )
}

export default function FAQ() {
  const cats = Object.keys(CATEGORIES)
  const [active, setActive] = useState(cats[0])

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <Badge tone="blue">FAQ</Badge>
      <h1 className="font-display font-bold text-3xl md:text-4xl text-text-primary mt-4">Frequently asked questions</h1>
      <Tabs tabs={cats.map((c) => ({ value: c, label: c }))} active={active} onChange={setActive} className="mt-8 mb-6" />
      <div className="space-y-3">
        {CATEGORIES[active].map((f) => <FAQItem key={f.q} {...f} />)}
      </div>
    </div>
  )
}
