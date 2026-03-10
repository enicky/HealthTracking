import React, { useState, useEffect } from 'react'
import './TenantModal.css'

export default function TenantModal({
  show,
  tenant,
  onClose,
  onSave,
  loading,
  error,
}) {
  const [formData, setFormData] = useState({
    name: '',
    adminEmail: '',
    adminFirstName: 'Admin',
    adminLastName: '',
  })
  const [isNewTenant, setIsNewTenant] = useState(true)

  useEffect(() => {
    if (tenant && tenant.id) {
      // Editing existing tenant
      setFormData({
        name: tenant.name,
        adminEmail: '',
        adminFirstName: tenant.adminFirstName || 'Admin',
        adminLastName: tenant.adminLastName || '',
      })
      setIsNewTenant(false)
    } else {
      // Creating new tenant
      setFormData({
        name: '',
        adminEmail: '',
        adminFirstName: 'Admin',
        adminLastName: '',
      })
      setIsNewTenant(true)
    }
  }, [tenant, show])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!show) return null

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header bg-info text-white d-flex align-items-center">
            <h5 className="modal-title">
              {isNewTenant ? 'Create New Tenant' : 'Edit Tenant'}
            </h5>
            <button
              type="button"
              className="close text-white ms-auto"
              onClick={onClose}
              disabled={loading}
            >
              <span>&times;</span>
            </button>
          </div>

          {error && (
            <div className="alert alert-danger m-3 mb-0" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Tenant Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter tenant name"
                  required
                  disabled={loading}
                />
              </div>

              {isNewTenant && (
                <>
                  <div className="mb-3">
                    <label htmlFor="adminEmail" className="form-label">
                      Admin Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="adminEmail"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      placeholder="Enter admin email address"
                      required
                      disabled={loading}
                    />
                    <small className="form-text text-muted">
                      This will be the username for the tenant admin. A temporary
                      password will be generated.
                    </small>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="adminFirstName" className="form-label">
                        Admin First Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="adminFirstName"
                        name="adminFirstName"
                        value={formData.adminFirstName}
                        onChange={handleChange}
                        placeholder="First name"
                        disabled={loading}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="adminLastName" className="form-label">
                        Admin Last Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="adminLastName"
                        name="adminLastName"
                        value={formData.adminLastName}
                        onChange={handleChange}
                        placeholder="Last name"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  'Save Tenant'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
