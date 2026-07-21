import { useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, MapPin, Phone } from 'lucide-react'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'

export default function Contact() {
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Message sent — we will get back to you soon.')
      e.target.reset()
    }, 900)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-16">
      <Badge tone="blue">Contact</Badge>
      <h1 className="font-display font-bold text-3xl md:text-4xl text-text-primary mt-4">Get in touch</h1>
      <div className="grid md:grid-cols-2 gap-8 mt-10">
        <Card as="form" onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" name="name" placeholder="Your name" required />
          <Input label="Email" name="email" type="email" placeholder="you@email.com" required />
          <Textarea label="Message" name="message" rows={5} placeholder="How can we help?" required />
          <Button type="submit" loading={loading} fullWidth>Send message</Button>
        </Card>
        <div className="space-y-4">
          <Card className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue/10 text-blue flex items-center justify-center"><Mail size={18} /></div>
            <div><p className="text-sm font-medium text-text-primary">Email</p><p className="text-sm text-text-muted">support@interviewiq.app</p></div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue/10 text-blue flex items-center justify-center"><Phone size={18} /></div>
            <div><p className="text-sm font-medium text-text-primary">Phone</p><p className="text-sm text-text-muted">+94 11 234 5678</p></div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue/10 text-blue flex items-center justify-center"><MapPin size={18} /></div>
            <div><p className="text-sm font-medium text-text-primary">Location</p><p className="text-sm text-text-muted">Colombo, Sri Lanka</p></div>
          </Card>
        </div>
      </div>
    </div>
  )
}
