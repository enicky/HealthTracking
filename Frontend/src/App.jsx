import { useState } from 'react'
import MainLayout from './layout/MainLayout'
import { TenantProvider } from './services/tenant'
import Dashboard from './features/dashboard/Dashboard'
import routes from './app/routes'
import './App.css'

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('')

  // Get tenant and user IDs from localStorage or environment
  const tenantId = localStorage.getItem('tenantId') || '550e8400-e29b-41d4-a716-446655440000'
  const userId = localStorage.getItem('userId') || '550e8400-e29b-41d4-a716-446655440001'

  return (
    <TenantProvider tenantId={tenantId} userId={userId}>
      <MainLayout onNavigate={setCurrentRoute} currentRoute={currentRoute}>
        {currentRoute && routes[currentRoute] ? routes[currentRoute] : <Dashboard />}
      </MainLayout>
    </TenantProvider>
  )
}
