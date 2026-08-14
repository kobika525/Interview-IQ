import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FileText, Mic, Video } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import ProgressBar from '../../components/common/ProgressBar'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import PlanBadge from '../../components/billing/PlanBadge'
import PricingCard from '../../components/billing/PricingCard'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import { useAuth } from '../../hooks/useAuth'
import { isPremium, canUseVideoInterview } from '../../utils/permissions'
import { FREE_RESUME_SCAN_LIMIT } from '../../utils/constants'
import * as billingService from '../../services/billingService'
import { formatDate } from '../../utils/formatters'
import { cx } from '../../utils/helpers'

export default function Subscription() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [billingCycle, setBillingCycle] = useState('month')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => { billingService.getPlans().then(setPlans) }, [])

  const scansUsed = user?.usage?.resumeScansThisMonth ?? 0
  const interviewsUsed = user?.usage?.interviewsThisMonth ?? 0
  const premium = isPremium(user)

  async function cancel() {
    setCancelling(true)
    await billingService.cancelSubscription()
    updateUser({ plan: 'free', planRenewsAt: null })
    setCancelling(false)
    setCancelOpen(false)
    toast.success('Subscription cancelled — you\'re back on the Free plan.')
  }

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Your current plan and usage this month." />

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted">Current plan</p>
            <div className="mt-1"><PlanBadge plan={user?.plan} /></div>
            {user?.planRenewsAt && <p className="text-xs text-text-muted mt-2">Renews {formatDate(user.planRenewsAt)}</p>}
          </div>
          {!premium ? (
            <Button className="!text-xs !py-2" onClick={() => navigate('/pricing')}>Upgrade</Button>
          ) : (
            <Button variant="outline" className="!text-xs !py-2" onClick={() => setCancelOpen(true)}>Cancel</Button>
          )}
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2 text-text-secondary text-xs"><FileText size={14} />Resume scans this month</div>
          <ProgressBar value={premium ? 100 : Math.min(100, (scansUsed / FREE_RESUME_SCAN_LIMIT) * 100)} tone={premium ? 'success' : 'blue'} />
          <p className="text-xs text-text-muted mt-1.5">{premium ? 'Unlimited on your plan' : `${scansUsed} of ${FREE_RESUME_SCAN_LIMIT} used`}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2 text-text-secondary text-xs"><Mic size={14} />Interviews this month</div>
          <ProgressBar value={Math.min(100, (interviewsUsed / 10) * 100)} tone="cyan" />
          <p className="text-xs text-text-muted mt-1.5">{interviewsUsed} completed</p>
        </Card>
      </div>

      <Card className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Video size={20} className={canUseVideoInterview(user) ? 'text-success' : 'text-text-muted'} />
          <div>
            <p className="text-sm font-medium text-text-primary">Video interviews</p>
            <p className="text-xs text-text-muted">{canUseVideoInterview(user) ? 'Unlocked on your plan' : 'Available on Premium and Pro'}</p>
          </div>
        </div>
        {!canUseVideoInterview(user) && <Button variant="outline" className="!text-xs !py-2" onClick={() => navigate('/pricing')}>Unlock</Button>}
      </Card>

      <div className="mb-8 mt-10 text-center">
        <h3 className="font-display text-2xl font-bold text-text-primary">Choose the plan that fits you</h3>
        <p className="mt-2 text-sm text-text-muted">Upgrade your preparation with more practice, analysis, and guidance.</p>

        <div className="mt-6 inline-flex flex-col items-center">
          <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle('month')}
              className={cx('rounded-full px-5 py-2 font-semibold transition-colors', billingCycle === 'month' ? 'bg-button-green text-black' : 'text-text-muted hover:text-text-primary')}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('year')}
              className={cx('rounded-full px-5 py-2 font-semibold transition-colors', billingCycle === 'year' ? 'bg-button-green text-black' : 'text-text-muted hover:text-text-primary')}
            >
              Annually
            </button>
          </div>
          <p className="mt-2 text-[11px] text-text-muted">Annually you save two months free <span className="text-button-green">●</span></p>
        </div>
      </div>
      {plans.length === 0 ? <SkeletonLoader rows={2} /> : (
        <div className="mx-auto grid max-w-6xl items-stretch gap-6 md:grid-cols-3 lg:gap-8">
          {plans.map((p) => (
            <PricingCard
              key={p.id}
              plan={p}
              currentPlan={user?.plan}
              billingCycle={billingCycle}
              layout="subscription"
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={cancel}
        title="Cancel your subscription?" message="You'll lose access to unlimited scans and video interviews at the end of your billing period."
        confirmLabel={cancelling ? 'Cancelling...' : 'Cancel subscription'}
      />
    </div>
  )
}
