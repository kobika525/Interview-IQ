import { CheckCircle2, XCircle } from 'lucide-react'

const LABELS = { contact: 'Contact information', experience: 'Experience section', education: 'Education section', skills: 'Skills section', projects: 'Projects section', summary: 'Professional summary' }

export default function ResumeSectionCheck({ sections }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2.5">
      {Object.entries(sections).map(([key, present]) => (
        <div key={key} className="flex items-center gap-2.5 text-sm">
          {present ? <CheckCircle2 size={16} className="text-success shrink-0" /> : <XCircle size={16} className="text-error shrink-0" />}
          <span className={present ? 'text-text-secondary' : 'text-text-muted'}>{LABELS[key] || key}</span>
        </div>
      ))}
    </div>
  )
}
