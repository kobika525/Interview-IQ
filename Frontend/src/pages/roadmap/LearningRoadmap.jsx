import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Lock, ExternalLink, Mic } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import ProgressBar from '../../components/common/ProgressBar'
import CircularProgress from '../../components/common/CircularProgress'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as resourceService from '../../services/resourceService'
import { cx } from '../../utils/helpers'

export default function LearningRoadmap() {
  const [roadmap, setRoadmap] = useState(null)
  const [tasksDone, setTasksDone] = useState({})

  useEffect(() => { resourceService.getRoadmap().then(setRoadmap) }, [])

  if (!roadmap) return <SkeletonLoader rows={5} />

  function toggleTask(id) { setTasksDone((t) => ({ ...t, [id]: !t[id] })) }

  return (
    <div>
      <PageHeader title="Learning Roadmap" subtitle={`Your personalised path to becoming a ${roadmap.targetCareer}.`} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4"><CircularProgress value={roadmap.readiness} size={64} /><div><p className="text-xs text-text-muted">Readiness</p><p className="text-sm font-semibold text-text-primary">{roadmap.readiness}%</p></div></Card>
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
                  const done = task.done || tasksDone[task.id]
                  return (
                    <li key={task.id} className="flex items-center gap-2.5 text-sm">
                      <button onClick={() => stage.status !== 'locked' && toggleTask(task.id)} disabled={stage.status === 'locked'}>
                        {done ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} className="text-text-muted" />}
                      </button>
                      <span className={done ? 'text-text-secondary line-through decoration-text-disabled' : 'text-text-secondary'}>{task.title}</span>
                    </li>
                  )
                })}
              </ul>
              {stage.status !== 'locked' && (
                <div className="flex gap-2.5 mt-4 pt-3 border-t border-border-subtle">
                  <Button variant="outline" icon={ExternalLink} className="!text-xs !py-1.5">View resource</Button>
                  <Button icon={Mic} className="!text-xs !py-1.5">Practice interview</Button>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
