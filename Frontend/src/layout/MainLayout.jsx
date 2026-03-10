import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './layout.css'

export default function MainLayout({ children, onNavigate, currentRoute }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className={`wrapper layout-fixed ${sidebarCollapsed ? 'sidebar-collapse' : ''}`}>
      {/* Header/Navbar */}
      <Header onToggleSidebar={toggleSidebar} />

      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} currentRoute={currentRoute} />

      {/* Content Wrapper */}
      <div className="content-wrapper">
        {/* Content Header */}
        <div className="content-header">
          <h1 className="m-0">
            {currentRoute === 'dashboard' && 'Dashboard'}
            {currentRoute === 'blood-pressure' && 'Blood Pressure'}
            {currentRoute === 'ecg' && 'ECG Sessions'}
          {currentRoute === 'tenants' && 'Tenant Management'}
        </h1>
      </div>

      {/* Content Section */}
      <section className="content">
        <div className="container-fluid">
          {children}
        </div>
      </section>
      </div>

      {/* Footer */}
      <footer className="main-footer">
        <div className="float-right d-none d-sm-inline-block">
          <b>Version</b> 1.0.0
        </div>
      </footer>
    </div>
  )
}
