import Dashboard from '../features/dashboard/Dashboard'
import EcgPage from '../features/ecg/EcgPage'
import BloodPressureList from '../features/bloodPressure/BloodPressureList'
import Login from '../features/auth/Login'
import TenantManagement from '../features/tenants/TenantManagement'

/**
 * Route components
 * Each key maps to a component that will be rendered
 */
const routes = {
  'login': <Login />,
  'dashboard': <Dashboard />,
  'ecg': <EcgPage />,
  'blood-pressure': <BloodPressureList />,
  'tenants': <TenantManagement />,
}

export default routes
