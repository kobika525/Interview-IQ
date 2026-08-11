import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import MultiSelect from '../../components/common/MultiSelect'
import Button from '../../components/common/Button'
import CareerCard from '../../components/career/CareerCard'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as careerService from '../../services/careerService'
import * as userService from '../../services/userService'
import * as resumeService from '../../services/resumeService'
import { STUDY_LEVELS } from '../../utils/constants'
import toast from 'react-hot-toast'

const INDUSTRIES = ['Software Product', 'Fintech', 'E-commerce', 'Healthtech', 'Consulting', 'Startups']
const WORK_STYLES = ['Remote', 'Hybrid', 'On-site']
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const displayLevel = (value) => value ? `${value.charAt(0)}${value.slice(1).toLowerCase()}` : ''

export default function CareerGuidance() {
  const [loading, setLoading] = useState(true)
  const [careers, setCareers] = useState([])
  const [skills, setSkills] = useState([])
  const [compareIds, setCompareIds] = useState([])
  const [form, setForm] = useState({ education: '', experience: '', interests: '', industry: '', workStyle: '', location: '', goals: '' })

  useEffect(() => {
    Promise.all([
      careerService.getSavedCareerMatches(), careerService.getMySkills(),
      userService.getProfile(), resumeService.getResumeHistory(),
    ])
      .then(([matches, profile, userProfile, resumes]) => {
        setCareers(matches)
        const resumeSkills = resumes[0]?.skillsFound || []
        setSkills([...new Set([...profile, ...resumeSkills])])
        setForm((current) => ({
          ...current,
          education: userProfile.degree || '',
          experience: displayLevel(userProfile.studyLevel),
          location: userProfile.location || '',
          goals: userProfile.careerGoal || '',
        }))
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [])

  async function recommend() {
    setLoading(true)
    try {
      setCareers(await careerService.getCareerRecommendations({ ...form, skills }))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleCompare(id) {
    setCompareIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 3 ? [...prev, id] : prev))
  }

  const compareCareers = careers.filter((c) => compareIds.includes(c.id))

  return (
    <div>
      <PageHeader title="Career Guidance" subtitle="Tell us about yourself to get matched roles and a roadmap." />

      <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <Card className="h-fit space-y-4 lg:sticky lg:top-24">
          <Select label="Education level" options={STUDY_LEVELS} value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} />
          <Select label="Experience level" options={EXPERIENCE_LEVELS} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
          <MultiSelect label="Current skills" value={skills} onChange={setSkills} />
          <Input label="Interests" placeholder="Backend systems, cloud infra" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
          <Select label="Preferred industry" options={INDUSTRIES} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <Select label="Preferred work style" options={WORK_STYLES} value={form.workStyle} onChange={(e) => setForm({ ...form, workStyle: e.target.value })} />
          <Input label="Target location" placeholder="e.g. Colombo, Remote" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Career goals" placeholder="e.g. Backend Engineer within 6 months" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
          <Button fullWidth loading={loading} onClick={recommend}>Get recommendations</Button>
        </Card>

        <div className="min-w-0 space-y-5">
          {compareCareers.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-text-primary text-sm">Comparing {compareCareers.length} career{compareCareers.length > 1 ? 's' : ''}</h3>
                <button onClick={() => setCompareIds([])} className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1"><X size={12} />Clear</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead><tr className="text-left text-xs text-text-muted border-b border-border-subtle">
                    <th className="py-2 pr-4">Metric</th>
                    {compareCareers.map((c) => <th key={c.id} className="py-2 pr-4 text-text-primary">{c.title}</th>)}
                  </tr></thead>
                  <tbody>
                    {[
                      ['Match score', (c) => `${c.match}%`],
                      ['Required skills', (c) => `${Math.round(c.scoreBreakdown?.requiredSkills ?? c.match)}%`],
                      ['Experience fit', (c) => `${Math.round(c.scoreBreakdown?.experience ?? c.match)}%`],
                      ['Readiness', (c) => `${c.match >= 80 ? 'High' : c.match >= 60 ? 'Medium' : 'Low'}`],
                      ['Learning duration', (c) => c.duration],
                      ['Demand', (c) => c.demand],
                    ].map(([label, fn]) => (
                      <tr key={label} className="border-b border-border-subtle last:border-0">
                        <td className="py-2.5 pr-4 text-text-muted">{label}</td>
                        {compareCareers.map((c) => <td key={c.id} className="py-2.5 pr-4 text-text-secondary">{fn(c)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {loading ? <SkeletonLoader rows={3} /> : careers.length === 0 ? (
            <Card className="py-14 text-center">
              <p className="text-sm font-medium text-text-primary">No career matches available</p>
              <p className="text-xs text-text-muted mt-1">Add your skills and preferences, then try again.</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-1 xl:grid-cols-2 gap-5">
              {careers.map((c) => (
                <CareerCard
                  key={c.id}
                  career={c}
                  compared={compareIds.includes(c.id)}
                  onToggleCompare={() => toggleCompare(c.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
