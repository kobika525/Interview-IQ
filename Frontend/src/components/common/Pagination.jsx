import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cx } from '../../utils/helpers'

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button disabled={page === 1} onClick={() => onChange(page - 1)} className="btn-icon disabled:opacity-30">
        <ChevronLeft size={16} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cx(
            'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
            p === page ? 'bg-blue text-white' : 'text-text-muted hover:bg-black/[0.045]'
          )}
        >
          {p}
        </button>
      ))}
      <button disabled={page === totalPages} onClick={() => onChange(page + 1)} className="btn-icon disabled:opacity-30">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
