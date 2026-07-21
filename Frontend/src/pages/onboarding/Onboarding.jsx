import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import RadioGroup from '../../components/common/RadioGroup'
import MultiSelect from '../../components/common/MultiSelect'
import Badge from '../../components/common/Badge'
import Logo from '../../components/common/Logo'
import { JOB_ROLES, STUDY_LEVELS, INTERVIEW_MODES } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../utils/helpers'

const STEP_TITLES = ['Welcome', 'Experience', 'Target role', 'Skills', 'Interview mode', 'Weekly goal', 'Summary']
const WEEKLY_GOALS = ['2 hours / week', '5 hours / week', '10 hours / week', '15+ hours / week']

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    goal: '', experience: '', targetRole: '', skills: [], mode: 'text', weeklyGoal: '',
  })

  function update(patch) { setData((d) => ({ ...d, ...patch })) }
  function next() { setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1)) }
  function back() { setStep((s) => Math.max(s - 1, 0)) }
  function skip() { next() }

  function finish() {
    updateUser({ targetCareer: data.targetRole || user?.targetCareer, skills: data.skills.length ? data.skills : user?.skills })
    toast.success('Profile set up — welcome to Interview IQ!')
    navigate('/app/dashboard')
  }

  const canProceed = [true, Boolean(data.experience), Boolean(data.targetRole), true, Boolean(data.mode), true, true][step]

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-xl">
        <div className="flex justify-center mb-8"><Logo /></div>

        <div className="flex items-center justify-center gap-1.5 mb-8 flex-wrap">
          {STEP_TITLES.map((label, i) => (
            <div key={label} className={cx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold',
              i === step ? 'bg-blue text-white' : i < step ? 'bg-success/15 text-success' : 'bg-black/[0.045] text-text-muted'
            )}>
              {i < step ? <Check size={10} /> : i + 1}
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        <div className="surface-card-elevated p-6 md:p-8 min-h-[340px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="flex-1">
              {step === 0 && (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue/20 to-cyan/20 text-cyan flex items-center justify-center mx-auto mb-4"><Sparkles size={24} /></div>
                  <h1 className="font-display font-bold text-2xl text-text-primary">Welcome, {user?.fullName?.split(' ')[0] || 'there'}!</h1>
                  <p className="text-sm text-text-muted mt-2 max-w-sm mx-auto">Let&apos;s personalise Interview IQ around your career goal. This takes about a minute.</p>
                  <div className="mt-6 max-w-xs mx-auto text-left">
                    <label className="field-label">What's your main goal right now?</label>
                    <Select options={['Land my first job', 'Switch careers', 'Improve my current interview skills', 'Prepare for a specific interview']} value={data.goal} onChange={(e) => update({ goal: e.target.value })} />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="font-display font-semibold text-xl text-text-primary mb-1">Your current experience level</h2>
                  <p className="text-sm text-text-muted mb-5">This helps us calibrate question difficulty.</p>
                  <RadioGroup name="experience" options={STUDY_LEVELS} value={data.experience} onChange={(v) => update({ experience: v })} />
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="font-display font-semibold text-xl text-text-primary mb-1">Your target career role</h2>
                  <p className="text-sm text-text-muted mb-5">We'll match careers, skills, and questions to this.</p>
                  <Select options={JOB_ROLES} value={data.targetRole} onChange={(e) => update({ targetRole: e.target.value })} placeholder="Select a target role" />
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="font-display font-semibold text-xl text-text-primary mb-1">Your current skills</h2>
                  <p className="text-sm text-text-muted mb-5">Add what you already know — we'll find the gaps.</p>
                  <MultiSelect value={data.skills} onChange={(v) => update({ skills: v })} placeholder="e.g. JavaScript, SQL, Git" />
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="font-display font-semibold text-xl text-text-primary mb-1">Preferred interview mode</h2>
                  <p className="text-sm text-text-muted mb-5">You can always switch modes later.</p>
                  <RadioGroup name="mode" options={INTERVIEW_MODES.map((m) => ({ value: m, label: m[0].toUpperCase() + m.slice(1) + ' interviews' }))} value={data.mode} onChange={(v) => update({ mode: v })} />
                </div>
              )}

              {step === 5 && (
                <div>
                  <h2 className="font-display font-semibold text-xl text-text-primary mb-1">Weekly learning target</h2>
                  <p className="text-sm text-text-muted mb-5">How much time can you commit each week?</p>
                  <RadioGroup name="weeklyGoal" options={WEEKLY_GOALS} value={data.weeklyGoal} onChange={(v) => update({ weeklyGoal: v })} />
                </div>
              )}

              {step === 6 && (
                <div>
                  <h2 className="font-display font-semibold text-xl text-text-primary mb-1">You're all set</h2>
                  <p className="text-sm text-text-muted mb-5">Here's your personalised profile summary.</p>
                  <div className="space-y-2.5">
                    {[['Goal', data.goal || '—'], ['Experience', data.experience || '—'], ['Target role', data.targetRole || '—'],
                      ['Skills', data.skills.join(', ') || '—'], ['Preferred mode', data.mode], ['Weekly goal', data.weeklyGoal || '—']].map(([l, v]) => (
                      <div key={l} className="flex justify-between py-2 border-b border-border-subtle text-sm">
                        <span className="text-text-muted">{l}</span><span className="text-text-primary font-medium text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center mt-7 pt-5 border-t border-border-subtle">
            <Button variant="ghost" onClick={back} disabled={step === 0}>Back</Button>
            <div className="flex gap-2.5">
              {step > 0 && step < STEP_TITLES.length - 1 && <Button variant="ghost" onClick={skip}>Skip</Button>}
              {step < STEP_TITLES.length - 1 ? (
                <Button onClick={next} disabled={!canProceed}>Continue</Button>
              ) : (
                <Button onClick={finish}>Go to dashboard</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
