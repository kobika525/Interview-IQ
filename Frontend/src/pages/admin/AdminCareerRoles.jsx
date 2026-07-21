import { useState } from 'react'
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import DataTable from '../../components/common/DataTable'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Textarea from '../../components/common/Textarea'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { CAREERS } from '../../data/careerData'
import { randomId } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function AdminCareerRoles() {
  const [roles, setRoles] = useState(CAREERS)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [form, setForm] = useState({ title: '', summary: '', requiredSkills: '', demand: '', duration: '' })

  const filtered = roles.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))

  function openAdd() { setEditing(null); setForm({ title: '', summary: '', requiredSkills: '', demand: '', duration: '' }); setModalOpen(true) }
  function openEdit(r) { setEditing(r); setForm({ ...r, requiredSkills: r.requiredSkills.join(', ') }); setModalOpen(true) }

  function save() {
    if (editing) {
      setRoles((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...form, requiredSkills: form.requiredSkills.split(',').map((s) => s.trim()) } : r)))
      toast.success('Career role updated')
    } else {
      setRoles((prev) => [{ id: randomId('role'), match: 0, matchedSkills: [], missingSkills: [], difficulty: 'Intermediate', ...form, requiredSkills: form.requiredSkills.split(',').map((s) => s.trim()) }, ...prev])
      toast.success('Career role added')
    }
    setModalOpen(false)
  }

  const columns = [
    { key: 'title', header: 'Role', render: (r) => <span className="text-text-primary font-medium">{r.title}</span> },
    { key: 'demand', header: 'Demand', render: (r) => <Badge tone={r.demand === 'High' ? 'success' : 'warning'}>{r.demand}</Badge> },
    { key: 'duration', header: 'Learning duration' },
    { key: 'requiredSkills', header: 'Required skills', render: (r) => r.requiredSkills.length },
    { key: 'status', header: 'Status', render: () => <Badge tone="success">Active</Badge> },
    {
      key: 'actions', header: '', render: (r) => (
        <div className="flex gap-1.5">
          <button className="btn-icon" onClick={() => openEdit(r)} aria-label="Edit"><Pencil size={15} /></button>
          <button className="btn-icon" onClick={() => setToDelete(r)} aria-label="Delete"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Career Roles" subtitle="Manage the career roles used in matching and guidance." actions={<Button icon={Plus} onClick={openAdd}>Add role</Button>} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search roles..." className="max-w-xs mb-5" />

      {filtered.length === 0 ? <EmptyState icon={Briefcase} title="No roles found" /> : (
        <DataTable columns={columns} data={filtered} renderMobileCard={(r) => (
          <Card><p className="text-sm font-medium text-text-primary">{r.title}</p><p className="text-xs text-text-muted mt-1">{r.demand} demand · {r.duration}</p></Card>
        )} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit career role' : 'Add career role'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save}>{editing ? 'Save changes' : 'Add role'}</Button></>}>
        <div className="space-y-4">
          <Input label="Role title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description" rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          <Input label="Required skills (comma-separated)" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Demand (High / Medium / Low)" value={form.demand} onChange={(e) => setForm({ ...form, demand: e.target.value })} />
            <Input label="Learning duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={() => { setRoles((p) => p.filter((r) => r.id !== toDelete.id)); setToDelete(null) }}
        title="Delete career role?" message="This role will no longer appear in career matching." confirmLabel="Delete" />
    </div>
  )
}
