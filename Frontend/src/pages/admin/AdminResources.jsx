import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, BookOpen } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import DataTable from '../../components/common/DataTable'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import EmptyState from '../../components/common/EmptyState'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import * as adminService from '../../services/adminService'
import { randomId } from '../../utils/helpers'
import toast from 'react-hot-toast'

const TYPES = ['Course', 'Article', 'Video', 'Documentation', 'Coding Exercise', 'Interview Questions']
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

export default function AdminResources() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [form, setForm] = useState({ name: '', skill: '', type: '', url: '', difficulty: '', description: '', duration: '' })

  useEffect(() => { adminService.getAdminResources().then((d) => { setItems(d); setLoading(false) }) }, [])
  const filtered = items.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))

  function openAdd() { setEditing(null); setForm({ name: '', skill: '', type: '', url: '', difficulty: '', description: '', duration: '' }); setModalOpen(true) }
  function openEdit(r) { setEditing(r); setForm(r); setModalOpen(true) }

  function save() {
    if (editing) {
      setItems((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...form } : r)))
      toast.success('Resource updated')
    } else {
      setItems((prev) => [{ id: randomId('ar'), status: 'Draft', ...form }, ...prev])
      toast.success('Resource added')
    }
    setModalOpen(false)
  }

  const columns = [
    { key: 'name', header: 'Name', render: (r) => <span className="text-text-primary font-medium">{r.name}</span> },
    { key: 'skill', header: 'Skill' },
    { key: 'type', header: 'Type' },
    { key: 'duration', header: 'Duration' },
    { key: 'difficulty', header: 'Difficulty' },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'Published' ? 'success' : 'neutral'}>{r.status}</Badge> },
    {
      key: 'actions', header: '', render: (r) => (
        <div className="flex gap-1.5">
          <button className="btn-icon" aria-label="Preview"><ExternalLink size={15} /></button>
          <button className="btn-icon" onClick={() => openEdit(r)} aria-label="Edit"><Pencil size={15} /></button>
          <button className="btn-icon" onClick={() => setToDelete(r)} aria-label="Delete"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Resource Management" subtitle="Manage learning resources shown to users." actions={<Button icon={Plus} onClick={openAdd}>Add resource</Button>} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search resources..." className="max-w-xs mb-5" />

      {loading ? <SkeletonLoader rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No resources found" />
      ) : (
        <DataTable columns={columns} data={filtered} renderMobileCard={(r) => (
          <Card>
            <p className="text-sm font-medium text-text-primary">{r.name}</p>
            <p className="text-xs text-text-muted mt-1">{r.skill} · {r.type} · {r.duration}</p>
          </Card>
        )} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit resource' : 'Add resource'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save}>{editing ? 'Save changes' : 'Add resource'}</Button></>}>
        <div className="space-y-4">
          <Input label="Resource name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Skill" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} />
            <Select label="Type" options={TYPES} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          </div>
          <Input label="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Difficulty" options={DIFFICULTIES} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />
            <Input label="Estimated duration" placeholder="e.g. 4h" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={() => { setItems((p) => p.filter((i) => i.id !== toDelete.id)); setToDelete(null) }}
        title="Delete resource?" message="This resource will no longer be shown to users." confirmLabel="Delete" />
    </div>
  )
}
