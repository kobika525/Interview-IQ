import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: 'var(--color-card-elevated)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', fontSize: '13px' },
            success: { iconTheme: { primary: '#AEEA3A', secondary: 'var(--color-card-elevated)' } },
            error: { iconTheme: { primary: '#EF4444', secondary: 'var(--color-card-elevated)' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
