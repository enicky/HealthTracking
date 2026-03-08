import Dashboard from '../features/dashboard/Dashboard'
import EcgPage from '../features/ecg/EcgPage'
import BloodPressureList from '../features/bloodPressure/BloodPressureList'

/**
 * Route components
 * Each key maps to a component that will be rendered
 */
const routes = {
  'dashboard': <Dashboard />,
  'ecg': <EcgPage />,
  'blood-pressure': <BloodPressureList />,
}

export default routes
