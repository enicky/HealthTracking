import { useTenant } from '../hooks/useTenant'

export default function Header({ onToggleSidebar }) {
  const { tenantId, userId } = useTenant()

  return (
    <nav className="main-header navbar navbar-expand navbar-white navbar-light">
      {/* Left navbar links */}
      <ul className="navbar-nav">
        <li className="nav-item">
          <button
            className="nav-link"
            onClick={(e) => {
              e.preventDefault()
              onToggleSidebar()
            }}
            style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            <i className="fas fa-bars"></i>
          </button>
        </li>
      </ul>

      {/* Right navbar links */}
      <ul className="navbar-nav ml-auto">
        <li className="nav-item">
          <span className="nav-link">{tenantId?.substring(0, 8)}...</span>
        </li>
        <li className="nav-item">
          <span className="nav-link">{userId?.substring(0, 8)}...</span>
        </li>
      </ul>
    </nav>
  )
}
