import { useRef, useState } from 'react'
import { UploadCloud, FileText, X } from 'lucide-react'

export default function FileUpload({ file, onFile, onRemove, accept = '.pdf,.doc,.docx', maxSizeMb = 5 }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  function handleFiles(files) {
    const f = files?.[0]
    if (!f) return
    if (f.size > maxSizeMb * 1024 * 1024) {
      setError(`File must be under ${maxSizeMb}MB`)
      return
    }
    setError('')
    onFile(f)
  }

  if (file) {
    return (
      <div className="surface-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue/10 text-blue flex items-center justify-center shrink-0">
          <FileText size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
          <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <button onClick={onRemove} className="btn-icon" aria-label="Remove file"><X size={16} /></button>
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue bg-blue/5' : 'border-border hover:border-border/80'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-blue/10 text-blue flex items-center justify-center mx-auto mb-3">
          <UploadCloud size={22} />
        </div>
        <p className="text-sm font-medium text-text-primary">Drag & drop your resume here</p>
        <p className="text-xs text-text-muted mt-1">PDF or DOCX, up to {maxSizeMb}MB</p>
        <input
          ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
