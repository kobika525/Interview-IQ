import { useState } from 'react'
import { X, Plus } from 'lucide-react'

export default function MultiSelect({ label, value = [], onChange, placeholder = 'Add a skill and press Enter' }) {
  const [draft, setDraft] = useState('')

  function addTag() {
    const tag = draft.trim()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft('')
  }

  return (
    <div>
      {label && <label className="field-label">{label}</label>}
      <div className="field flex flex-wrap items-center gap-2 py-2">
        {value.map((tag) => (
          <span key={tag} className="badge bg-blue/10 text-blue">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          placeholder={value.length ? '' : placeholder}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-text-muted"
        />
        <button type="button" onClick={addTag} className="btn-icon w-7 h-7"><Plus size={14} /></button>
      </div>
    </div>
  )
}
