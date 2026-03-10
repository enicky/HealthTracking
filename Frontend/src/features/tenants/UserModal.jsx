import React, { useState, useEffect } from 'react'
import './UserModal.css'

export default function UserModal({
  show,
  user,
  tenantId,
  onClose,
  onSave,
  loading,
  error,
}) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: '2', // Default to User role
  })
  const [isNewUser, setIsNewUser] = useState(true)

  useEffect(() => {
    if (user && user.id) {
      // Editing existing user
      setFormData({
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: String(user.role || 2),
      })
      setIsNewUser(false)
    } else {
      // Creating new user
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: '2',
      })
      setIsNewUser(true)
    }
  }, [user, show])

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
              {isNewUser ? 'Create New User' : 'Edit User'}
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
                <label htmlFor="email" className="form-label">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                  disabled={loading || !isNewUser}
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    disabled={loading}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="role" className="form-label">
                  Role <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="1">Tenant Admin</option>
                  <option value="2">User</option>
                </select>
              </div>

              {isNewUser && (
                <div className="alert alert-info" role="alert">
                  <i className="fas fa-info-circle mr-2"></i>
                  A temporary password will be generated and sent to the user's email.
                </div>
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
                  'Save User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
