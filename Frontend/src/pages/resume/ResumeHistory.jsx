import { useEffect, useState } from 'react'
import { Download, Eye, Trash2, FileText } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import DataTable from '../../components/common/DataTable'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Pagination from '../../components/common/Pagination'
import * as resumeService from '../../services/resumeService'
import { formatDate, scoreTone } from '../../utils/formatters'

export default function ResumeHistory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState(null)
  const pageSize = 5

  useEffect(() => { resumeService.getResumeHistory().then((d) => { setItems(d); setLoading(false) }) }, [])

  const filtered = items.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  async function confirmDelete() {
    await resumeService.deleteResume(toDelete.id)
    setItems((prev) => prev.filter((i) => i.id !== toDelete.id))
    setToDelete(null)
  }

  const columns = [
    { key: 'name', header: 'Resume', render: (r) => <span className="text-text-primary font-medium">{r.name}</span> },
    { key: 'uploadedAt', header: 'Uploaded', render: (r) => formatDate(r.uploadedAt) },
    { key: 'atsScore', header: 'ATS Score', render: (r) => <Badge tone={scoreTone(r.atsScore) === 'success' ? 'success' : scoreTone(r.atsScore) === 'warning' ? 'warning' : 'error'}>{r.atsScore}</Badge> },
    { key: 'skillsFound', header: 'Skills Found', render: (r) => r.skillsFound.length },
    { key: 'missingSkills', header: 'Missing', render: (r) => r.missingSkills.length },
    { key: 'status', header: 'Status', render: (r) => <Badge tone="success">{r.status}</Badge> },
    {
      key: 'actions', header: '', render: (r) => (
        <div className="flex gap-1.5">
          <button className="btn-icon" aria-label="View"><Eye size={15} /></button>
          <button className="btn-icon" aria-label="Download"><Download size={15} /></button>
          <button className="btn-icon" aria-label="Delete" onClick={() => setToDelete(r)}><Trash2 size={15} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Resume History" subtitle="All your previous resume analyses in one place." />
      <div className="flex gap-3 mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Search resumes..." className="max-w-xs" />
      </div>

      {loading ? <SkeletonLoader rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No resumes found" message="Upload a resume to see your analysis history here." />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={pageItems}
            renderMobileCard={(r) => (
              <Card>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">{r.name}</p>
                  <Badge tone={scoreTone(r.atsScore) === 'success' ? 'success' : 'warning'}>{r.atsScore}</Badge>
                </div>
                <p className="text-xs text-text-muted mt-1">{formatDate(r.uploadedAt)} · {r.skillsFound.length} skills found</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" className="!text-xs !py-1.5 flex-1">View</Button>
                  <Button variant="ghost" className="!text-xs !py-1.5" onClick={() => setToDelete(r)}><Trash2 size={13} /></Button>
                </div>
              </Card>
            )}
          />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={confirmDelete}
        title="Delete resume analysis?" message={`This will permanently remove "${toDelete?.name}" from your history.`} confirmLabel="Delete"
      />
    </div>
  )
}
