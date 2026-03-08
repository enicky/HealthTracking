export default function Sidebar({ onNavigate, currentRoute }) {
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
        {/* Sidebar user panel (optional) */}
        
        {/* Sidebar Menu */}
        <nav className="mt-2">
          <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
            {/* Dashboard */}
            <li className="nav-item">
              <a
                href="#"
                className={`nav-link ${currentRoute === '' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate('')
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
          </ul>
        </nav>
      </div>
    </aside>
  )
}
