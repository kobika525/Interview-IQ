import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import DataTable from '../../components/common/DataTable'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Textarea from '../../components/common/Textarea'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import * as adminService from '../../services/adminService'

const emptyForm = { title: '', description: '', demandLevel: 'Medium', estimatedLearningDurationWeeks: 8 }

export default function AdminCareerRoles() {
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = () => adminService.getAdminCareerRoles().then(setRoles)
  useEffect(() => { load() }, [])
  const filtered = roles.filter((role) => (role.title || '').toLowerCase().includes(search.toLowerCase()))

  async function save() {
    const payload = {
      title: form.title,
      description: form.description || null,
      demand_level: form.demandLevel,
      estimated_learning_duration_weeks: Number(form.estimatedLearningDurationWeeks) || 8,
      experience_level: form.experienceLevel || 'BEGINNER',
    }
    if (editing) await adminService.updateAdminCareerRole(editing.id, payload)
    else await adminService.createAdminCareerRole({ ...payload, required_skills: [], recommended_skills: [] })
    await load()
    setModalOpen(false)
    toast.success(editing ? 'Career role updated' : 'Career role added')
  }

  async function remove() {
    await adminService.deleteAdminCareerRole(toDelete.id)
    setToDelete(null)
    await load()
  }

  const columns = [
    { key: 'title', header: 'Role' },
    { key: 'demandLevel', header: 'Demand', render: (role) => <Badge tone={role.demandLevel === 'High' ? 'success' : 'warning'}>{role.demandLevel}</Badge> },
    { key: 'estimatedLearningDurationWeeks', header: 'Learning duration', render: (role) => `${role.estimatedLearningDurationWeeks} weeks` },
    { key: 'status', header: 'Status', render: () => <Badge tone="success">Active</Badge> },
    { key: 'actions', header: '', render: (role) => (
      <div className="flex gap-1.5">
        <button className="btn-icon" onClick={() => { setEditing(role); setForm(role); setModalOpen(true) }} aria-label="Edit"><Pencil size={15} /></button>
        <button className="btn-icon" onClick={() => setToDelete(role)} aria-label="Delete"><Trash2 size={15} /></button>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="Career Roles" subtitle="Manage live career matching roles." actions={<Button icon={Plus} onClick={() => { setEditing(null); setForm(emptyForm); setModalOpen(true) }}>Add role</Button>} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search roles..." className="max-w-xs mb-5" />
      {filtered.length ? <DataTable columns={columns} data={filtered} /> : <EmptyState icon={Briefcase} title="No roles found" />}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit career role' : 'Add career role'}
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-4">
          <Input label="Role title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Demand level" value={form.demandLevel || ''} onChange={(e) => setForm({ ...form, demandLevel: e.target.value })} />
          <Input label="Learning duration (weeks)" type="number" value={form.estimatedLearningDurationWeeks || 8} onChange={(e) => setForm({ ...form, estimatedLearningDurationWeeks: e.target.value })} />
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove}
        title="Delete career role?" message="This role will no longer appear in career matching." confirmLabel="Delete" />
    </div>
  )
}
