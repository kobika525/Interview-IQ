import { Link } from 'react-router-dom'
import logoMark from '../../assets/vite.svg'

const SIZES = { sm: 30, md: 36, lg: 48 }

/**
 * Interview IQ wordmark. The source logo is a black mark on a white
 * background (no transparency), so on dark surfaces it's placed inside a
 * light rounded chip per brand guidelines, rather than being altered.
 */
export default function Logo({ size = 'md', withText = true, to = '/', textClassName = '' }) {
  const px = SIZES[size]
  const content = (
    <div className="flex items-center gap-2.5">
      <span
        className="rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        style={{ width: px, height: px }}
      >
        <img src={logoMark} alt="Interview IQ logo" width={px} height={px} className="object-contain" />
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
