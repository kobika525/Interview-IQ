import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, Lock, ExternalLink, Map, Mic, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import ProgressBar from '../../components/common/ProgressBar'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as resourceService from '../../services/resourceService'
import { cx } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function LearningRoadmap() {
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState(null)
  const [tasksDone, setTasksDone] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRoadmap = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRoadmap(await resourceService.getRoadmap())
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your learning roadmap.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRoadmap() }, [loadRoadmap])

  if (loading) return <SkeletonLoader rows={5} />

  if (error) return (
    <Card className="mx-auto max-w-xl py-12 text-center">
      <RefreshCw className="mx-auto text-error" size={28} />
      <h1 className="mt-4 font-display text-xl font-bold text-text-primary">Roadmap unavailable</h1>
      <p className="mt-2 text-sm text-text-muted">{error}</p>
      <Button className="mt-5" icon={RefreshCw} onClick={loadRoadmap}>Try again</Button>
    </Card>
  )

  if (!roadmap) return (
    <Card className="mx-auto max-w-xl py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue/10 text-blue"><Map size={25} /></div>
      <h1 className="mt-5 font-display text-xl font-bold text-text-primary">Create your learning roadmap</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">Run a skill-gap analysis for your target role, then generate a personalised step-by-step learning plan.</p>
      <Button className="mt-6" onClick={() => navigate('/app/skill-gap-analysis')}>Start skill-gap analysis</Button>
    </Card>
  )

  async function toggleTask(task) {
    const currentValue = Object.hasOwn(tasksDone, task.id) ? tasksDone[task.id] : task.done
    const completed = !currentValue
    setTasksDone((state) => ({ ...state, [task.id]: completed }))
    try {
      await resourceService.setRoadmapItemCompleted(roadmap.id, task.id, completed)
      const refreshed = await resourceService.getRoadmap()
      setRoadmap(refreshed)
      setTasksDone({})
    } catch (error) {
      setTasksDone((state) => ({ ...state, [task.id]: !completed }))
      toast.error(error.message)
    }
  }

  return (
    <div>
      <PageHeader title="Learning Roadmap" subtitle={`Your personalised path to becoming a ${roadmap.targetCareer}.`} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue/10 text-blue"><Map size={22} /></div><div><p className="text-xs text-text-muted">Learning stages</p><p className="text-sm font-semibold text-text-primary">{roadmap.stages.length} stages</p></div></Card>
        <Card><p className="text-xs text-text-muted">Target career</p><p className="text-sm font-semibold text-text-primary mt-1">{roadmap.targetCareer}</p></Card>
        <Card><p className="text-xs text-text-muted">Estimated duration</p><p className="text-sm font-semibold text-text-primary mt-1">{roadmap.estimatedDuration}</p></Card>
        <Card><p className="text-xs text-text-muted mb-2">Completion</p><ProgressBar value={roadmap.completion} tone="cyan" /><p className="text-xs text-text-muted mt-1.5">{roadmap.completion}% done</p></Card>
      </div>

      <div className="relative pl-6 border-l border-border-subtle space-y-6">
        {roadmap.stages.map((stage) => (
          <div key={stage.id} className="relative">
            <span className={cx(
              'absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center',
              stage.status === 'completed' && 'bg-success border-success',
              stage.status === 'current' && 'bg-blue border-blue animate-pulse-glow',
              stage.status === 'locked' && 'bg-app-2 border-border'
            )} />
            <Card className={cx(stage.status === 'locked' && 'opacity-60')}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-semibold text-text-primary flex items-center gap-2">
                  {stage.status === 'locked' && <Lock size={14} className="text-text-muted" />}
                  {stage.title}
                </h3>
                <Badge tone={stage.status === 'completed' ? 'success' : stage.status === 'current' ? 'blue' : 'neutral'}>{stage.weekLabel}</Badge>
              </div>
              <ul className="mt-3 space-y-2">
                {stage.tasks.map((task) => {
                  const done = Object.hasOwn(tasksDone, task.id) ? tasksDone[task.id] : task.done
                  return (
                    <li key={task.id} className="flex items-center gap-2.5 text-sm">
                      <button onClick={() => stage.status !== 'locked' && toggleTask(task)} disabled={stage.status === 'locked'}>
                        {done ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} className="text-text-muted" />}
                      </button>
                      <span className={done ? 'text-text-secondary line-through decoration-text-disabled' : 'text-text-secondary'}>{task.title}</span>
                    </li>
                  )
                })}
              </ul>
              {stage.status !== 'locked' && (
                <div className="flex gap-2.5 mt-4 pt-3 border-t border-border-subtle">
                  <Button variant="outline" icon={ExternalLink} className="!text-xs !py-1.5" onClick={() => navigate(taskResourcePath(stage.tasks))}>View resources</Button>
                  <Button icon={Mic} className="!text-xs !py-1.5" onClick={() => navigate('/app/interviews/setup')}>Practice interview</Button>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}

function taskResourcePath(tasks) {
  const linked = tasks.find((task) => task.resourceId)
  return linked ? `/app/resources?resource=${linked.resourceId}` : '/app/resources'
}
