import { cx } from '../../utils/helpers'

export function Skeleton({ className = '' }) {
  return <div className={cx('animate-pulse rounded-lg bg-white/[0.055]', className)} />
}

export default function SkeletonLoader({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
