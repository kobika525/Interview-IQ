import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Download, Save, RefreshCw, Mic } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import FileUpload from '../../components/common/FileUpload'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import Badge from '../../components/common/Badge'
import SkillTag from '../../components/common/SkillTag'
import ProgressBar from '../../components/common/ProgressBar'
import AIProcessingLoader from '../../components/interview/AIProcessingLoader'
import ResumeScoreRing from '../../components/resume/ResumeScoreRing'
import ResumeSectionCheck from '../../components/resume/ResumeSectionCheck'
import UpgradeBanner from '../../components/billing/UpgradeBanner'
import * as resumeService from '../../services/resumeService'
import { RESUME_ANALYSES } from '../../data/mockData'
import { useAuth } from '../../hooks/useAuth'
import { canScanAnotherResume, isPremium } from '../../utils/permissions'
import { FREE_RESUME_SCAN_LIMIT } from '../../utils/constants'

const STEPS = ['Extracting text', 'Detecting skills', 'Calculating ATS score', 'Generating recommendations']
const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'skills', label: 'Skills' },
  { value: 'ats', label: 'ATS Analysis' },
  { value: 'sections', label: 'Resume Sections' },
  { value: 'recommendations', label: 'Recommendations' },
]

export default function ResumeAnalyzer() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [tab, setTab] = useState('overview')

  const scansUsed = user?.usage?.resumeScansThisMonth ?? 0
  const limitReached = !canScanAnotherResume(user)

  async function analyze() {
    if (limitReached) return
    setProcessing(true)
    setStep(0)
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 550)
    const data = await resumeService.analyzeResume(file)

    clearInterval(timer)
    setStep(STEPS.length - 1)
    setTimeout(() => {
      setResult(data)
      setProcessing(false)
      updateUser({ usage: { ...user?.usage, resumeScansThisMonth: scansUsed + 1 } })
      toast.success('Resume analysis complete!')
    }, 400)
  }

  return (
    <div>
      <PageHeader
        title="Resume Analyzer"
        subtitle="Upload a resume to get an estimated ATS readiness score and gap analysis."
        actions={!isPremium(user) && <Badge tone="blue">{scansUsed}/{FREE_RESUME_SCAN_LIMIT} free scans used</Badge>}
      />

      {limitReached && !result && !processing && (
        <div className="max-w-2xl mb-5">
          <UpgradeBanner title="You've used all your free resume scans this month" message="Upgrade to Premium for unlimited resume analyses." />
        </div>
      )}

      {!result && !processing && (
        <Card className="max-w-2xl">
          <FileUpload file={file} onFile={setFile} onRemove={() => setFile(null)} />
          <Button className="mt-5" fullWidth disabled={!file || limitReached} onClick={analyze}>
            {limitReached ? 'Upgrade to analyse another resume' : 'Analyse Resume'}
          </Button>
        </Card>
      )}

      {processing && (
        <Card className="max-w-md mx-auto text-center py-10">
          <AIProcessingLoader steps={STEPS} activeIndex={step} />
        </Card>
      )}

      {result && !processing && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <Tabs tabs={TABS} active={tab} onChange={setTab} />
            <div className="flex gap-2">
              <Button variant="outline" icon={Download}>Download report</Button>
              <Button variant="ghost" icon={Save}>Save analysis</Button>
            </div>
          </div>

          {tab === 'overview' && (
            <div className="grid md:grid-cols-3 gap-5">
              <Card className="md:col-span-2"><ResumeScoreRing score={result.atsScore} /></Card>
              <Card>
                <p className="text-xs font-semibold text-text-muted mb-3">SCORE BREAKDOWN</p>
                {[['Grammar', result.grammarScore], ['Formatting', result.formattingScore], ['Keywords', result.keywordScore]].map(([l, v]) => (
                  <div key={l} className="mb-3">
                    <div className="flex justify-between text-xs mb-1"><span className="text-text-secondary">{l}</span><span className="font-mono text-text-primary">{v}</span></div>
                    <ProgressBar value={v} />
                  </div>
                ))}
              </Card>
              <Card><p className="text-xs font-semibold text-success mb-2">STRENGTHS</p><ul className="space-y-1.5">{result.strengths.map((s) => <li key={s} className="text-sm text-text-secondary">• {s}</li>)}</ul></Card>
              <Card><p className="text-xs font-semibold text-error mb-2">WEAKNESSES</p><ul className="space-y-1.5">{result.weaknesses.map((s) => <li key={s} className="text-sm text-text-secondary">• {s}</li>)}</ul></Card>
              <Card>
                <p className="text-xs font-semibold text-text-muted mb-2">NEXT STEP</p>
                <p className="text-sm text-text-secondary mb-3">Turn this analysis into practice with a mock interview for your target role.</p>
                <Button icon={Mic} fullWidth onClick={() => navigate('/app/interviews/setup')}>Start interview based on resume</Button>
              </Card>
            </div>
          )}

          {tab === 'skills' && (
            <Card>
              <p className="text-xs font-semibold text-text-muted mb-3">SKILLS FOUND</p>
              <div className="flex flex-wrap gap-2 mb-6">{result.skillsFound.map((s) => <SkillTag key={s} tone="matched">{s}</SkillTag>)}</div>
              <p className="text-xs font-semibold text-text-muted mb-3">MISSING SKILLS</p>
              <div className="flex flex-wrap gap-2">{result.missingSkills.map((s) => <SkillTag key={s} tone="missing">{s}</SkillTag>)}</div>
            </Card>
          )}

          {tab === 'ats' && (
            <Card>
              <p className="text-xs font-semibold text-text-muted mb-4">DETAILED ATS BREAKDOWN</p>
              {[['Overall ATS score', result.atsScore], ['Keyword score', result.keywordScore], ['Formatting score', result.formattingScore], ['Grammar score', result.grammarScore]].map(([l, v]) => (
                <div key={l} className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5"><span className="text-text-secondary">{l}</span><span className="font-mono text-text-primary">{v}/100</span></div>
                  <ProgressBar value={v} height="h-2" />
                </div>
              ))}
            </Card>
          )}

          {tab === 'sections' && (
            <Card>
              <p className="text-xs font-semibold text-text-muted mb-4">SECTION COMPLETENESS</p>
              <ResumeSectionCheck sections={result.sections} />
            </Card>
          )}

          {tab === 'recommendations' && (
            <Card>
              <p className="text-xs font-semibold text-text-muted mb-3">IMPROVEMENT SUGGESTIONS</p>
              <ul className="space-y-2.5">
                {result.suggestions.map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-sm text-text-secondary"><Badge tone="blue">Tip</Badge>{s}</li>
                ))}
              </ul>
            </Card>
          )}

          <Button variant="outline" icon={RefreshCw} className="mt-6" onClick={() => { setResult(null); setFile(null) }}>Analyse another resume</Button>
        </div>
      )}
    </div>
  )
}
