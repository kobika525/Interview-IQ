import { Link } from 'react-router-dom'

const SIZES = { sm: 30, md: 36, lg: 48 }

/**
 * Interview IQ wordmark using the shared public brand mark.
 */
export default function Logo({ size = 'md', withText = true, to = '/', textClassName = '' }) {
  const px = SIZES[size]
  const content = (
    <div className="flex items-center gap-2.5">
      <span
        className="rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        style={{ width: px, height: px }}
      >
        <svg width={px} height={px} viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="10" width="16" height="80" rx="4" fill="#0F172A" />
          <circle cx="82" cy="50" r="34" stroke="#0F172A" strokeWidth="14" />
          <path d="M98 64 L118 84" stroke="#0F172A" strokeWidth="14" strokeLinecap="round" />
          <text x="24" y="52" fill="#0F172A" fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="15" fontWeight="700">interview</text>
        </svg>
      </span>
      {withText && (
        <span className={`font-display font-bold text-text-primary leading-none ${textClassName || (size === 'lg' ? 'text-xl' : 'text-lg')}`}>
          Interview IQ
        </span>
      )}
    </div>
  )
  return to ? <Link to={to} aria-label="Interview IQ home">{content}</Link> : content
}
