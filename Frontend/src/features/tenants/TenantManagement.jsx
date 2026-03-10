import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiService } from '../../services/api'
import TenantList from './TenantList'
import TenantModal from './TenantModal'
import UserList from './UserList'
import UserModal from './UserModal'
import './TenantManagement.css'

export default function TenantManagement() {
  const { user, token } = useAuth()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [modalError, setModalError] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState(null)

  // User management states
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userModalError, setUserModalError] = useState('')
  const [userModalLoading, setUserModalLoading] = useState(false)
  const [showUserDeleteConfirm, setShowUserDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  useEffect(() => {
    loadTenants()
  }, [token])

  const loadTenants = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiService.getAllTenants(token)
      setTenants(data)
    } catch (err) {
      setError(
        'Failed to load tenants. Please ensure you have Super Admin access.'
      )
      console.error('Error loading tenants:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    setSelectedTenant(null)
    setModalError('')
    setShowModal(true)
  }

  const handleEditClick = (tenant) => {
    setSelectedTenant(tenant)
    setModalError('')
    setShowModal(true)
    loadTenantUsers(tenant.id)
  }

  const handleSelectTenant = (tenant) => {
    setSelectedTenant(tenant)
    loadTenantUsers(tenant.id)
  }

  const handleDeleteClick = (tenant) => {
    setTenantToDelete(tenant)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!tenantToDelete) return

    setModalLoading(true)
    try {
      await apiService.deleteTenant(token, tenantToDelete.id)
      setSuccessMessage(`Tenant "${tenantToDelete.name}" deleted successfully`)
      setShowDeleteConfirm(false)
      setTenantToDelete(null)
      await loadTenants()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setModalError('Failed to delete tenant: ' + err.message)
    } finally {
      setModalLoading(false)
    }
  }

  const handleSaveTenant = async (formData) => {
    setModalError('')
    setModalLoading(true)

    try {
      if (selectedTenant && selectedTenant.id) {
        // Update existing tenant
        await apiService.updateTenant(token, selectedTenant.id, {
          name: formData.name,
        })
        setSuccessMessage('Tenant updated successfully')
      } else {
        // Create new tenant
        const result = await apiService.createTenant(token, {
          name: formData.name,
          adminEmail: formData.adminEmail,
          adminFirstName: formData.adminFirstName,
          adminLastName: formData.adminLastName,
        })

        // Show password information
        setSuccessMessage(
          `Tenant created! Admin email: ${result.adminUser.email}, Temporary password: ${result.defaultPassword}`
        )
      }

      setShowModal(false)
      setSelectedTenant(null)
      await loadTenants()
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      setModalError(err.message || 'Failed to save tenant')
    } finally {
      setModalLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedTenant(null)
    setModalError('')
  }

  const loadTenantUsers = async (tenantId) => {
    setUsersLoading(true)
    try {
      const data = await apiService.getTenantUsers(token, tenantId)
      setUsers(data || [])
    } catch (err) {
      console.error('Error loading users:', err)
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  const handleCreateUserClick = () => {
    setSelectedUser(null)
    setUserModalError('')
    setShowUserModal(true)
  }

  const handleEditUserClick = (user) => {
    setSelectedUser(user)
    setUserModalError('')
    setShowUserModal(true)
  }

  const handleDeleteUserClick = (user) => {
    setUserToDelete(user)
    setShowUserDeleteConfirm(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    setUserModalLoading(true)
    setUserModalError('')
    try {
      await apiService.deleteUser(token, userToDelete.id)
      setSuccessMessage(`User "${userToDelete.email}" deleted successfully`)
      setShowUserDeleteConfirm(false)
      setUserToDelete(null)
      if (selectedTenant) {
        await loadTenantUsers(selectedTenant.id)
        await loadTenants()
      }
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setUserModalError('Failed to delete user: ' + err.message)
      setTimeout(() => setUserModalError(''), 3000)
    } finally {
      setUserModalLoading(false)
    }
  }

  const handleSaveUser = async (formData) => {
    setUserModalError('')
    setUserModalLoading(true)

    try {
      if (selectedUser && selectedUser.id) {
        // Update existing user
        await apiService.updateUser(token, selectedUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: parseInt(formData.role),
        })
        setSuccessMessage('User updated successfully')
      } else {
        // Create new user
        const result = await apiService.createUser(token, selectedTenant.id, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: parseInt(formData.role),
        })
        setSuccessMessage(
          `User created! Email: ${result.email}, Temporary password: ${result.defaultPassword}`
        )
      }

      setShowUserModal(false)
      setSelectedUser(null)
      if (selectedTenant) {
        await loadTenantUsers(selectedTenant.id)
        await loadTenants()
      }
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      setUserModalError(err.message || 'Failed to save user')
    } finally {
      setUserModalLoading(false)
    }
  }

  const handleCloseUserModal = () => {
    setShowUserModal(false)
    setSelectedUser(null)
    setUserModalError('')
  }

  return (
    <div className="tenant-management">
      <div className="tenant-management-header">
        <div>
          <h2>Tenant Management</h2>
          <p>Manage all tenants in the system</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateClick}>
          <i className="fas fa-plus me-2"></i>
          Create Tenant
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage('')}
          ></button>
        </div>
      )}

      <TenantList
        tenants={tenants}
        loading={loading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onSelect={handleSelectTenant}
      />

      <TenantModal
        show={showModal}
        tenant={selectedTenant}
        onClose={handleCloseModal}
        onSave={handleSaveTenant}
        loading={modalLoading}
        error={modalError}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Confirm Deletion</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={modalLoading}
              ></button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the tenant{' '}
                <strong>{tenantToDelete?.name}</strong>? This action cannot be
                undone and will delete all associated data.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Deleting...
                  </>
                ) : (
                  'Delete Tenant'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Management Section */}
      {selectedTenant && (
        <>
          <UserList
            users={users}
            loading={usersLoading}
            onEdit={handleEditUserClick}
            onDelete={handleDeleteUserClick}
            onCreate={handleCreateUserClick}
          />

          <UserModal
            show={showUserModal}
            user={selectedUser}
            tenantId={selectedTenant.id}
            onClose={handleCloseUserModal}
            onSave={handleSaveUser}
            loading={userModalLoading}
            error={userModalError}
          />

          {/* Delete User Confirmation Modal */}
          {showUserDeleteConfirm && (
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog">
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header bg-danger text-white d-flex align-items-center">
                    <h5 className="modal-title">Delete User</h5>
                    <button
                      type="button"
                      className="close text-white ms-auto"
                      onClick={() => setShowUserDeleteConfirm(false)}
                      disabled={userModalLoading}
                    >
                      <span>&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <p>Are you sure you want to delete this user?</p>
                    {userToDelete && (
                      <div className="alert alert-warning">
                        <strong>{userToDelete.email}</strong>
                      </div>
                    )}
                    <p className="text-muted small">This action cannot be undone.</p>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowUserDeleteConfirm(false)}
                      disabled={userModalLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={confirmDeleteUser}
                      disabled={userModalLoading}
                    >
                      {userModalLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
