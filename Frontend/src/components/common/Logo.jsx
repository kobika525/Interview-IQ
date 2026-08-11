import { Link } from 'react-router-dom'

const logoMark = '/interview-iq-logo.jpg'

const SIZES = { sm: 30, md: 36, lg: 48 }

/**
 * Interview IQ wordmark using the shared public brand mark.
 */
export default function Logo({ size = 'md', withText = true, to = '/', textClassName = '' }) {
  const px = SIZES[size]
  const content = (
    <div className="flex items-center gap-2.5">
      <span
        className="rounded-lg bg-[#101110] flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_0_1px_rgba(214,178,91,0.24)]"
        style={{ width: Math.round(px * 1.45), height: px }}
      >
        <img
          src={logoMark}
          alt="Interview IQ logo"
          width={Math.round(px * 1.45)}
          height={px}
          className="w-full h-full object-cover"
        />
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
