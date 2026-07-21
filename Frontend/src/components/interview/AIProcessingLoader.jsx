import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export default function AIProcessingLoader({ steps, activeIndex }) {
  return (
    <div className="max-w-sm mx-auto">
      <div className="relative w-32 h-32 mx-auto mb-8">
        <motion.div
          animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan border-r-blue"
        />
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-blue/20 to-cyan/20 animate-pulse-glow" />
      </div>
      <ul className="space-y-3">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-3">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                i < activeIndex ? 'bg-success text-white' : i === activeIndex ? 'bg-blue text-white animate-pulse' : 'bg-black/[0.045] text-text-muted'
              }`}
            >
              {i < activeIndex ? <Check size={12} /> : i + 1}
            </span>
            <span className={`text-sm ${i <= activeIndex ? 'text-text-primary' : 'text-text-muted'}`}>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
