import { useEffect, useState } from 'react'
import { Download, Mic, Save, Map } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Select from '../../components/common/Select'
import MultiSelect from '../../components/common/MultiSelect'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import SkillTag from '../../components/common/SkillTag'
import CircularProgress from '../../components/common/CircularProgress'
import RadarChartCard from '../../components/charts/RadarChartCard'
import * as skillGapService from '../../services/skillGapService'
import * as resourceService from '../../services/resourceService'
import * as careerService from '../../services/careerService'
import toast from 'react-hot-toast'
import { STUDY_LEVELS } from '../../utils/constants'
import { useNavigate } from 'react-router-dom'
import Input from '../../components/common/Input'
import * as userService from '../../services/userService'
import * as resumeService from '../../services/resumeService'

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const displayLevel = (value) => value ? `${value.charAt(0)}${value.slice(1).toLowerCase()}` : ''

export default function SkillGapAnalysis() {
  const navigate = useNavigate()
  const [targetRole, setTargetRole] = useState('')
  const [roles, setRoles] = useState([])
  const [experience, setExperience] = useState('')
  const [skills, setSkills] = useState([])
  const [education, setEducation] = useState('')
  const [goals, setGoals] = useState('')
  const [resumeId, setResumeId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    Promise.all([
      careerService.getCareerRoles(), careerService.getMySkills(),
      userService.getProfile(), resumeService.getResumeHistory(),
    ])
      .then(([careerRoles, profileSkills, profile, resumes]) => {
        setRoles(careerRoles)
        const latestResume = resumes[0]
        setResumeId(latestResume?.id || null)
        setSkills([...new Set([...profileSkills, ...(latestResume?.skillsFound || [])])])
        setEducation(profile.degree || '')
        setExperience(displayLevel(profile.studyLevel))
        setGoals(profile.careerGoal || '')
        if (profile.targetCareerRoleId) setTargetRole(String(profile.targetCareerRoleId))
      })
      .catch((error) => toast.error(error.message))
  }, [])

  async function analyze() {
    setLoading(true)
    try {
      const selectedRole = roles.find((role) => String(role.id) === targetRole)
      setResult(await skillGapService.analyzeSkillGap({
        careerRoleId: selectedRole?.id,
        targetRole: selectedRole?.title,
        skills,
        experience,
        education,
        goals,
        resumeId,
      }))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function generateRoadmap() {
    setLoading(true)
    try {
      await resourceService.generateRoadmap(result.careerRoleId, result.id)
      navigate('/app/learning-roadmap')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Skill Gap Analysis" subtitle="See exactly what separates you from your target role." />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="h-fit space-y-4">
          <Select label="Target role" options={roles.map((role) => ({ value: String(role.id), label: role.title }))} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
          <MultiSelect label="Current skills" value={skills} onChange={setSkills} />
          <Select label="Experience level" options={EXPERIENCE_LEVELS} value={experience} onChange={(e) => setExperience(e.target.value)} />
          <Select label="Education level" options={STUDY_LEVELS} value={education} onChange={(e) => setEducation(e.target.value)} />
          <Input label="Career goal" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="e.g. Become job-ready in 6 months" />
          <Button fullWidth loading={loading} disabled={!targetRole} onClick={analyze}>Analyse</Button>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          {!result ? (
            <Card className="text-center py-14">
              <p className="text-sm text-text-muted">Select a target role and run the analysis to see your results.</p>
            </Card>
          ) : (
            <>
              <Card className="flex items-center gap-6 flex-wrap">
                <CircularProgress value={result.readiness} size={100} label="ready" />
                <div>
                  <h3 className="font-display font-semibold text-text-primary">Overall role readiness</h3>
                  <p className="text-sm text-text-muted mt-1">for {result.targetRole} · Estimated prep time: {result.estimatedPrep}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {result.prioritySkills.map((s) => <Badge key={s} tone="coral">Priority: {s}</Badge>)}
                  </div>
                </div>
              </Card>

              <RadarChartCard title="Skill readiness by area" data={result.radar} />

              <div className="grid sm:grid-cols-2 gap-5">
                <Card>
                  <p className="text-xs font-semibold text-text-muted mb-3">MATCHED SKILLS</p>
                  <div className="flex flex-wrap gap-1.5">{result.matchedSkills.map((s) => <SkillTag key={s} tone="matched">{s}</SkillTag>)}</div>
                </Card>
                <Card>
                  <p className="text-xs font-semibold text-text-muted mb-3">MISSING SKILLS</p>
                  <div className="flex flex-wrap gap-1.5">{result.missingSkills.map((s) => <SkillTag key={s} tone="missing">{s}</SkillTag>)}</div>
                </Card>
              </div>

              <Card>
                <p className="text-xs font-semibold text-text-muted mb-3">SKILLS BY LEVEL</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[['Beginner', result.beginnerSkills, 'blue'], ['Intermediate', result.intermediateSkills, 'warning'], ['Advanced', result.advancedSkills, 'coral']].map(([label, list, tone]) => (
                    <div key={label}>
                      <Badge tone={tone}>{label}</Badge>
                      <ul className="mt-2 space-y-1.5">{list.map((s) => <li key={s} className="text-sm text-text-secondary">• {s}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <p className="text-xs font-semibold text-text-muted mb-3">IMPROVEMENT RECOMMENDATIONS</p>
                <ul className="space-y-2">
                  {(result.recommendations || []).map((recommendation) => (
                    <li key={recommendation} className="text-sm text-text-secondary">• {recommendation}</li>
                  ))}
                </ul>
                {result.evidenceSources?.length > 0 && (
                  <p className="mt-4 text-xs text-text-muted">Evidence used: {result.evidenceSources.join(', ')}</p>
                )}
              </Card>

              <div className="flex flex-wrap gap-3">
                <Button icon={Map} loading={loading} onClick={generateRoadmap}>Generate roadmap</Button>
                <Button variant="outline" icon={Mic} onClick={() => navigate('/app/interviews/setup')}>Start skill-based interview</Button>
                <Button variant="ghost" icon={Save}>Save analysis</Button>
                <Button variant="ghost" icon={Download}>Download report</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
