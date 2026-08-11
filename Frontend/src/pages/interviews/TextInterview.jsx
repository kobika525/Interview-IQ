import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import QuestionCard from '../../components/interview/QuestionCard'
import QuestionNavigator from '../../components/interview/QuestionNavigator'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import ProgressBar from '../../components/common/ProgressBar'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import * as interviewService from '../../services/interviewService'
import { useInterviewSession } from '../../hooks/useInterviewSession'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import ErrorState from '../../components/common/ErrorState'
import toast from 'react-hot-toast'

export default function TextInterview() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { questions, loading, error, reload } = useInterviewSession(id, location.state?.session)
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [flagged, setFlagged] = useState([])
  const [exitOpen, setExitOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submittedOrders, setSubmittedOrders] = useState(new Set())

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const next = questions.findIndex((question) => !question.isAnswered && !question.isSkipped)
    if (next >= 0) setCurrent(next)
    setSubmittedOrders(new Set(questions.filter((question) => question.isAnswered).map((question) => question.orderNumber)))
  }, [questions])

  const answered = Object.keys(answers).filter((k) => answers[k]?.trim()).map(Number)
  const progressPct = Math.round((answered.length / questions.length) * 100)
  const answer = answers[current] || ''

  function setAnswer(val) { setAnswers((a) => ({ ...a, [current]: val })) }
  function toggleFlag() { setFlagged((f) => f.includes(current) ? f.filter((i) => i !== current) : [...f, current]) }

  async function submit() {
    setSubmitOpen(false)
    if (submitting) return
    setSubmitting(true)
    try {
      for (let index = 0; index < questions.length; index += 1) {
        const text = answers[index]?.trim()
        const order = questions[index].orderNumber || index + 1
        if (text && !submittedOrders.has(order) && !questions[index].isAnswered) {
          await interviewService.submitAnswer(id, order, text)
          setSubmittedOrders((orders) => new Set(orders).add(order))
        }
      }
      await interviewService.submitInterview(id)
      navigate(`/app/interviews/processing/${id}`)
    } catch (submitError) {
      toast.error(submitError.message || 'Unable to submit this interview. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  if (loading && questions.length === 0) return <SkeletonLoader rows={4} />
  if (error && questions.length === 0) return <ErrorState title="Unable to load interview" message={error.message} onRetry={reload} />
  if (questions.length === 0) return <ErrorState title="No interview questions" message="This session has no saved questions." onRetry={reload} />

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-text-primary">Text Interview</h1>
          <p className="text-xs text-text-muted mt-0.5">Question {current + 1} of {questions.length} · {mm}:{ss} elapsed</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge bg-white/[0.055] text-text-secondary">{progressPct}% complete</span>
          <Button variant="ghost" icon={LogOut} onClick={() => setExitOpen(true)}>Exit</Button>
        </div>
      </div>
      <ProgressBar value={progressPct} className="mb-6" />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <QuestionCard question={questions[current]} index={current} total={questions.length} />
          <Card>
            <div className="flex items-center justify-between mb-2">
              <label className="field-label !mb-0">Your answer</label>
              <button onClick={toggleFlag} className="text-xs text-warning flex items-center gap-1"><HelpCircle size={13} />{flagged.includes(current) ? 'Unflag' : 'Flag for review'}</button>
            </div>
            <Textarea rows={8} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer here..." />
            <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
              <span>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words · {answer.length} characters</span>
              <button onClick={() => setAnswer('')} className="hover:text-text-primary">Clear</button>
            </div>
            <div className="flex justify-between mt-5 pt-4 border-t border-border-subtle">
              <Button variant="ghost" icon={ChevronLeft} disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>Previous</Button>
              {current < questions.length - 1 ? (
                <Button icon={ChevronRight} onClick={() => setCurrent((c) => c + 1)}>Next question</Button>
              ) : (
                <Button loading={submitting} disabled={submitting} onClick={() => setSubmitOpen(true)}>Submit interview</Button>
              )}
            </div>
          </Card>
        </div>
        <Card className="h-fit">
          <QuestionNavigator total={questions.length} current={current} answered={answered} flagged={flagged} onSelect={setCurrent} />
        </Card>
      </div>

      <ConfirmDialog open={exitOpen} onClose={() => setExitOpen(false)} onConfirm={() => navigate('/app/interviews')} title="Exit interview?" message="Your progress on this session will be lost." confirmLabel="Exit" />
      <ConfirmDialog open={submitOpen} onClose={() => setSubmitOpen(false)} onConfirm={submit} title="Submit interview?" message="You won't be able to change your answers after submitting." confirmLabel="Submit" tone="blue" />
    </div>
  )
}
