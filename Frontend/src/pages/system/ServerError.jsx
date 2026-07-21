import { Link } from 'react-router-dom'
import { ServerCrash } from 'lucide-react'
import Button from '../../components/common/Button'
import Logo from '../../components/common/Logo'

export default function ServerError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-app text-text-primary">
      <div className="mb-6"><Logo to={null} /></div>
      <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-5"><ServerCrash size={28} /></div>
      <h1 className="font-display font-bold text-3xl">500 — Something broke on our end</h1>
      <p className="text-text-muted mt-2 max-w-sm">Our servers hit an unexpected error. Please try again in a moment.</p>
      <div className="flex gap-3 mt-6">
        <Button onClick={() => window.location.reload()}>Try again</Button>
        <Link to="/"><Button variant="outline">Go home</Button></Link>
      </div>
    </div>
  )
}
