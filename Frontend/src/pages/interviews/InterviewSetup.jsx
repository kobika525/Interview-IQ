import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Keyboard, Mic, Video, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import RadioGroup from '../../components/common/RadioGroup'
import MultiSelect from '../../components/common/MultiSelect'
import Badge from '../../components/common/Badge'
import { JOB_ROLES, INTERVIEW_TYPES, DIFFICULTY_LEVELS } from '../../utils/constants'
import { cx } from '../../utils/helpers'
import * as interviewService from '../../services/interviewService'

const MODES = [
  { value: 'text', label: 'Text', icon: Keyboard },
  { value: 'voice', label: 'Voice', icon: Mic },
  { value: 'video', label: 'Video', icon: Video },
]

const STEP_LABELS = ['Mode', 'Role', 'Type', 'Difficulty', 'Topics', 'Review']

export default function InterviewSetup() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [creating, setCreating] = useState(false)
  const [setup, setSetup] = useState({
    mode: params.get('mode') || 'text',
    role: '',
    type: '',
    difficulty: '',
    topics: [],
  })

  function update(patch) { setSetup((s) => ({ ...s, ...patch })) }
  function next() { setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)) }
  function back() { setStep((s) => Math.max(s - 1, 0)) }

  const canProceed = [Boolean(setup.mode), Boolean(setup.role), Boolean(setup.type), Boolean(setup.difficulty), true, true][step]

  async function startInterview() {
    setCreating(true)
    const session = await interviewService.createInterviewSession(setup)
    setCreating(false)
    toast.success('Interview session ready!')
    navigate(`/app/interviews/${setup.mode}/${session.id}`, { state: { session } })
  }

  return (
    <div>
      <PageHeader title="Interview Setup" subtitle="Configure your mock interview in a few quick steps." />

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className={cx('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap',
              i === step ? 'bg-blue text-white' : i < step ? 'bg-success/15 text-success' : 'bg-black/[0.045] text-text-muted')}>
              {i < step ? <Check size={12} /> : i + 1}
              {label}
            </div>
            {i < STEP_LABELS.length - 1 && <div className="w-6 h-px bg-border-subtle mx-1" />}
          </div>
        ))}
      </div>

      <Card className="max-w-2xl">
        {step === 0 && (
          <div>
            <h3 className="font-display font-semibold text-text-primary mb-4">Choose interview mode</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {MODES.map((m) => (
                <button key={m.value} onClick={() => update({ mode: m.value })}
                  className={cx('p-5 rounded-2xl border text-center transition-colors', setup.mode === m.value ? 'border-blue bg-blue/10' : 'border-border hover:border-border/80')}>
                  <m.icon size={22} className={setup.mode === m.value ? 'text-blue mx-auto' : 'text-text-muted mx-auto'} />
                  <p className={cx('text-sm font-medium mt-2', setup.mode === m.value ? 'text-text-primary' : 'text-text-secondary')}>{m.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className="font-display font-semibold text-text-primary mb-4">Choose target job role</h3>
            <Select options={JOB_ROLES} value={setup.role} onChange={(e) => update({ role: e.target.value })} placeholder="Select a role" />
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-display font-semibold text-text-primary mb-4">Choose interview type</h3>
            <RadioGroup name="type" options={INTERVIEW_TYPES} value={setup.type} onChange={(v) => update({ type: v })} />
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-display font-semibold text-text-primary mb-4">Choose difficulty</h3>
            <RadioGroup name="difficulty" options={DIFFICULTY_LEVELS} value={setup.difficulty} onChange={(v) => update({ difficulty: v })} />
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="font-display font-semibold text-text-primary mb-4">Select topics and skills</h3>
            <MultiSelect value={setup.topics} onChange={(v) => update({ topics: v })} placeholder="e.g. React, System Design" />
          </div>
        )}

        {step === 5 && (
          <div>
            <h3 className="font-display font-semibold text-text-primary mb-4">Review your interview settings</h3>
            <div className="space-y-2.5 text-sm">
              {[['Mode', setup.mode], ['Role', setup.role || '—'], ['Type', setup.type || '—'], ['Difficulty', setup.difficulty || '—'], ['Topics', setup.topics.join(', ') || '—']].map(([l, v]) => (
                <div key={l} className="flex justify-between py-2 border-b border-border-subtle">
                  <span className="text-text-muted">{l}</span><span className="text-text-primary font-medium capitalize">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-7 pt-5 border-t border-border-subtle">
          <Button variant="ghost" onClick={back} disabled={step === 0}>Back</Button>
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={() => toast.success('Draft saved')}>Save draft</Button>
            {step < STEP_LABELS.length - 1 ? (
              <Button onClick={next} disabled={!canProceed}>Next</Button>
            ) : (
              <Button onClick={startInterview} loading={creating}>Start Interview</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
