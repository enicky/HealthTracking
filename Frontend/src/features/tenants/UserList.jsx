import React from 'react'
import './UserList.css'

export default function UserList({
  users,
  loading,
  onEdit,
  onDelete,
  onCreate,
}) {
  if (loading) {
    return (
      <div className="card mt-4">
        <div className="card-header with-border d-flex justify-content-between align-items-center">
          <h3 className="card-title">
            <i className="fas fa-users mr-2"></i>
            Tenant Users
          </h3>
          <button 
            className="btn btn-success btn-sm" 
            onClick={onCreate}
            disabled={true}
            style={{ marginLeft: 'auto' }}
          >
            <i className="fas fa-plus mr-1"></i>
            Create User
          </button>
        </div>
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card mt-4">
      <div className="card-header with-border d-flex justify-content-between align-items-center">
        <h3 className="card-title">
          <i className="fas fa-users mr-2"></i>
          Tenant Users
        </h3>
        <button 
          className="btn btn-success btn-sm" 
          onClick={onCreate}
          style={{ marginLeft: 'auto' }}
        >
          <i className="fas fa-plus mr-1"></i>
          Create User
        </button>
      </div>
      {!users || users.length === 0 ? (
        <div className="card-body text-center text-muted">
          <p>No users found for this tenant</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Email</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Role</th>
                <th>Created</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.firstName || '-'}</td>
                  <td>{user.lastName || '-'}</td>
                  <td>
                    <span className="badge badge-secondary">
                      {getRoleBadge(user.role)}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-xs btn-info mr-1"
                      onClick={() => onEdit(user)}
                      title="Edit user"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn btn-xs btn-danger"
                      onClick={() => onDelete(user)}
                      title="Delete user"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function getRoleBadge(role) {
  switch (role) {
    case 0:
      return 'Super Admin'
    case 1:
      return 'Tenant Admin'
    case 2:
      return 'User'
    default:
      return 'Unknown'
  }
}
