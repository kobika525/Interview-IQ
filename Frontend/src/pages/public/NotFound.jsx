import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Button from '../../components/common/Button'
import Logo from '../../components/common/Logo'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-app text-text-primary">
      <div className="mb-6"><Logo to={null} /></div>
      <div className="w-16 h-16 rounded-2xl bg-blue/10 text-blue flex items-center justify-center mb-5">
        <Compass size={28} />
      </div>
      <h1 className="font-display font-bold text-3xl">404 — Page not found</h1>
      <p className="text-text-muted mt-2 max-w-sm">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/" className="mt-6"><Button>Back to home</Button></Link>
    </div>
  )
}
