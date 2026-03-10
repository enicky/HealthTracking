import { useAuth } from '../context/AuthContext'

const ROLE_NAMES = {
  0: 'Super Admin',
  1: 'Tenant Admin',
  2: 'User',
}

export default function Sidebar({ onNavigate, currentRoute }) {
  const { user, isSuperAdmin } = useAuth()

  return (
    <aside className="main-sidebar sidebar-dark-primary">
      {/* Brand Logo */}
      <a href="#" className="brand-link" onClick={(e) => e.preventDefault()}>
        <img
          src="/health-tracker-logo.svg"
          alt="Health Tracker"
          className="brand-image img-circle elevation-2"
          style={{width: '33px', height: '33px'}}
        />
        <span className="brand-text font-weight-light">Health Tracker</span>
      </a>

      {/* Sidebar */}
      <div className="sidebar">
        {/* Sidebar user panel */}
        <div className="user-panel mt-3 pb-3 mb-3 d-flex">
          <div className="image">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
              className="img-circle elevation-2"
              alt="User Image"
            />
          </div>
          <div className="info">
            <a href="#" className="d-block">
              {user?.firstName} {user?.lastName}
            </a>
            <small className="text-muted">{ROLE_NAMES[user?.role] || 'Unknown'}</small>
          </div>
        </div>
        
        {/* Sidebar Menu */}
        <nav className="mt-2">
          <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
            {/* Dashboard */}
            <li className="nav-item">
              <a
                href="#"
                className={`nav-link ${currentRoute === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate('dashboard')
                }}
              >
                <i className="nav-icon fas fa-chart-line"></i>
                <p>Dashboard</p>
              </a>
            </li>

            {/* Blood Pressure */}
            <li className="nav-item">
              <a
                href="#"
                className={`nav-link ${currentRoute === 'blood-pressure' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate('blood-pressure')
                }}
              >
                <i className="nav-icon fas fa-heart"></i>
                <p>Blood Pressure</p>
              </a>
            </li>

            {/* ECG Sessions */}
            <li className="nav-item">
              <a
                href="#"
                className={`nav-link ${currentRoute === 'ecg' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate('ecg')
                }}
              >
                <i className="nav-icon fas fa-heartbeat"></i>
                <p>ECG Sessions</p>
              </a>
            </li>

            {/* Divider for admin section */}
            {isSuperAdmin && (
              <>
                <li className="nav-header">SYSTEM ADMINISTRATION</li>

                {/* Tenant Management - Super Admin Only */}
                <li className="nav-item">
                  <a
                    href="#"
                    className={`nav-link ${currentRoute === 'tenants' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate('tenants')
                    }}
                  >
                    <i className="nav-icon fas fa-building"></i>
                    <p>Tenant Management</p>
                  </a>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
