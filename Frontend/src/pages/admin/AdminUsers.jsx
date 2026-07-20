import { useEffect, useState } from 'react'
import { Eye, Pencil, Ban, CheckCircle2, Trash2, Users } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Pagination from '../../components/common/Pagination'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import EmptyState from '../../components/common/EmptyState'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as adminService from '../../services/adminService'
import { formatDate } from '../../utils/formatters'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState(null)
  const pageSize = 5

  useEffect(() => { adminService.getAdminUsers().then((d) => { setUsers(d); setLoading(false) }) }, [])

  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) && (!status || u.status === status))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  function applyAction() {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== confirmAction.user.id) return u
      if (confirmAction.type === 'activate') return { ...u, status: 'Active' }
      if (confirmAction.type === 'deactivate') return { ...u, status: 'Inactive' }
      return u
    }))
    if (confirmAction.type === 'delete') setUsers((prev) => prev.filter((u) => u.id !== confirmAction.user.id))
    setConfirmAction(null)
  }

  const columns = [
    { key: 'name', header: 'Name', render: (u) => <span className="text-text-primary font-medium">{u.name}</span> },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (u) => <Badge className="capitalize">{u.role}</Badge> },
    { key: 'registeredAt', header: 'Registered', render: (u) => formatDate(u.registeredAt) },
    { key: 'interviews', header: 'Interviews' },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.status === 'Active' ? 'success' : u.status === 'Suspended' ? 'error' : 'neutral'}>{u.status}</Badge> },
    {
      key: 'actions', header: '', render: (u) => (
        <div className="flex gap-1.5">
          <button className="btn-icon" aria-label="View"><Eye size={15} /></button>
          <button className="btn-icon" aria-label="Edit"><Pencil size={15} /></button>
          {u.status === 'Active' ? (
            <button className="btn-icon" aria-label="Deactivate" onClick={() => setConfirmAction({ type: 'deactivate', user: u })}><Ban size={15} /></button>
          ) : (
            <button className="btn-icon" aria-label="Activate" onClick={() => setConfirmAction({ type: 'activate', user: u })}><CheckCircle2 size={15} /></button>
          )}
          <button className="btn-icon" aria-label="Delete" onClick={() => setConfirmAction({ type: 'delete', user: u })}><Trash2 size={15} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="User Management" subtitle="View and manage all Interview IQ users." />
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Search users..." className="max-w-xs" />
        <Select options={['Active', 'Inactive', 'Suspended']} value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" containerClassName="w-44" />
      </div>

      {loading ? <SkeletonLoader rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <>
          <DataTable columns={columns} data={pageItems} renderMobileCard={(u) => (
            <Card>
              <div className="flex items-center justify-between"><p className="text-sm font-medium text-text-primary">{u.name}</p><Badge tone={u.status === 'Active' ? 'success' : 'neutral'}>{u.status}</Badge></div>
              <p className="text-xs text-text-muted mt-1">{u.email} · {u.interviews} interviews</p>
            </Card>
          )} />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} onConfirm={applyAction}
        title={confirmAction?.type === 'delete' ? 'Delete user?' : confirmAction?.type === 'activate' ? 'Activate user?' : 'Deactivate user?'}
        message={`This will ${confirmAction?.type} ${confirmAction?.user?.name}.`}
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete' : 'Confirm'}
      />
    </div>
  )
}
