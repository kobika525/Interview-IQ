import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Switch from '../../components/common/Switch'
import Button from '../../components/common/Button'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [maintenance, setMaintenance] = useState(false)
  const [registrations, setRegistrations] = useState(true)

  return (
    <div>
      <PageHeader title="Admin Settings" subtitle="Platform-level configuration." />
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="space-y-4">
          <p className="field-label !mb-0">Platform</p>
          <Input label="Support email" defaultValue="support@interviewiq.app" />
          <Input label="Free plan resume scan limit" defaultValue="3" />
          <Button onClick={() => toast.success('Settings saved')}>Save changes</Button>
        </Card>
        <Card className="space-y-5">
          <p className="field-label !mb-0">System</p>
          <Switch label="Maintenance mode" checked={maintenance} onChange={() => setMaintenance((m) => !m)} />
          <Switch label="Allow new registrations" checked={registrations} onChange={() => setRegistrations((r) => !r)} />
        </Card>
      </div>
    </div>
  )
}
