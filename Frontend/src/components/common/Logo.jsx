import { Link } from 'react-router-dom'

const logoMark = '/interview-iq-brand.png'

const SIZES = { sm: 30, md: 36, lg: 48 }

/**
 * Interview IQ wordmark using the shared public brand mark.
 */
export default function Logo({ size = 'md', withText = true, to = '/', textClassName = '' }) {
  const px = SIZES[size]
  const content = (
    <div className="flex items-center gap-2.5">
      <span
        className="group/logo flex shrink-0 items-center justify-center"
        style={{ width: px, height: px }}
      >
        <img
          src={logoMark}
          alt="Interview IQ logo"
          width={px}
          height={px}
          className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(182,255,59,0.22)] transition-transform duration-200 group-hover/logo:scale-105"
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
