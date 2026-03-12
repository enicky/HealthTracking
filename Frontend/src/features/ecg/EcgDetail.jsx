import { useState, useEffect, useRef } from 'react'
import { apiService } from '../../services/api'
import { useTenant } from '../../hooks/useTenant'
import { formatDateTime } from '../../utils/dateFormatter'
import './EcgDetail.css'

// Import Flot
import '@fortawesome/fontawesome-free/css/all.css'
// We'll use a simple canvas-based chart since Flot requires jQuery plugins

export default function EcgDetail({ sessionId, onBack }) {
  const { tenantId, userId } = useTenant()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState([])
  const chartRef = useRef(null)
  
  // Scrolling state
  const [viewStart, setViewStart] = useState(0)
  const [viewEnd, setViewEnd] = useState(5000) // Show 5000 samples by default
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartIndex, setDragStartIndex] = useState(0)

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  useEffect(() => {
    // Draw chart when data changes
    if (chartData.length > 0 && chartRef.current) {
      // Reset view when new data is loaded
      setViewStart(0)
      setViewEnd(Math.min(5000, chartData.length))
      drawFlotChart()
    }
  }, [chartData])

  useEffect(() => {
    // Set up canvas event listeners
    const canvas = chartRef.current
    if (!canvas) return

    const handleWheel = (e) => {
      e.preventDefault()
      const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8 // Zoom out or in
      const viewSize = viewEnd - viewStart
      const newViewSize = Math.max(50, Math.min(chartData.length, viewSize * zoomFactor))
      const center = viewStart + viewSize / 2
      const newStart = Math.max(0, center - newViewSize / 2)
      const newEnd = Math.min(chartData.length, newStart + newViewSize)
      
      setViewStart(newStart)
      setViewEnd(newEnd)
    }

    const handleMouseDown = (e) => {
      setIsDragging(true)
      setDragStartX(e.clientX)
      setDragStartIndex(viewStart)
    }

    const handleMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - dragStartX
      const viewSize = viewEnd - viewStart
      const pixelsPerSample = canvas.offsetWidth / viewSize
      const sampleDelta = -deltaX / pixelsPerSample
      
      const newStart = Math.max(0, Math.min(chartData.length - viewSize, dragStartIndex + sampleDelta))
      const newEnd = newStart + viewSize
      
      setViewStart(newStart)
      setViewEnd(newEnd)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [chartData, viewStart, viewEnd, isDragging, dragStartX, dragStartIndex])

  useEffect(() => {
    // Redraw when view changes
    if (chartData.length > 0 && chartRef.current) {
      drawFlotChart()
    }
  }, [chartData, viewStart, viewEnd])

  async function fetchSession() {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.getEcgSessionById(tenantId, userId, sessionId)
      setSession(data)
      
      console.log('Raw samples from API:', data.samples)
      console.log('Samples type:', typeof data.samples)
      console.log('Is array?', Array.isArray(data.samples))
      
      let samples = []
      
      // Handle different sample formats
      if (Array.isArray(data.samples)) {
        samples = data.samples
      } else if (data.samples && typeof data.samples === 'object') {
        // If it's an object with numeric keys, convert to array
        samples = Object.values(data.samples)
      } else if (typeof data.samples === 'string') {
        // If it's a JSON string, parse it
        try {
          samples = JSON.parse(data.samples)
          if (!Array.isArray(samples)) {
            samples = Object.values(samples)
          }
        } catch (e) {
          console.error('Failed to parse samples string:', e)
          samples = []
        }
      }
      
      if (samples && samples.length > 0) {
        const chartData = samples.map((sample, index) => {
          let numValue
          
          // Extract numeric value - samples have {t: time, v: value} structure
          if (typeof sample === 'number') {
            numValue = sample
          } else if (sample && typeof sample === 'object') {
            // Try v property first (ECG data), then value, then amplitude
            numValue = sample.v ?? sample.value ?? sample.amplitude ?? Object.values(sample)[0]
          } else {
            numValue = parseFloat(sample)
          }
          
          // Ensure it's a valid number
          numValue = typeof numValue === 'number' ? numValue : parseFloat(numValue)
          
          return {
            time: index,
            value: numValue,
          }
        }).filter(d => !isNaN(d.value))
        
        setChartData(chartData)
      }
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch ECG session:', err)
    } finally {
      setLoading(false)
    }
  }

  const drawFlotChart = () => {
    if (!chartRef.current || chartData.length === 0) return

    const canvas = chartRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    // Get visible data slice
    const startIdx = Math.floor(viewStart)
    const endIdx = Math.ceil(viewEnd)
    const visibleData = chartData.slice(startIdx, Math.min(endIdx, chartData.length))

    if (visibleData.length === 0) return

    // Downsample if still too much data
    let displayData = visibleData
    if (visibleData.length > 2000) {
      const downsampleFactor = Math.ceil(visibleData.length / 2000)
      displayData = []
      for (let i = 0; i < visibleData.length; i += downsampleFactor) {
        displayData.push(visibleData[i])
      }
    }

    // Find min/max values for visible range
    const values = displayData.map(d => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue || 1

    // Padding
    const padding = 50
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Draw grid
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const y = padding + (chartHeight / 10) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()

      const y_value = maxValue - (range / 10) * i
      ctx.fillStyle = '#999'
      ctx.font = '12px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(y_value.toFixed(2), padding - 10, y + 4)
    }

    // Draw X-axis labels
    const xSteps = Math.min(displayData.length, 10)
    for (let i = 0; i <= xSteps; i++) {
      const x = padding + (chartWidth / xSteps) * i
      const sampleIndex = Math.floor(startIdx + (endIdx - startIdx) * (i / xSteps))
      ctx.fillStyle = '#999'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(sampleIndex.toLocaleString(), x, height - 20)
    }

    // Draw Y-axis label
    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Amplitude (mV)', 0, 0)
    ctx.restore()

    // Draw X-axis label with view info
    const viewSize = Math.floor(viewEnd - viewStart)
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`Samples ${startIdx.toLocaleString()} - ${Math.min(endIdx, chartData.length).toLocaleString()} of ${chartData.length.toLocaleString()} | Scroll to zoom`, width / 2, height - 5)

    // Draw line chart
    ctx.strokeStyle = '#FF5733'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    ctx.beginPath()
    for (let i = 0; i < displayData.length; i++) {
      const x = padding + (chartWidth / (displayData.length - 1 || 1)) * i
      const y = padding + chartHeight - ((displayData[i].value - minValue) / range) * chartHeight

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Draw axes
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()
  }

  if (!sessionId) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="fas fa-info-circle fa-3x text-muted mb-3"></i>
              <p>Select an ECG session to view details</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="alert alert-danger" role="alert">
                <strong>Error:</strong> {error}
              </div>
              <button onClick={fetchSession} className="btn btn-sm btn-primary mr-2">
                <i className="fas fa-sync mr-2"></i>Retry
              </button>
              {onBack && (
                <button onClick={onBack} className="btn btn-sm btn-secondary">
                  <i className="fas fa-arrow-left mr-2"></i>Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center">
              <p>Session not found</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ecg-detail">
      {/* Header with back button */}
      <div className="row mb-3">
        <div className="col-12">
          {onBack && (
            <button onClick={onBack} className="btn btn-sm btn-secondary">
              <i className="fas fa-arrow-left mr-2"></i>Back to Sessions
            </button>
          )}
        </div>
      </div>

      {/* Session Information Card */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="card">
            <div className="card-header with-border">
              <h3 className="card-title">
                <i className="fas fa-info-circle mr-2"></i>
                Session Information
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <b>Recording Date & Time</b>
                  <p className="text-muted">
                    {formatDateTime(session.recordedAt)}
                  </p>
                </div>
                <div className="col-md-3">
                  <b>Classification</b>
                  <p>
                    <span className={`badge ${getClassificationBadgeClass(session.classification)}`}>
                      {session.classification || 'Unknown'}
                    </span>
                  </p>
                </div>
                {session.averageHeartRate && (
                  <div className="col-md-3">
                    <b>Average Heart Rate</b>
                    <p className="text-info">{session.averageHeartRate} BPM</p>
                  </div>
                )}
                <div className="col-md-3">
                  <b>Total Samples</b>
                  <p className="text-info">{chartData.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ECG Chart Card */}
      {chartData.length > 0 && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header with-border">
                <h3 className="card-title">
                  <i className="fas fa-chart-line mr-2"></i>
                  ECG Waveform
                </h3>
              </div>
              <div className="card-body">
                {/* Navigation Controls */}
                <div className="mb-3">
                  <div className="row">
                    <div className="col-auto">
                      <button
                        onClick={() => {
                          const newStart = Math.max(0, viewStart - (viewEnd - viewStart))
                          const newEnd = viewStart
                          setViewStart(newStart)
                          setViewEnd(newEnd)
                        }}
                        className="btn btn-sm btn-outline-primary mr-2"
                        disabled={viewStart === 0}
                        title="Scroll left"
                      >
                        <i className="fas fa-chevron-left"></i> Previous
                      </button>
                      <button
                        onClick={() => {
                          const viewSize = viewEnd - viewStart
                          const newStart = Math.min(chartData.length - viewSize, viewStart + viewSize)
                          const newEnd = Math.min(chartData.length, newStart + viewSize)
                          setViewStart(newStart)
                          setViewEnd(newEnd)
                        }}
                        className="btn btn-sm btn-outline-primary"
                        disabled={viewEnd >= chartData.length}
                        title="Scroll right"
                      >
                        Next <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                    <div className="col-auto">
                      <button
                        onClick={() => {
                          const viewSize = Math.min(chartData.length, (viewEnd - viewStart) * 0.5)
                          const center = viewStart + (viewEnd - viewStart) / 2
                          setViewStart(Math.max(0, center - viewSize / 2))
                          setViewEnd(Math.min(chartData.length, center + viewSize / 2))
                        }}
                        className="btn btn-sm btn-outline-info mr-2"
                        title="Zoom in"
                      >
                        <i className="fas fa-search-plus"></i> Zoom In
                      </button>
                      <button
                        onClick={() => {
                          const viewSize = Math.min(chartData.length, (viewEnd - viewStart) * 2)
                          const center = viewStart + (viewEnd - viewStart) / 2
                          setViewStart(Math.max(0, center - viewSize / 2))
                          setViewEnd(Math.min(chartData.length, center + viewSize / 2))
                        }}
                        className="btn btn-sm btn-outline-info"
                        title="Zoom out"
                      >
                        <i className="fas fa-search-minus"></i> Zoom Out
                      </button>
                    </div>
                    <div className="col-auto ml-auto">
                      <button
                        onClick={() => {
                          setViewStart(0)
                          setViewEnd(Math.min(5000, chartData.length))
                        }}
                        className="btn btn-sm btn-outline-secondary"
                        title="Reset view"
                      >
                        <i className="fas fa-redo"></i> Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chart Container */}
                <div className="flot-chart-container">
                  <canvas
                    ref={chartRef}
                    className="flot-chart"
                    style={{ width: '100%', height: '400px', border: '1px solid #ddd', cursor: isDragging ? 'grabbing' : 'grab' }}
                  ></canvas>
                </div>

                {/* Info Text */}
                <div className="mt-2 text-muted small">
                  <i className="fas fa-info-circle mr-1"></i>
                  Scroll with mouse wheel to zoom | Click and drag to pan | Total samples: {chartData.length.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information Card */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header with-border">
              <h3 className="card-title">
                <i className="fas fa-cog mr-2"></i>
                Additional Information
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <b>Session ID</b>
                  <p className="text-muted small" style={{ wordBreak: 'break-all' }}>
                    {session.id}
                  </p>
                </div>
                <div className="col-md-4">
                  <b>Created</b>
                  <p className="text-muted">
                    {formatDateTime(session.createdAt)}
                  </p>
                </div>
                <div className="col-md-4">
                  <b>Last Updated</b>
                  <p className="text-muted">
                    {formatDateTime(session.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getClassificationBadgeClass(classification) {
  if (!classification) return 'bg-gray'
  const lower = classification.toLowerCase()
  if (lower === 'sinus rhythm') return 'bg-success'
  if (lower === 'normal') return 'bg-success'
  if (lower === 'abnormal') return 'bg-danger'
  return 'bg-warning'
}
