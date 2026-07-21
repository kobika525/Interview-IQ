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
            style: { background: '#151D2E', color: '#FFFFFF', border: '1px solid #273149', fontSize: '13px' },
            success: { iconTheme: { primary: '#22C55E', secondary: '#151D2E' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#151D2E' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
