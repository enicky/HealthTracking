import { useState } from 'react'
import MainLayout from './layout/MainLayout'
import { TenantProvider } from './services/tenant'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './features/auth/Login'
import Dashboard from './features/dashboard/Dashboard'
import routes from './app/routes'
import './App.css'

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState('dashboard')
  const { isAuthenticated, user } = useAuth()

  // Get tenant and user IDs from auth context or localStorage
  const tenantId = user?.tenantId || localStorage.getItem('tenantId') || '550e8400-e29b-41d4-a716-446655440000'
  const userId = user?.id || localStorage.getItem('userId') || '550e8400-e29b-41d4-a716-446655440001'

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setCurrentRoute('dashboard')} />
  }

  return (
    <TenantProvider tenantId={tenantId} userId={userId}>
      <MainLayout onNavigate={setCurrentRoute} currentRoute={currentRoute}>
        {currentRoute && routes[currentRoute] ? routes[currentRoute] : <Dashboard />}
      </MainLayout>
    </TenantProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
