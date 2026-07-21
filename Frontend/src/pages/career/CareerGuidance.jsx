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
import { JOB_ROLES, STUDY_LEVELS } from '../../utils/constants'

const INDUSTRIES = ['Software Product', 'Fintech', 'E-commerce', 'Healthtech', 'Consulting', 'Startups']
const WORK_STYLES = ['Remote', 'Hybrid', 'On-site']

export default function CareerGuidance() {
  const [loading, setLoading] = useState(true)
  const [careers, setCareers] = useState([])
  const [skills, setSkills] = useState(['JavaScript', 'React', 'SQL'])
  const [compareIds, setCompareIds] = useState([])
  const [form, setForm] = useState({ education: '', interests: '', industry: '', workStyle: '', goals: '' })

  useEffect(() => { careerService.getCareerRecommendations({}).then((d) => { setCareers(d); setLoading(false) }) }, [])

  function toggleCompare(id) {
    setCompareIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 3 ? [...prev, id] : prev))
  }

  const compareCareers = careers.filter((c) => compareIds.includes(c.id))

  return (
    <div>
      <PageHeader title="Career Guidance" subtitle="Tell us about yourself to get matched roles and a roadmap." />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1 h-fit space-y-4">
          <Select label="Education level" options={STUDY_LEVELS} value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} />
          <MultiSelect label="Current skills" value={skills} onChange={setSkills} />
          <Input label="Interests" placeholder="Backend systems, cloud infra" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
          <Select label="Preferred industry" options={INDUSTRIES} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <Select label="Preferred work style" options={WORK_STYLES} value={form.workStyle} onChange={(e) => setForm({ ...form, workStyle: e.target.value })} />
          <Input label="Target location" placeholder="e.g. Colombo, Remote" />
          <Input label="Career goals" placeholder="e.g. Backend Engineer within 6 months" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
          <Button fullWidth onClick={() => careerService.getCareerRecommendations(form).then(setCareers)}>Get recommendations</Button>
        </Card>

        <div className="lg:col-span-2 space-y-5">
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

          {loading ? <SkeletonLoader rows={3} /> : (
            <div className="grid sm:grid-cols-1 xl:grid-cols-2 gap-5">
              {careers.map((c) => (
                <div key={c.id} className="relative">
                  <label className="absolute top-5 right-5 z-10 flex items-center gap-1.5 text-[11px] text-text-muted cursor-pointer">
                    <input type="checkbox" checked={compareIds.includes(c.id)} onChange={() => toggleCompare(c.id)} className="accent-blue" />
                    Compare
                  </label>
                  <CareerCard career={c} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
