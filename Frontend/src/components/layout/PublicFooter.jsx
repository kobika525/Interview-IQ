import { Link } from 'react-router-dom'
import { AtSign, Briefcase, Code2, Mail } from 'lucide-react'
import Logo from '../common/Logo'

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-white mt-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14 grid sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div className="sm:col-span-2 md:col-span-1">
          <Logo size="sm" textClassName="text-white" />
          <p className="text-sm text-white/70 mt-3 max-w-xs">Prepare smarter. Interview better.</p>
          <div className="flex gap-3 mt-4">
            {[AtSign, Briefcase, Code2, Mail].map((Icon, i) => (
              <span key={i} className="btn-icon !w-9 !h-9 text-white/90"><Icon size={15} /></span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wide mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/features" className="hover:text-white">Features</Link></li>
            <li><Link to="/register" className="hover:text-white">Get Started</Link></li>
            <li><Link to="/login" className="hover:text-white">Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wide mb-3">Resources</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wide mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><span className="hover:text-white cursor-pointer">Privacy Policy</span></li>
            <li><span className="hover:text-white cursor-pointer">Terms of Service</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-white/60">
        © 2026 Interview IQ — Final Year Project. All rights reserved.
      </div>
    </footer>
  )
}
