import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Button from '../../components/common/Button'
import Logo from '../../components/common/Logo'

export default function Forbidden() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-app text-text-primary">
      <div className="mb-6"><Logo to={null} /></div>
      <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-5"><ShieldAlert size={28} /></div>
      <h1 className="font-display font-bold text-3xl">403 — Access forbidden</h1>
      <p className="text-text-muted mt-2 max-w-sm">You don't have permission to view this page. If you think this is a mistake, contact support.</p>
      <div className="flex gap-3 mt-6">
        <Link to="/app/dashboard"><Button>Back to dashboard</Button></Link>
        <Link to="/support"><Button variant="outline">Contact support</Button></Link>
      </div>
    </div>
  )
}
