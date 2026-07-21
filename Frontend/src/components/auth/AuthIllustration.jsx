import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import Logo from '../common/Logo'

export default function AuthIllustration() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-auth-dark flex flex-col justify-between p-10">
      {/* glow orbs */}
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-blue/25 blur-[90px]" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-cyan/20 blur-[100px]" />

      <div className="relative z-10">
        <Logo size="sm" to={null} />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
          className="relative w-56 h-56"
        >
          <motion.div
            animate={{ rotate: 360 }} transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-blue/25"
          />
          <motion.div
            animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-6 rounded-full border border-cyan/25 border-dashed"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue to-cyan rotate-45 animate-pulse-glow shadow-[0_0_60px_rgba(0,213,255,0.45)]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Mic size={30} className="text-text-primary" />
          </div>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4 }}
              className="absolute w-1.5 h-1.5 rounded-full bg-cyan"
              style={{ top: `${20 + i * 25}%`, left: i % 2 ? '10%' : '85%' }}
            />
          ))}
        </motion.div>
      </div>

      <div className="relative z-10">
        <h2 className="font-display font-bold text-2xl text-text-primary leading-tight">Hello,<br />Welcome to Interview IQ!</h2>
        <p className="text-sm text-text-secondary mt-3 max-w-xs">
          Prepare smarter, practise confidently and build your future career.
        </p>
      </div>
    </div>
  )
}
