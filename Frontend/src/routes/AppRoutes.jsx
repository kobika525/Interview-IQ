import { Navigate, Route, Routes } from 'react-router-dom'

function HomePage() {
  return (
    <main className="startup-page">
      <section className="startup-card">
        <div className="startup-mark" aria-hidden="true">IQ</div>
        <h1>Interview IQ</h1>
        <p>Prepare smarter and walk into your next interview with confidence. Your frontend is configured and ready for development.</p>
        <button className="startup-button" type="button">Get started</button>
        <div><span className="startup-status">Application running</span></div>
      </section>
    </main>
  )
}

export default function AppRoutes() {
  return <Routes><Route path="/" element={<HomePage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>
}
