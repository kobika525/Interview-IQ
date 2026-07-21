import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { CreditCard, Download, Plus, RotateCcw } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import DataTable from '../../components/common/DataTable'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import PlanBadge from '../../components/billing/PlanBadge'
import { useAuth } from '../../hooks/useAuth'
import { isPremium } from '../../utils/permissions'
import * as billingService from '../../services/billingService'
import { formatDate } from '../../utils/formatters'

export default function Billing() {
  const { user, updateUser } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [card, setCard] = useState({ number: '4242 4242 4242 4242', expiry: '12/28' })

  useEffect(() => { billingService.getInvoices().then((d) => { setInvoices(d); setLoading(false) }) }, [])

  async function cancelPlan() {
    await billingService.cancelSubscription()
    updateUser({ plan: 'free', planRenewsAt: null })
    setCancelOpen(false)
    toast.success('Subscription cancelled.')
  }

  async function reactivate() {
    const result = await billingService.subscribe({ planId: 'premium', card })
    updateUser({ plan: result.plan, planRenewsAt: result.renewsAt })
    toast.success('Subscription reactivated!')
  }

  const columns = [
    { key: 'id', header: 'Invoice' },
    { key: 'date', header: 'Date', render: (i) => formatDate(i.date) },
    { key: 'plan', header: 'Plan' },
    { key: 'amount', header: 'Amount', render: (i) => `$${i.amount}.00` },
    { key: 'status', header: 'Status', render: (i) => <Badge tone="success">{i.status}</Badge> },
    { key: 'actions', header: '', render: () => <button className="btn-icon" aria-label="Download invoice"><Download size={15} /></button> },
  ]

  return (
    <div>
      <PageHeader title="Billing" subtitle="Manage your payment method and view invoice history." />

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="field-label !mb-0">Billing profile</p>
            <PlanBadge plan={user?.plan} />
          </div>
          <p className="text-sm text-text-secondary">{user?.fullName}</p>
          <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
          {user?.planRenewsAt && <p className="text-xs text-text-muted mt-2">Renews on {formatDate(user.planRenewsAt)}</p>}
          <div className="flex gap-2 mt-4">
            {isPremium(user) ? (
              <Button variant="outline" className="!text-xs !py-2" onClick={() => setCancelOpen(true)}>Cancel plan</Button>
            ) : (
              <Button icon={RotateCcw} className="!text-xs !py-2" onClick={reactivate}>Reactivate Premium (demo)</Button>
            )}
          </div>
        </Card>

        <Card>
          <p className="field-label mb-3">Payment method</p>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.035] border border-border-subtle">
            <CreditCard size={20} className="text-blue" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary">•••• •••• •••• {card.number.slice(-4)}</p>
              <p className="text-xs text-text-muted">Expires {card.expiry}</p>
            </div>
          </div>
          <Button variant="outline" icon={Plus} className="!text-xs !py-2 mt-3" onClick={() => setModalOpen(true)}>Add payment method</Button>
        </Card>
      </div>

      <h3 className="font-display font-semibold text-text-primary mb-3">Invoice history</h3>
      {loading ? <SkeletonLoader rows={3} /> : (
        <DataTable columns={columns} data={invoices} renderMobileCard={(i) => (
          <Card>
            <div className="flex justify-between"><p className="text-sm text-text-primary">{i.id}</p><Badge tone="success">{i.status}</Badge></div>
            <p className="text-xs text-text-muted mt-1">{formatDate(i.date)} · {i.plan} · ${i.amount}.00</p>
          </Card>
        )} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add payment method" size="sm"
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={() => { setModalOpen(false); toast.success('Payment method updated (demo)') }}>Save card</Button></>}>
        <div className="space-y-4">
          <Input label="Card number" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
          <Input label="Expiry (MM/YY)" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={cancelPlan}
        title="Cancel subscription?" message="You'll move to the Free plan at the end of your billing period." confirmLabel="Cancel plan" />
    </div>
  )
}
