import { useState } from 'react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import Tabs from '../../components/common/Tabs'
import Card from '../../components/common/Card'
import Select from '../../components/common/Select'
import Switch from '../../components/common/Switch'
import Input from '../../components/common/Input'
import PasswordInput from '../../components/common/PasswordInput'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { DIFFICULTY_LEVELS } from '../../utils/constants'

const TABS = [
  { value: 'general', label: 'General' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'security', label: 'Security' },
  { value: 'privacy', label: 'Privacy' },
  { value: 'appearance', label: 'Appearance' },
]

export default function Settings() {
  const [tab, setTab] = useState('general')
  const [notif, setNotif] = useState({ email: true, interviewReminders: true, resumeNotifications: true, progressNotifications: false })
  const [privacy, setPrivacy] = useState({ resumeVisible: false, historyVisible: true })
  const [appearance, setAppearance] = useState({ darkMode: true, compact: false, reducedMotion: false })
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account preferences." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'general' && (
        <Card className="max-w-xl space-y-4">
          <Select label="Language" options={['English', 'Sinhala', 'Tamil']} defaultValue="English" />
          <Input label="Time zone" placeholder="Asia/Colombo (GMT+5:30)" />
          <Select label="Default interview difficulty" options={DIFFICULTY_LEVELS} />
          <Button onClick={() => toast.success('Preferences saved')}>Save changes</Button>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card className="max-w-xl space-y-5">
          <Switch label="Email notifications" checked={notif.email} onChange={() => setNotif((n) => ({ ...n, email: !n.email }))} />
          <Switch label="Interview reminders" checked={notif.interviewReminders} onChange={() => setNotif((n) => ({ ...n, interviewReminders: !n.interviewReminders }))} />
          <Switch label="Resume notifications" checked={notif.resumeNotifications} onChange={() => setNotif((n) => ({ ...n, resumeNotifications: !n.resumeNotifications }))} />
          <Switch label="Progress notifications" checked={notif.progressNotifications} onChange={() => setNotif((n) => ({ ...n, progressNotifications: !n.progressNotifications }))} />
          <Button onClick={() => toast.success('Notification preferences saved')}>Save changes</Button>
        </Card>
      )}

      {tab === 'security' && (
        <Card className="max-w-xl space-y-4">
          <PasswordInput label="Current password" />
          <PasswordInput label="New password" />
          <PasswordInput label="Confirm new password" />
          <Button onClick={() => toast.success('Password updated')}>Change password</Button>
          <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
            <div><p className="text-sm text-text-primary font-medium">Two-factor authentication</p><p className="text-xs text-text-muted mt-0.5">Add an extra layer of security to your account.</p></div>
            <Button variant="outline" className="!text-xs !py-2">Enable</Button>
          </div>
          <div className="pt-4 border-t border-border-subtle">
            <p className="text-sm text-text-primary font-medium">Active sessions</p>
            <p className="text-xs text-text-muted mt-0.5">Chrome on Windows · Colombo, LK · Current session</p>
          </div>
        </Card>
      )}

      {tab === 'privacy' && (
        <Card className="max-w-xl space-y-5">
          <Switch label="Make resume visible to recruiters" checked={privacy.resumeVisible} onChange={() => setPrivacy((p) => ({ ...p, resumeVisible: !p.resumeVisible }))} />
          <Switch label="Make interview history visible to recruiters" checked={privacy.historyVisible} onChange={() => setPrivacy((p) => ({ ...p, historyVisible: !p.historyVisible }))} />
          <div className="pt-4 border-t border-border-subtle">
            <p className="text-sm font-medium text-error">Delete account</p>
            <p className="text-xs text-text-muted mt-0.5 mb-3">This permanently removes all your data, including resumes and interview history.</p>
            <Button variant="outline" className="!text-error !border-error/40" onClick={() => setDeleteOpen(true)}>Delete my account</Button>
          </div>
        </Card>
      )}

      {tab === 'appearance' && (
        <Card className="max-w-xl space-y-5">
          <Switch label="Dark mode" checked={appearance.darkMode} onChange={() => setAppearance((a) => ({ ...a, darkMode: !a.darkMode }))} />
          <Switch label="Compact mode" checked={appearance.compact} onChange={() => setAppearance((a) => ({ ...a, compact: !a.compact }))} />
          <Switch label="Reduced motion" checked={appearance.reducedMotion} onChange={() => setAppearance((a) => ({ ...a, reducedMotion: !a.reducedMotion }))} />
          <p className="text-xs text-text-muted">Interview IQ is designed dark-mode-first for a focused, premium interview-prep experience.</p>
        </Card>
      )}

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => { setDeleteOpen(false); toast.success('Account deletion requested') }}
        title="Delete your account?" message="This action is permanent and cannot be undone." confirmLabel="Delete account" />
    </div>
  )
}
