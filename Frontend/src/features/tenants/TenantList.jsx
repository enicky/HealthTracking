import React from 'react'
import './TenantList.css'

export default function TenantList({ tenants, loading, onEdit, onDelete, onSelect }) {
  if (loading) {
    return (
      <div className="tenant-list-loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading tenants...</p>
      </div>
    )
  }

  if (!tenants || tenants.length === 0) {
    return (
      <div className="alert alert-info" role="alert">
        No tenants found. Create one to get started!
      </div>
    )
  }

  return (
    <div className="tenant-list">
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Tenant Name</th>
              <th>Users</th>
              <th>Created</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td>
                  <strong 
                    style={{ cursor: 'pointer', color: '#007bff' }}
                    onClick={() => onSelect && onSelect(tenant)}
                    title="Click to view users"
                  >
                    {tenant.name}
                  </strong>
                </td>
                <td>
                  <span className="badge bg-info">{tenant.userCount}</span>
                </td>
                <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                <td>
                  {tenant.updatedAt
                    ? new Date(tenant.updatedAt).toLocaleDateString()
                    : '-'}
                </td>
                <td>
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => onEdit(tenant)}
                      title="Edit tenant"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => onDelete(tenant)}
                      title="Delete tenant"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
