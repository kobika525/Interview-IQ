import { Sparkles, Target, Users, Rocket } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'

const VALUES = [
  { icon: Target, title: 'Purposeful practice', desc: 'Every mock interview mirrors the structure and pressure of a real one.' },
  { icon: Users, title: 'Built for job seekers', desc: 'Designed around the real needs of students and early-career developers.' },
  { icon: Rocket, title: 'Constant improvement', desc: 'Your progress data shapes a roadmap that keeps evolving with you.' },
]

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-16">
      <Badge tone="blue"><Sparkles size={12} />About Interview IQ</Badge>
      <h1 className="font-display font-bold text-3xl md:text-4xl text-text-primary mt-4">Helping job seekers walk in ready</h1>
      <p className="text-text-secondary mt-4 max-w-2xl leading-relaxed">
        Interview IQ was built as a final-year software project with a simple goal: give students and job seekers a realistic,
        low-pressure way to practise interviews before the ones that actually count. It combines resume analysis,
        career guidance, and AI-driven mock interviews into a single, connected preparation platform.
      </p>
      <div className="grid md:grid-cols-3 gap-5 mt-12">
        {VALUES.map((v) => (
          <Card key={v.title}>
            <div className="w-11 h-11 rounded-xl bg-blue/10 text-blue flex items-center justify-center"><v.icon size={20} /></div>
            <h3 className="font-display font-semibold text-text-primary mt-4">{v.title}</h3>
            <p className="text-sm text-text-muted mt-1.5">{v.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
