import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, HelpCircle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Textarea from '../../components/common/Textarea'
import EmptyState from '../../components/common/EmptyState'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import * as adminService from '../../services/adminService'
import toast from 'react-hot-toast'

const EMPTY_FORM = { question: '', careerRoleId: '', category: '', type: 'TECHNICAL', topic: '', difficulty: 'BEGINNER', expectedKeywords: '', modelAnswer: '', isActive: true }
const INTERVIEW_TYPE_OPTIONS = ['TECHNICAL', 'HR', 'BEHAVIORAL', 'MIXED']
const DIFFICULTY_OPTIONS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

export default function AdminQuestions() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [roles, setRoles] = useState([])
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [questions, careerRoles] = await Promise.all([
        adminService.getAdminQuestions(),
        adminService.getAdminCareerRoles(),
      ])
      setItems(questions)
      setRoles(careerRoles)
    } catch (error) {
      toast.error(error.message || 'Unable to load the question bank.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = items.filter((q) => (q.question || '').toLowerCase().includes(search.toLowerCase()))

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true) }
  function openEdit(q) {
    setEditing(q)
    setForm({
      question: q.question,
      careerRoleId: q.careerRoleId || '',
      category: q.category || '',
      type: q.type || 'TECHNICAL',
      topic: q.topic || '',
      difficulty: q.difficulty || 'BEGINNER',
      expectedKeywords: (q.expectedKeywords || []).join(', '),
      modelAnswer: q.modelAnswer || '',
      isActive: q.isActive,
    })
    setModalOpen(true)
  }

  async function save() {
    if (!form.question.trim() || !form.topic.trim() || !form.category.trim()) {
      toast.error('Question, topic, and category are required.')
      return
    }
    const payload = {
      questionText: form.question.trim(),
      careerRoleId: form.careerRoleId ? Number(form.careerRoleId) : null,
      topic: form.topic.trim(),
      category: form.category.trim(),
      difficulty: form.difficulty,
      interviewType: form.type,
      expectedKeywords: form.expectedKeywords.split(',').map((item) => item.trim()).filter(Boolean),
      sampleAnswer: form.modelAnswer.trim() || null,
      isActive: form.isActive,
    }
    setSaving(true)
    try {
      if (editing) await adminService.updateAdminQuestion(editing.id, payload)
      else await adminService.createAdminQuestion(payload)
      await load()
      setModalOpen(false)
      toast.success(editing ? 'Question updated' : 'Question added')
    } catch (error) {
      toast.error(error.message || 'Unable to save the question.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    try {
      await adminService.deleteAdminQuestion(toDelete.id)
      setItems((previous) => previous.filter((item) => item.id !== toDelete.id))
      setToDelete(null)
      toast.success('Question deleted')
    } catch (error) {
      toast.error(error.message || 'Unable to delete the question.')
    }
  }

  const columns = [
    { key: 'question', header: 'Question', render: (q) => <span className="text-text-primary">{q.question.slice(0, 60)}{q.question.length > 60 ? '…' : ''}</span> },
    { key: 'role', header: 'Role' },
    { key: 'type', header: 'Type' },
    { key: 'topic', header: 'Topic' },
    { key: 'difficulty', header: 'Difficulty' },
    { key: 'status', header: 'Status', render: (q) => <Badge tone={q.status === 'Active' ? 'success' : 'neutral'}>{q.status}</Badge> },
    {
      key: 'actions', header: '', render: (q) => (
        <div className="flex gap-1.5">
          <button className="btn-icon" onClick={() => openEdit(q)} aria-label="Edit"><Pencil size={15} /></button>
          <button className="btn-icon" onClick={() => setToDelete(q)} aria-label="Delete"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Question Management" subtitle="Manage the interview question bank." actions={<Button icon={Plus} onClick={openAdd}>Add question</Button>} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search questions..." className="max-w-xs mb-5" />

      {loading ? <SkeletonLoader rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No questions found" />
      ) : (
        <DataTable columns={columns} data={filtered} renderMobileCard={(q) => (
          <Card>
            <p className="text-sm text-text-primary">{q.question}</p>
            <p className="text-xs text-text-muted mt-1">{q.role} · {q.type} · {q.difficulty}</p>
          </Card>
        )} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit question' : 'Add question'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button loading={saving} onClick={save}>{editing ? 'Save changes' : 'Add question'}</Button></>}>
        <div className="space-y-4">
          <Textarea label="Question text" rows={3} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Job role" placeholder="All roles" options={roles.map((role) => ({ value: role.id, label: role.title }))} value={form.careerRoleId} onChange={(e) => setForm({ ...form, careerRoleId: e.target.value })} />
            <Select label="Interview type" options={INTERVIEW_TYPE_OPTIONS} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
            <Select label="Difficulty" options={DIFFICULTY_OPTIONS} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />
          </div>
          <Input label="Category" placeholder="e.g. Backend, Frontend, Behavioural" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label="Expected keywords (comma-separated)" value={form.expectedKeywords} onChange={(e) => setForm({ ...form, expectedKeywords: e.target.value })} />
          <Textarea label="Model answer" rows={3} value={form.modelAnswer} onChange={(e) => setForm({ ...form, modelAnswer: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove}
        title="Delete question?" message="This question will be permanently removed from the bank." confirmLabel="Delete" />
    </div>
  )
}
