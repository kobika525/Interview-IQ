import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, BookOpen, Send, Archive } from 'lucide-react'
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
import toast from 'react-hot-toast'

const TYPES = ['Course', 'Article', 'Video', 'Documentation', 'Coding Exercise', 'Interview Questions', 'Certification']
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

export default function AdminResources() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [publishingId, setPublishingId] = useState(null)
  const [form, setForm] = useState({ name: '', skill: '', type: '', url: '', difficulty: '', description: '', duration: '' })

  useEffect(() => {
    adminService.getAdminResources()
      .then(setItems)
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [])
  const filtered = items.filter((r) => (r.name || '').toLowerCase().includes(search.toLowerCase()))

  function openAdd() { setEditing(null); setForm({ name: '', skill: '', type: '', url: '', difficulty: '', description: '', duration: '' }); setModalOpen(true) }
  function openEdit(r) { setEditing(r); setForm(r); setModalOpen(true) }

  async function save() {
    try {
      if (editing) {
        const updated = await adminService.updateAdminResource(editing.id, form)
        setItems((prev) => prev.map((resource) => resource.id === updated.id ? updated : resource))
        toast.success('Resource updated')
      } else {
        const created = await adminService.createAdminResource(form)
        setItems((prev) => [created, ...prev])
        toast.success('Resource added as draft')
      }
      setModalOpen(false)
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function togglePublished(resource) {
    const publish = resource.status !== 'Published'
    setPublishingId(resource.id)
    try {
      const updated = await adminService.setAdminResourcePublished(resource.id, publish)
      setItems((prev) => prev.map((item) => item.id === updated.id ? updated : item))
      toast.success(publish ? 'Resource published' : 'Resource moved to draft')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setPublishingId(null)
    }
  }

  async function deleteResource() {
    try {
      await adminService.deleteAdminResource(toDelete.id)
      setItems((prev) => prev.filter((item) => item.id !== toDelete.id))
      setToDelete(null)
      toast.success('Resource deleted')
    } catch (error) {
      toast.error(error.message)
    }
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
          <button disabled={publishingId === r.id} className="btn-icon disabled:cursor-wait disabled:opacity-50" onClick={() => togglePublished(r)} aria-label={r.status === 'Published' ? 'Unpublish' : 'Publish'} title={r.status === 'Published' ? 'Move to draft' : 'Publish resource'}>
            {r.status === 'Published' ? <Archive size={15} /> : <Send size={15} />}
          </button>
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
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-text-primary">{r.name}</p>
              <Badge tone={r.status === 'Published' ? 'success' : 'neutral'}>{r.status}</Badge>
            </div>
            <p className="text-xs text-text-muted mt-1">{r.skill} · {r.type} · {r.duration}</p>
            <div className="flex gap-2 mt-3">
              <Button loading={publishingId === r.id} variant="outline" className="!text-xs !py-1.5 flex-1" onClick={() => togglePublished(r)}>
                {r.status === 'Published' ? 'Move to draft' : 'Publish'}
              </Button>
              <Button variant="ghost" className="!text-xs !py-1.5" onClick={() => openEdit(r)}>Edit</Button>
            </div>
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

      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={deleteResource}
        title="Delete resource?" message="This resource will no longer be shown to users." confirmLabel="Delete" />
    </div>
  )
}
