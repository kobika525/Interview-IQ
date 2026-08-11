import { useState } from 'react'
import { X, Plus } from 'lucide-react'

export default function MultiSelect({ label, value = [], onChange, placeholder = 'Add a skill and press Enter' }) {
  const [draft, setDraft] = useState('')

  function addTag() {
    const tag = draft.trim()
    if (!tag) return
    const alreadyAdded = value.some((item) => item.toLowerCase() === tag.toLowerCase())
    if (!alreadyAdded) onChange([...value, tag])
    setDraft('')
  }

  return (
    <div>
      {label && <label className="field-label">{label}</label>}
      <div className="rounded-xl border border-border bg-input p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors hover:bg-input-hover focus-within:border-blue focus-within:bg-input-hover focus-within:ring-2 focus-within:ring-blue/20">
        {value.length > 0 && <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <span key={tag} className="badge border border-blue/20 bg-blue/10 text-blue">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`} className="hover:text-error">
              <X size={12} />
            </button>
          </span>
        ))}
        </div>}
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!draft.trim()}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-cyan disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-text-muted">Type a skill, then press Enter or Add.</p>
    </div>
  )
}
