import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { LifeBuoy, Bug, Lightbulb, MessageSquare, Search } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import SearchBar from '../../components/common/SearchBar'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'

const HELP_ARTICLES = [
  { q: 'How do I upload a resume?', a: 'Go to Resume Analyzer and drag your PDF or DOCX file into the upload area, then click Analyse Resume.' },
  { q: 'How is my interview scored?', a: 'Our AI evaluates relevance, communication, technical accuracy, and structure to produce an overall score and category breakdown.' },
  { q: 'How do I change my subscription plan?', a: 'Go to Subscription in the sidebar, or Settings → Billing, to upgrade, downgrade, or cancel.' },
  { q: 'Can I delete my account?', a: 'Yes — Settings → Privacy → Delete account. This is permanent.' },
]

const ticketSchema = z.object({
  subject: z.string().min(3, 'Subject is required'),
  category: z.string().min(1, 'Choose a category'),
  message: z.string().min(10, 'Please describe your issue in a bit more detail'),
})

const TICKETS = [
  { id: 'TCK-1042', subject: 'Video interview camera not detected', status: 'Open', date: '2026-07-15' },
  { id: 'TCK-1031', subject: 'Question about Premium billing', status: 'Resolved', date: '2026-07-02' },
]

export default function Support() {
  const [tab, setTab] = useState('help')
  const [search, setSearch] = useState('')
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(ticketSchema) })

  async function submitTicket(data) {
    await new Promise((r) => setTimeout(r, 900))
    toast.success('Support ticket submitted — we\'ll get back to you soon.')
    reset()
    setTab('tickets')
  }

  const filteredArticles = HELP_ARTICLES.filter((a) => a.q.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageHeader title="Support" subtitle="Get help, report a bug, or request a feature." />
      <Tabs
        tabs={[
          { value: 'help', label: 'Help Center' },
          { value: 'ticket', label: 'Contact Support' },
          { value: 'tickets', label: 'My Tickets' },
        ]}
        active={tab} onChange={setTab} className="mb-6"
      />

      {tab === 'help' && (
        <div>
          <SearchBar value={search} onChange={setSearch} placeholder="Search help articles..." className="max-w-md mb-5" />
          {filteredArticles.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No articles found" message="Try a different search term, or contact support directly." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredArticles.map((a) => (
                <Card key={a.q}>
                  <p className="text-sm font-medium text-text-primary">{a.q}</p>
                  <p className="text-xs text-text-muted mt-1.5">{a.a}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'ticket' && (
        <Card as="form" onSubmit={handleSubmit(submitTicket)} className="max-w-xl space-y-4">
          <Input label="Subject" error={errors.subject?.message} {...register('subject')} />
          <Select label="Category" options={['Bug report', 'Feature request', 'Billing question', 'Account issue', 'Other']} error={errors.category?.message} {...register('category')} />
          <Textarea label="Message" rows={5} placeholder="Describe the issue or request..." error={errors.message?.message} {...register('message')} />
          <div className="flex gap-2">
            <Button type="submit" loading={isSubmitting} icon={MessageSquare}>Submit ticket</Button>
            <Button type="button" variant="outline" icon={Bug}>Report a bug</Button>
            <Button type="button" variant="ghost" icon={Lightbulb}>Request a feature</Button>
          </div>
        </Card>
      )}

      {tab === 'tickets' && (
        <div className="space-y-3 max-w-2xl">
          {TICKETS.map((t) => (
            <Card key={t.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{t.subject}</p>
                <p className="text-xs text-text-muted mt-0.5">{t.id} · opened {t.date}</p>
              </div>
              <Badge tone={t.status === 'Open' ? 'warning' : 'success'}>{t.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
