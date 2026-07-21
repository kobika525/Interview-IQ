import { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as interviewService from '../../services/interviewService'
import { formatDate, scoreTone } from '../../utils/formatters'

export default function AdminInterviews() {
  const [items, setItems] = useState([])
  useEffect(() => { interviewService.getInterviewHistory().then(setItems) }, [])
  if (!items.length) return <SkeletonLoader rows={4} />

  const columns = [
    { key: 'role', header: 'Role', render: (r) => <span className="text-text-primary font-medium">{r.role}</span> },
    { key: 'mode', header: 'Mode', render: (r) => <Badge tone="blue" className="capitalize">{r.mode}</Badge> },
    { key: 'difficulty', header: 'Difficulty' },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
    { key: 'score', header: 'Score', render: (r) => <Badge tone={scoreTone(r.score) === 'success' ? 'success' : 'warning'}>{r.score}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Interview Oversight" subtitle="Monitor mock interviews across the platform." />
      <DataTable columns={columns} data={items} renderMobileCard={(r) => (
        <Card><p className="text-sm text-text-primary">{r.role}</p><p className="text-xs text-text-muted mt-1">{r.mode} · {formatDate(r.date)} · Score {r.score}</p></Card>
      )} />
    </div>
  )
}
