import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AIProcessingLoader from '../../components/interview/AIProcessingLoader'
import { AlertCircle } from 'lucide-react'

const STEPS = ['Processing answers', 'Analysing relevance', 'Checking technical keywords', 'Analysing communication', 'Preparing recommendations', 'Generating report']
const TIPS = [
  'Structure technical answers as: approach, trade-offs, example.',
  'Use the STAR method for behavioural questions.',
  'Pause briefly before answering — it reads as confidence, not hesitation.',
  'Quantify impact wherever you can in your answers.',
]

export default function EvaluationLoading() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const stepTimer = setInterval(() => setActiveIndex((i) => Math.min(i + 1, STEPS.length)), 700)
    const tipTimer = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 2200)
    const done = setTimeout(() => navigate(`/app/interviews/report/${id}`, { replace: true }), 4600)
    return () => { clearInterval(stepTimer); clearInterval(tipTimer); clearTimeout(done) }
  }, [id, navigate])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <AIProcessingLoader steps={STEPS} activeIndex={activeIndex} />
      <div className="mt-8 max-w-sm surface-card p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-blue shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary text-left">Please don&apos;t close this page — we&apos;re generating your detailed report.</p>
      </div>
      <p className="text-sm text-text-muted mt-6 max-w-sm italic">&ldquo;{TIPS[tipIndex]}&rdquo;</p>
    </div>
  )
}
