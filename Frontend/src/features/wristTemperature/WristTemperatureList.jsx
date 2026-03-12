import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useTenant } from '../../hooks/useTenant'
import { formatDateTime } from '../../utils/dateFormatter'
import './WristTemperatureList.css'

export default function WristTemperatureList() {
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
    if (tenantId && userId) {
      fetchReadings()
    }
  }, [skip, tenantId, userId])

  async function fetchReadings() {
    try {
      setLoading(true)
      setError(null)
      // Fetch one extra record to determine if there are more pages
      const data = await apiService.getWristTemperatureReadings(tenantId, userId, skip, take + 1)
      
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
      console.error('Failed to fetch wrist temperature readings:', err)
    } finally {
      setLoading(false)
    }
  }

  function getTemperatureStatus(temp) {
    if (temp >= 37.5) return 'fever'
    if (temp >= 36.5 && temp < 37.5) return 'normal'
    if (temp >= 36 && temp < 36.5) return 'low'
    return 'very-low'
  }

  function getTemperatureStatusLabel(status) {
    switch (status) {
      case 'normal': return 'Normal'
      case 'low': return 'Low'
      case 'very-low': return 'Very Low'
      case 'fever': return 'Fever'
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
      await apiService.deleteWristTemperatureReading(tenantId, userId, readingToDelete.id)
      setShowDeleteModal(false)
      setReadingToDelete(null)
      await fetchReadings()
    } catch (err) {
      setError(err.message)
      console.error('Failed to delete wrist temperature reading:', err)
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
              <i className="fas fa-thermometer-half mr-2"></i>
              Wrist Temperature Readings
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
                <p>No wrist temperature readings yet</p>
                <small>Record your first reading to get started</small>
              </div>
            </div>
          ) : (
            <div className="card-body table-responsive">
              <table className="table table-hover table-striped">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th className="text-center">Temperature</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((reading) => {
                    const status = getTemperatureStatus(reading.temperature)
                    return (
                      <tr key={reading.id} className={`temp-${status}`}>
                        <td>
                          {formatDateTime(reading.recordedAt)}
                        </td>
                        <td className="text-center">
                          <span className={`badge badge-temp-${status}`}>
                            {reading.temperature.toFixed(1)}°C
                          </span>
                        </td>
                        <td className="text-center">
                          {getTemperatureStatusLabel(status)}
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
                <p>Are you sure you want to delete this wrist temperature reading?</p>
                {readingToDelete && (
                  <p className="text-muted">
                    {formatDateTime(readingToDelete.recordedAt)} - {readingToDelete.temperature}°C
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
