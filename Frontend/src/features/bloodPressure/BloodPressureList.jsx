import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useTenant } from '../../hooks/useTenant'
import './BloodPressureList.css'

export default function BloodPressureList() {
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
      const data = await apiService.getBloodPressureReadings(tenantId, userId, skip, take + 1)
      
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
      console.error('Failed to fetch blood pressure readings:', err)
    } finally {
      setLoading(false)
    }
  }

  function getEshCategory(systolic, diastolic) {
    // Grade 3 (highest priority)
    if (systolic >= 180 || diastolic >= 110) return 'grade3'
    // Grade 2
    if (systolic >= 160 || diastolic >= 100) return 'grade2'
    // Grade 1
    if (systolic >= 140 || diastolic >= 90) return 'grade1'
    // Isolated Systolic Hypertension
    if (systolic >= 140 && diastolic < 90) return 'isolatedSystolic'
    // High Normal
    if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) return 'highNormal'
    // Normal
    if ((systolic >= 120 && systolic < 130) && diastolic < 80) return 'normal'
    // Optimal
    return 'optimal'
  }

  function getEshCategoryLabel(category) {
    switch (category) {
      case 'optimal': return 'Optimal'
      case 'normal': return 'Normal'
      case 'highNormal': return 'High Normal'
      case 'grade1': return 'Grade 1'
      case 'grade2': return 'Grade 2'
      case 'grade3': return 'Grade 3'
      case 'isolatedSystolic': return 'Isolated Systolic'
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
      await apiService.deleteBloodPressureReading(tenantId, userId, readingToDelete.id)
      setShowDeleteModal(false)
      setReadingToDelete(null)
      await fetchReadings()
    } catch (err) {
      setError(err.message)
      console.error('Failed to delete blood pressure reading:', err)
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
              <i className="fas fa-heart mr-2"></i>
              Blood Pressure Readings
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
                <p>No blood pressure readings yet</p>
                <small>Record your first reading to get started</small>
              </div>
            </div>
          ) : (
            <div className="card-body table-responsive">
              <table className="table table-hover table-striped">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th className="text-center">Systolic</th>
                    <th className="text-center">Diastolic</th>
                    <th className="text-center">Pulse</th>
                    <th className="text-center">Category</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((reading) => {
                    const category = getEshCategory(reading.systolic, reading.diastolic)
                    return (
                      <tr key={reading.id} className={`reading-${category}`}>
                        <td>
                          <small>{new Date(reading.recordedAt).toLocaleString()}</small>
                        </td>
                        <td className="text-center">
                          <strong>{reading.systolic}</strong>
                        </td>
                        <td className="text-center">
                          <strong>{reading.diastolic}</strong>
                        </td>
                        <td className="text-center">
                          <small>{reading.pulse} BPM</small>
                        </td>
                        <td className="text-center">
                          <span className={`badge ${getCategoryBadgeClass(category)}`}>
                            {getEshCategoryLabel(category)}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => showDeletePrompt(reading)}
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

          {readings.length > 0 && (
            <div className="card-footer">
              <nav aria-label="Page navigation">
                <ul className="pagination m-0">
                  <li className={`page-item ${skip === 0 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setSkip(Math.max(0, skip - take))}
                      disabled={skip === 0}
                    >
                      <i className="fas fa-chevron-left mr-2"></i>Previous
                    </button>
                  </li>
                  <li className="page-item disabled">
                    <span className="page-link">
                      Page {Math.floor(skip / take) + 1}
                    </span>
                  </li>
                  <li className={`page-item ${!hasMore ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setSkip(skip + take)}
                      disabled={!hasMore}
                    >
                      Next<i className="fas fa-chevron-right ml-2"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show" id="deleteModal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white d-flex align-items-center">
                <h5 className="modal-title">Delete Blood Pressure Reading</h5>
                <button type="button" className="close text-white ms-auto" onClick={cancelDeleteReading}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this blood pressure reading?</p>
                {readingToDelete && (
                  <div className="alert alert-warning">
                    <strong>{readingToDelete.systolic}/{readingToDelete.diastolic}</strong> mmHg 
                    <br />
                    <small>Recorded: {new Date(readingToDelete.recordedAt).toLocaleString()}</small>
                  </div>
                )}
                <p className="text-muted small">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cancelDeleteReading} disabled={deleting}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDeleteReading} disabled={deleting}>
                  {deleting && <i className="fas fa-spinner fa-spin mr-2"></i>}
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

function getCategoryBadgeClass(category) {
  switch (category) {
    case 'optimal':
      return 'bg-success'
    case 'normal':
      return 'bg-info'
    case 'highNormal':
      return 'bg-warning'
    case 'grade1':
      return 'bg-danger'
    case 'grade2':
      return 'bg-danger'
    case 'grade3':
      return 'bg-dark'
    case 'isolatedSystolic':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}
