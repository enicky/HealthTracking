import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useTenant } from '../../hooks/useTenant'
import './EcgList.css'

const PAGINATION_STORAGE_KEY = 'ecg_sessions_page'

export default function EcgList({ onSelectSession }) {
  const { tenantId, userId } = useTenant()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [skip, setSkip] = useState(() => {
    // Load saved page on component mount
    const saved = localStorage.getItem(PAGINATION_STORAGE_KEY)
    return saved ? parseInt(saved, 10) : 0
  })
  const [take] = useState(10)
  const [hasMore, setHasMore] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null)

  useEffect(() => {
    if (tenantId && userId) {
      fetchSessions()
    }
  }, [skip, tenantId, userId])

  useEffect(() => {
    // Save current page to localStorage
    localStorage.setItem(PAGINATION_STORAGE_KEY, skip.toString())
  }, [skip])

  async function fetchSessions() {
    try {
      setLoading(true)
      setError(null)
      // Fetch one extra record to determine if there are more pages
      const data = await apiService.getEcgSessions(tenantId, userId, skip, take + 1)
      
      if (data.length > take) {
        // More records exist, trim to page size
        setSessions(data.slice(0, take))
        setHasMore(true)
      } else {
        setSessions(data)
        setHasMore(false)
      }
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch ECG sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSession = (sessionId) => {
    if (onSelectSession) {
      onSelectSession(sessionId)
    }
  }

  const handleDeleteSession = (sessionId) => {
    setSessionToDelete(sessionId)
    setShowDeleteModal(true)
  }

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return

    try {
      setDeleting(sessionToDelete)
      await apiService.deleteEcgSession(tenantId, userId, sessionToDelete)
      // Refresh the sessions list
      await fetchSessions()
      setError(null)
      setShowDeleteModal(false)
      setSessionToDelete(null)
    } catch (err) {
      setError(`Failed to delete session: ${err.message}`)
      console.error('Failed to delete ECG session:', err)
    } finally {
      setDeleting(null)
    }
  }

  const cancelDeleteSession = () => {
    setShowDeleteModal(false)
    setSessionToDelete(null)
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header with-border">
            <h3 className="card-title">
              <i className="fas fa-heartbeat mr-2"></i>
              ECG Sessions
            </h3>
            <div className="card-tools pull-right">
              <button
                className="btn btn-sm btn-primary"
                onClick={fetchSessions}
                disabled={loading}
                title="Refresh ECG sessions"
              >
                <i className={`fas fa-sync mr-2 ${loading ? 'fa-spin' : ''}`}></i>
                Refresh
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
              <button onClick={fetchSessions} className="btn btn-sm btn-primary">
                <i className="fas fa-sync mr-2"></i>Retry
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="card-body">
              <div className="text-center text-muted py-5">
                <i className="fas fa-inbox fa-3x mb-3"></i>
                <p>No ECG sessions found</p>
                <small>Record your first ECG session to get started</small>
              </div>
            </div>
          ) : (
            <div className="card-body">
              <div className="row">
                {sessions.map((session) => (
                  <div key={session.id} className="col-md-6 col-lg-4 mb-3">
                    <div className="card card-outline card-primary">
                      <div className="card-header">
                        <h5 className="card-title">
                          {new Date(session.recordedAt).toLocaleString()}
                        </h5>
                        <div className="card-tools">
                          <span className={`badge ${getClassificationBadgeClass(session.classification)}`}>
                            {session.classification || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-6">
                            <small className="text-muted">Heart Rate</small>
                            <p className="text-primary">
                              {session.averageHeartRate || 'N/A'} BPM
                            </p>
                          </div>
                          <div className="col-6">
                            <small className="text-muted">Samples</small>
                            <p className="text-info">{session.sampleCount || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="card-footer">
                        <button
                          onClick={() => handleSelectSession(session.id)}
                          className="btn btn-sm btn-primary"
                        >
                          <i className="fas fa-eye mr-2"></i>View Details
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          disabled={deleting === session.id}
                          className="btn btn-sm btn-danger ml-2"
                          title="Delete this ECG session"
                        >
                          {deleting === session.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-trash mr-2"></i>Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sessions.length > 0 && (
            <div className="card-footer">
              <div className="mb-3">
                <small className="text-muted">
                  Showing {sessions.length > 0 ? skip + 1 : 0}-{skip + sessions.length} sessions
                </small>
              </div>
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
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white d-flex align-items-center">
                <h5 className="modal-title">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Delete ECG Session
                </h5>
                <button
                  type="button"
                  className="close text-white ms-auto"
                  onClick={cancelDeleteSession}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this ECG session?</p>
                <p className="text-muted small">
                  <i className="fas fa-info-circle mr-1"></i>
                  This action cannot be undone. All data associated with this session will be permanently deleted.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelDeleteSession}
                  disabled={deleting === sessionToDelete}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDeleteSession}
                  disabled={deleting === sessionToDelete}
                >
                  {deleting === sessionToDelete ? (
                    <>
                      <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash mr-2"></i>Delete Session
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showDeleteModal && (
        <div
          className="modal-backdrop fade show"
          onClick={cancelDeleteSession}
        ></div>
      )}
    </div>
  )
}

function getClassificationBadgeClass(classification) {
  if (!classification) return 'bg-gray'
  const lower = classification.toLowerCase()
  if (lower === 'sinus rhythm') return 'bg-success'
  if (lower === 'normal') return 'bg-success'
  if (lower === 'abnormal' || lower === 'atrial fibrillation') return 'bg-danger'
  return 'bg-warning'
}
