import { useRef, useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../hooks/useTenant'

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const { tenantId } = useTenant()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    setShowLogoutModal(true)
    setDropdownOpen(false)
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    logout()
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          <span className="nav-link">
            <i className="fas fa-envelope me-2"></i>
            {user?.email}
          </span>
        </li>
        <li className="nav-item dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className="nav-link"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <i className="fas fa-user-circle" style={{ fontSize: '1.5rem' }}></i>
          </button>
          <div 
            className={`dropdown-menu dropdown-menu-right ${dropdownOpen ? 'show' : ''}`}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              minWidth: '180px',
              display: dropdownOpen ? 'block' : 'none',
              marginTop: '0.5rem'
            }}
          >
            <a href="#" className="dropdown-item">
              <i className="fas fa-user me-2"></i> Profile
            </a>
            <div className="dropdown-divider"></div>
            <a 
              href="#" 
              className="dropdown-item text-danger" 
              onClick={(e) => {
                e.preventDefault()
                setDropdownOpen(false)
                handleLogout()
              }}
            >
              <i className="fas fa-sign-out-alt me-2"></i> Logout
            </a>
          </div>
        </li>
      </ul>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Logout</h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={cancelLogout}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to logout?</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={cancelLogout}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={confirmLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
