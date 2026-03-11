import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useTenant } from '../../hooks/useTenant'
import './BloodOxygenList.css'

export default function BloodOxygenList() {
  const { tenantId, userId } = useTenant()
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [skip, setSkip] = useState(0)
  const [take] = useState(10)
  const [hasMore, setHasMore] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [readingToDelete, setReadingToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    console.log('BloodOxygenList mounted with:', { tenantId, userId })
    if (tenantId && userId) {
      console.log('IDs are valid, fetching readings')
      fetchReadings()
    } else {
      console.log('IDs are not valid yet, skipping fetch')
    }
  }, [skip, tenantId, userId])

  async function fetchReadings() {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching blood oxygen readings:', { tenantId, userId, skip, take })
      // Fetch one extra record to determine if there are more pages
      const data = await apiService.getBloodOxygenReadings(tenantId, userId, skip, take + 1)
      
      console.log('Blood oxygen data received:', data)
      
      if (data.length > take) {
        // More records exist, trim to page size
        setReadings(data.slice(0, take))
        setHasMore(true)
      } else {
        setReadings(data)
        setHasMore(false)
      }
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch blood oxygen readings:', err)
    } finally {
      setLoading(false)
    }
  }

  function getOxygenLevel(percentage) {
    if (percentage >= 95) return 'normal'
    if (percentage >= 90) return 'mild'
    if (percentage >= 80) return 'moderate'
    return 'severe'
  }

  function getOxygenLevelLabel(level) {
    switch (level) {
      case 'normal': return 'Normal'
      case 'mild': return 'Mild Hypoxemia'
      case 'moderate': return 'Moderate Hypoxemia'
      case 'severe': return 'Severe Hypoxemia'
      default: return 'Unknown'
    }
  }

  function showDeletePrompt(reading) {
    setReadingToDelete(reading)
    setShowDeleteModal(true)
  }

  function cancelDeleteReading() {
    setShowDeleteModal(false)
    setReadingToDelete(null)
  }

  async function confirmDeleteReading() {
    if (!readingToDelete) return
    try {
      setDeleting(true)
      await apiService.deleteBloodOxygenReading(tenantId, userId, readingToDelete.id)
      setShowDeleteModal(false)
      setReadingToDelete(null)
      await fetchReadings()
    } catch (err) {
      setError(err.message)
      console.error('Failed to delete blood oxygen reading:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header with-border">
            <h3 className="card-title">
              <i className="fas fa-lungs mr-2"></i>
              Blood Oxygen Readings
            </h3>
            <div className="card-tools pull-right">
              <button className="btn btn-sm btn-primary">
                <i className="fas fa-plus mr-2"></i>New Reading
              </button>
            </div>
          </div>

          {loading ? (
            <div className="card-body text-center">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="card-body">
              <div className="alert alert-danger" role="alert">
                <strong>Error:</strong> {error}
              </div>
              <button onClick={fetchReadings} className="btn btn-sm btn-primary">
                <i className="fas fa-sync mr-2"></i>Retry
              </button>
            </div>
          ) : readings.length === 0 ? (
            <div className="card-body">
              <div className="text-center text-muted py-5">
                <i className="fas fa-inbox fa-3x mb-3"></i>
                <p>No blood oxygen readings yet</p>
                <small>Record your first reading to get started</small>
              </div>
            </div>
          ) : (
            <div className="card-body table-responsive">
              <table className="table table-hover table-striped">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th className="text-center">Oxygen %</th>
                    <th className="text-center">Level</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((reading) => {
                    const level = getOxygenLevel(reading.percentage)
                    return (
                      <tr key={reading.id} className={`oxygen-${level}`}>
                        <td>
                          {new Date(reading.recordedAt).toLocaleString()}
                        </td>
                        <td className="text-center">
                          <span className={`badge badge-oxygen-${level}`}>
                            {reading.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center">
                          {getOxygenLevelLabel(level)}
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => showDeletePrompt(reading)}
                            className="btn btn-sm btn-danger"
                            title="Delete reading"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="card-footer">
            <small className="text-muted">
              Showing {readings.length} of many records
            </small>
            <div className="pagination pagination-sm float-right mt-2">
              <button
                onClick={() => setSkip(Math.max(0, skip - take))}
                disabled={skip === 0}
                className="page-link"
              >
                Previous
              </button>
              <span className="page-link disabled">
                Page {Math.floor(skip / take) + 1}
              </span>
              <button
                onClick={() => setSkip(skip + take)}
                disabled={!hasMore}
                className="page-link"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="close" onClick={cancelDeleteReading}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this blood oxygen reading?</p>
                {readingToDelete && (
                  <p className="text-muted">
                    {new Date(readingToDelete.recordedAt).toLocaleString()} - {readingToDelete.percentage}%
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cancelDeleteReading}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDeleteReading}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
