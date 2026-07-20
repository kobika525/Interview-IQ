import { motion } from 'framer-motion'

export default function WaveformVisualizer({ active = false, bars = 24, color = 'var(--color-cyan)' }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: color }}
          animate={active ? { height: [6, 10 + ((i * 37) % 26), 6] } : { height: 6 }}
          transition={{ duration: 0.9 + (i % 5) * 0.1, repeat: active ? Infinity : 0, ease: 'easeInOut', delay: i * 0.03 }}
        />
      ))}
    </div>
  )
}
