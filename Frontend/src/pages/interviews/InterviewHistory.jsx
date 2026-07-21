import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, RotateCcw, Download, Trash2, Mic } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import * as interviewService from '../../services/interviewService'
import { INTERVIEW_MODES, DIFFICULTY_LEVELS } from '../../utils/constants'
import { formatDate, scoreTone } from '../../utils/formatters'

export default function InterviewHistory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [toDelete, setToDelete] = useState(null)

  useEffect(() => { interviewService.getInterviewHistory().then((d) => { setItems(d); setLoading(false) }) }, [])

  const filtered = items.filter((h) =>
    h.role.toLowerCase().includes(search.toLowerCase()) &&
    (!mode || h.mode === mode) &&
    (!difficulty || h.difficulty === difficulty)
  )

  const columns = [
    { key: 'role', header: 'Role', render: (r) => <span className="text-text-primary font-medium">{r.role}</span> },
    { key: 'type', header: 'Type' },
    { key: 'mode', header: 'Mode', render: (r) => <Badge tone="blue" className="capitalize">{r.mode}</Badge> },
    { key: 'difficulty', header: 'Difficulty' },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
    { key: 'duration', header: 'Duration' },
    { key: 'score', header: 'Score', render: (r) => <Badge tone={scoreTone(r.score) === 'success' ? 'success' : scoreTone(r.score) === 'warning' ? 'warning' : 'error'}>{r.score}</Badge> },
    {
      key: 'actions', header: '', render: (r) => (
        <div className="flex gap-1.5">
          <Link to={`/app/interviews/report/${r.id}`}><button className="btn-icon" aria-label="View report"><Eye size={15} /></button></Link>
          <Link to="/app/interviews/setup"><button className="btn-icon" aria-label="Retake"><RotateCcw size={15} /></button></Link>
          <button className="btn-icon" aria-label="Download"><Download size={15} /></button>
          <button className="btn-icon" aria-label="Delete" onClick={() => setToDelete(r)}><Trash2 size={15} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Interview History" subtitle="Every mock interview you've completed, in one place." />

      <div className="flex flex-wrap gap-3 mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by role..." className="max-w-xs" />
        <Select options={INTERVIEW_MODES.map((m) => ({ value: m, label: m[0].toUpperCase() + m.slice(1) }))} value={mode} onChange={(e) => setMode(e.target.value)} placeholder="All modes" containerClassName="w-40" />
        <Select options={DIFFICULTY_LEVELS} value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="All difficulties" containerClassName="w-44" />
      </div>

      {loading ? <SkeletonLoader rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon={Mic} title="No interviews found" message="Start a mock interview to build your history." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          renderMobileCard={(r) => (
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">{r.role}</p>
                <Badge tone={scoreTone(r.score) === 'success' ? 'success' : 'warning'}>{r.score}</Badge>
              </div>
              <p className="text-xs text-text-muted mt-1 capitalize">{r.type} · {r.mode} · {r.difficulty} · {formatDate(r.date)}</p>
              <div className="flex gap-2 mt-3">
                <Link to={`/app/interviews/report/${r.id}`} className="flex-1"><Button variant="outline" fullWidth className="!text-xs !py-1.5">View report</Button></Link>
                <Button variant="ghost" className="!text-xs !py-1.5" onClick={() => setToDelete(r)}><Trash2 size={13} /></Button>
              </div>
            </Card>
          )}
        />
      )}

      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={() => { setItems((p) => p.filter((i) => i.id !== toDelete.id)); setToDelete(null) }}
        title="Delete this interview?" message="This will permanently remove this interview and its report." confirmLabel="Delete" />
    </div>
  )
}
