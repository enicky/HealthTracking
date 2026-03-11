import Dashboard from '../features/dashboard/Dashboard'
import EcgPage from '../features/ecg/EcgPage'
import BloodPressureList from '../features/bloodPressure/BloodPressureList'
import BloodOxygenList from '../features/bloodOxygen/BloodOxygenList'
import WristTemperatureList from '../features/wristTemperature/WristTemperatureList'
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
  'blood-oxygen': <BloodOxygenList />,
  'wrist-temperature': <WristTemperatureList />,
  'tenants': <TenantManagement />,
}

export default routes
