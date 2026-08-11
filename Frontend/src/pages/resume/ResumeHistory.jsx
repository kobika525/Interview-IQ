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
import Modal from '../../components/common/Modal'
import * as resumeService from '../../services/resumeService'
import { formatDate, scoreTone } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function ResumeHistory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState(null)
  const [selected, setSelected] = useState(null)
  const pageSize = 5

  useEffect(() => {
    resumeService.getResumeHistory()
      .then(setItems)
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  async function confirmDelete() {
    try {
      await resumeService.deleteResume(toDelete.id)
      setItems((prev) => prev.filter((i) => i.id !== toDelete.id))
      setToDelete(null)
      toast.success('Resume deleted')
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function viewResume(resume) {
    try {
      const analysis = resume.analysis || await resumeService.getResumeAnalysis(resume.id)
      setSelected({ ...resume, analysis })
    } catch (error) {
      toast.error(error.message)
    }
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
          <button className="btn-icon" aria-label="View" onClick={() => viewResume(r)}><Eye size={15} /></button>
          <button className="btn-icon" aria-label="Download" onClick={() => resumeService.downloadResume(r.id, r.name).catch((error) => toast.error(error.message))}><Download size={15} /></button>
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
                  <Button variant="outline" className="!text-xs !py-1.5 flex-1" onClick={() => viewResume(r)}>View</Button>
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
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name || 'Resume analysis'}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card><p className="text-xs text-text-muted">ATS score</p><p className="text-2xl font-bold text-text-primary mt-1">{selected.atsScore}/100</p></Card>
              <Card><p className="text-xs text-text-muted">Status</p><Badge tone="success" className="mt-2">{selected.status}</Badge></Card>
            </div>
            <div>
              <p className="field-label">Strengths</p>
              <ul className="text-sm text-text-secondary space-y-1">{(selected.analysis?.strengths || []).map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
            <div>
              <p className="field-label">Suggestions</p>
              <ul className="text-sm text-text-secondary space-y-1">{(selected.analysis?.suggestions || []).map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
            <Button icon={Download} fullWidth onClick={() => resumeService.downloadResume(selected.id, selected.name)}>Download original resume</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
