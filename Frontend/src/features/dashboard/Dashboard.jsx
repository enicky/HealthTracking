import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useTenant } from '../../hooks/useTenant'
import './Dashboard.css'

export default function Dashboard() {
  const { tenantId, userId } = useTenant()
  const [ecgSessions, setEcgSessions] = useState([])
  const [bpReadings, setBpReadings] = useState([])
  const [boReadings, setBoReadings] = useState([])
  const [wtReadings, setWtReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [infoModal, setInfoModal] = useState({ open: false, title: '', content: '' })

  useEffect(() => {
    if (tenantId && userId) {
      fetchData()
    }
  }, [tenantId, userId])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)
      // Fetch ALL records (9999 is practical limit) without samples for accurate statistics
      const [ecg, bp, bo, wt] = await Promise.all([
        apiService.getEcgSessions(tenantId, userId, 0, 9999),
        apiService.getBloodPressureReadings(tenantId, userId, 0, 9999),
        apiService.getBloodOxygenReadings(tenantId, userId, 0, 9999),
        apiService.getWristTemperatureReadings(tenantId, userId, 0, 9999)
      ])
      setEcgSessions(ecg || [])
      setBpReadings(bp || [])
      setBoReadings(bo || [])
      setWtReadings(wt || [])
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const getStatistics = () => {
    const stats = {
      totalEcgSessions: ecgSessions.length,
      totalBpReadings: bpReadings.length,
      totalBoReadings: boReadings.length,
      totalWtReadings: wtReadings.length,
      avgHeartRate: 0,
      avgSystolic: 0,
      avgDiastolic: 0,
      avgOxygen: 0,
      avgTemperature: 0,
      classificationBreakdown: {}
    }

    if (ecgSessions.length > 0) {
      const totalHR = ecgSessions.reduce((sum, s) => sum + (s.averageHeartRate || 0), 0)
      stats.avgHeartRate = Math.round(totalHR / ecgSessions.length)

      // Classification breakdown
      ecgSessions.forEach(s => {
        const classification = s.classification || 'Unknown'
        stats.classificationBreakdown[classification] = (stats.classificationBreakdown[classification] || 0) + 1
      })
    }

    if (bpReadings.length > 0) {
      const totalSystolic = bpReadings.reduce((sum, r) => sum + (r.systolic || 0), 0)
      const totalDiastolic = bpReadings.reduce((sum, r) => sum + (r.diastolic || 0), 0)
      stats.avgSystolic = Math.round(totalSystolic / bpReadings.length)
      stats.avgDiastolic = Math.round(totalDiastolic / bpReadings.length)
    }

    if (boReadings.length > 0) {
      const totalOxygen = boReadings.reduce((sum, r) => sum + (r.percentage || 0), 0)
      stats.avgOxygen = (totalOxygen / boReadings.length).toFixed(1)
    }

    if (wtReadings.length > 0) {
      const totalTemp = wtReadings.reduce((sum, r) => sum + (r.temperature || 0), 0)
      stats.avgTemperature = (totalTemp / wtReadings.length).toFixed(1)
    }

    return stats
  }

  const getDailyHeartRateData = () => {
    const dailyData = {}
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    fourteenDaysAgo.setHours(0, 0, 0, 0)
    
    ecgSessions.forEach(session => {
      const sessionDate = new Date(session.recordedAt)
      if (sessionDate >= fourteenDaysAgo) {
        const date = sessionDate.toLocaleDateString()
        if (!dailyData[date]) {
          dailyData[date] = { sum: 0, count: 0 }
        }
        dailyData[date].sum += session.averageHeartRate || 0
        dailyData[date].count += 1
      }
    })

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        avg: Math.round(data.sum / data.count)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const getDailyBpData = () => {
    const dailyData = {}
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    fourteenDaysAgo.setHours(0, 0, 0, 0)
    
    bpReadings.forEach(reading => {
      const readingDate = new Date(reading.recordedAt)
      if (readingDate >= fourteenDaysAgo) {
        const date = readingDate.toLocaleDateString()
        if (!dailyData[date]) {
          dailyData[date] = { systolic: [], diastolic: [] }
        }
        dailyData[date].systolic.push(reading.systolic || 0)
        dailyData[date].diastolic.push(reading.diastolic || 0)
      }
    })

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        avgSystolic: Math.round(data.systolic.reduce((a, b) => a + b, 0) / data.systolic.length),
        avgDiastolic: Math.round(data.diastolic.reduce((a, b) => a + b, 0) / data.diastolic.length)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // Get ESH category statistics
  const getEshStatistics = () => {
    const categories = {
      optimal: 0,
      normal: 0,
      highNormal: 0,
      grade1: 0,
      grade2: 0,
      grade3: 0,
      isolatedSystolic: 0
    }

    bpReadings.forEach(reading => {
      const category = getEshCategory(reading.systolic, reading.diastolic)
      categories[category]++
    })

    return categories
  }

  // Get readings by date with HR correlation
  const getHrBpCorrelation = () => {
    const dateMap = {}

    ecgSessions.forEach(session => {
      const date = new Date(session.recordedAt).toLocaleDateString()
      if (!dateMap[date]) {
        dateMap[date] = { hrs: [], sysReadings: [], diaReadings: [] }
      }
      if (session.averageHeartRate) dateMap[date].hrs.push(session.averageHeartRate)
    })

    bpReadings.forEach(reading => {
      const date = new Date(reading.recordedAt).toLocaleDateString()
      if (!dateMap[date]) {
        dateMap[date] = { hrs: [], sysReadings: [], diaReadings: [] }
      }
      dateMap[date].sysReadings.push(reading.systolic)
      dateMap[date].diaReadings.push(reading.diastolic)
    })

    return Object.entries(dateMap)
      .filter(([_, data]) => data.hrs.length > 0 && data.sysReadings.length > 0)
      .map(([date, data]) => ({
        date,
        avgHr: Math.round(data.hrs.reduce((a, b) => a + b, 0) / data.hrs.length),
        avgSys: Math.round(data.sysReadings.reduce((a, b) => a + b, 0) / data.sysReadings.length),
        avgDia: Math.round(data.diaReadings.reduce((a, b) => a + b, 0) / data.diaReadings.length)
      }))
  }

  // Get ECG classification vs BP correlation
  const getEcgBpCorrelation = () => {
    const classificationMap = {}

    ecgSessions.forEach(session => {
      const classification = session.classification || 'Unknown'
      if (!classificationMap[classification]) {
        classificationMap[classification] = { sessions: 0, totalHr: 0 }
      }
      classificationMap[classification].sessions++
      classificationMap[classification].totalHr += session.averageHeartRate || 0
    })

    return Object.entries(classificationMap).map(([classification, data]) => ({
      classification,
      count: data.sessions,
      avgHr: Math.round(data.totalHr / data.sessions)
    }))
  }

  // Get Heart Rate vs Oxygen correlation
  const getHeartRateOxygenCorrelation = () => {
    const dateMap = {}

    ecgSessions.forEach(session => {
      const date = new Date(session.recordedAt).toLocaleDateString()
      if (!dateMap[date]) {
        dateMap[date] = { hrs: [], oxygens: [] }
      }
      if (session.averageHeartRate) dateMap[date].hrs.push(session.averageHeartRate)
    })

    boReadings.forEach(reading => {
      const date = new Date(reading.recordedAt).toLocaleDateString()
      if (dateMap[date]) {
        dateMap[date].oxygens.push(reading.percentage)
      }
    })

    return Object.entries(dateMap)
      .filter(([_, data]) => data.hrs.length > 0 && data.oxygens.length > 0)
      .map(([date, data]) => ({
        date,
        avgHr: Math.round(data.hrs.reduce((a, b) => a + b, 0) / data.hrs.length),
        avgOx: (data.oxygens.reduce((a, b) => a + b, 0) / data.oxygens.length).toFixed(1)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // Get Temperature vs Blood Pressure correlation
  const getTemperatureBpCorrelation = () => {
    const dateMap = {}

    wtReadings.forEach(reading => {
      const date = new Date(reading.recordedAt).toLocaleDateString()
      if (!dateMap[date]) {
        dateMap[date] = { temps: [], sysReadings: [], diaReadings: [] }
      }
      dateMap[date].temps.push(reading.temperature)
    })

    bpReadings.forEach(reading => {
      const date = new Date(reading.recordedAt).toLocaleDateString()
      if (dateMap[date]) {
        dateMap[date].sysReadings.push(reading.systolic)
        dateMap[date].diaReadings.push(reading.diastolic)
      }
    })

    return Object.entries(dateMap)
      .filter(([_, data]) => data.temps.length > 0 && data.sysReadings.length > 0)
      .map(([date, data]) => ({
        date,
        avgTemp: (data.temps.reduce((a, b) => a + b, 0) / data.temps.length).toFixed(1),
        avgSys: Math.round(data.sysReadings.reduce((a, b) => a + b, 0) / data.sysReadings.length)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // Get daily oxygen readings trend
  const getDailyOxygenData = () => {
    const dailyData = {}
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    fourteenDaysAgo.setHours(0, 0, 0, 0)
    
    boReadings.forEach(reading => {
      const readingDate = new Date(reading.recordedAt)
      if (readingDate >= fourteenDaysAgo) {
        const date = readingDate.toLocaleDateString()
        if (!dailyData[date]) {
          dailyData[date] = []
        }
        dailyData[date].push(reading.percentage)
      }
    })

    return Object.entries(dailyData)
      .map(([date, values]) => ({
        date,
        avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // Get daily temperature readings trend
  const getDailyTemperatureData = () => {
    const dailyData = {}
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    fourteenDaysAgo.setHours(0, 0, 0, 0)
    
    wtReadings.forEach(reading => {
      const readingDate = new Date(reading.recordedAt)
      if (readingDate >= fourteenDaysAgo) {
        const date = readingDate.toLocaleDateString()
        if (!dailyData[date]) {
          dailyData[date] = []
        }
        dailyData[date].push(reading.temperature)
      }
    })

    return Object.entries(dailyData)
      .map(([date, values]) => ({
        date,
        avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const stats = getStatistics()
  const dailyHR = getDailyHeartRateData()
  const dailyBP = getDailyBpData()
  const dailyOx = getDailyOxygenData()
  const dailyTemp = getDailyTemperatureData()
  const eshStats = getEshStatistics()
  const hrBpCorrelation = getHrBpCorrelation()
  const ecgBpCorr = getEcgBpCorrelation()
  const hrOxCorrelation = getHeartRateOxygenCorrelation()
  const tempBpCorrelation = getTemperatureBpCorrelation()

  const openInfoModal = (title, content) => {
    setInfoModal({ open: true, title, content })
  }

  const closeInfoModal = () => {
    setInfoModal({ open: false, title: '', content: '' })
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

  return (
    <div className="dashboard-container">
      {error && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>Error:</strong> {error}
              <button type="button" className="close" onClick={() => window.location.reload()}>
                <span>&times;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row">
        <div className="col-md-3 col-sm-6 col-12">
          <div className="info-box bg-info">
            <span className="info-box-icon"><i className="fas fa-heartbeat"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total ECG Sessions</span>
              <span className="info-box-number">{stats.totalEcgSessions}</span>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 col-12">
          <div className="info-box bg-success">
            <span className="info-box-icon"><i className="fas fa-heart"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Avg Heart Rate</span>
              <span className="info-box-number">{stats.avgHeartRate} <small>BPM</small></span>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 col-12">
          <div className="info-box bg-warning">
            <span className="info-box-icon"><i className="fas fa-blood-pressure"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Blood Pressure Readings</span>
              <span className="info-box-number">{stats.totalBpReadings}</span>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 col-12">
          <div className="info-box bg-danger">
            <span className="info-box-icon"><i className="fas fa-tachometer-alt"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Avg BP</span>
              <span className="info-box-number">{stats.avgSystolic}/{stats.avgDiastolic}</span>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 col-12">
          <div className="info-box bg-primary">
            <span className="info-box-icon"><i className="fas fa-lungs"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Blood Oxygen Readings</span>
              <span className="info-box-number">{stats.totalBoReadings}</span>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 col-12">
          <div className="info-box" style={{ backgroundColor: '#17a2b8' }}>
            <span className="info-box-icon"><i className="fas fa-lungs-virus"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Avg Oxygen</span>
              <span className="info-box-number">{stats.avgOxygen} <small>%</small></span>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 col-12">
          <div className="info-box" style={{ backgroundColor: '#ffc107' }}>
            <span className="info-box-icon"><i className="fas fa-thermometer-half"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Temperature Readings</span>
              <span className="info-box-number">{stats.totalWtReadings}</span>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 col-12">
          <div className="info-box" style={{ backgroundColor: '#6f42c1' }}>
            <span className="info-box-icon"><i className="fas fa-fire"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Avg Temperature</span>
              <span className="info-box-number">{stats.avgTemperature} <small>°C</small></span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row mt-3">
        {/* Heart Rate Chart */}
        {dailyHR.length > 0 && (
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header with-border d-flex align-items-center">
                <h3 className="card-title">
                  <i className="fas fa-chart-line mr-2"></i>Daily Average Heart Rate (Last 14 Days)
                </h3>
                <button className="btn btn-sm btn-link ms-auto" onClick={() => openInfoModal('Daily Average Heart Rate', 'This chart shows your average heart rate (in beats per minute) for each day over the last 14 calendar days. It helps you track trends and identify days when your heart rate was elevated or lower than usual.')}
                  style={{ color: '#6c757d', cursor: 'pointer' }}>
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ minHeight: '300px' }}>
                  <HeartRateChart data={dailyHR} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blood Pressure Chart */}
        {dailyBP.length > 0 && (
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header with-border d-flex align-items-center">
                <h3 className="card-title">
                  <i className="fas fa-chart-area mr-2"></i>Daily Average Blood Pressure (Last 14 Days)
                </h3>
                <button className="btn btn-sm btn-link ms-auto" onClick={() => openInfoModal('Daily Average Blood Pressure', 'This chart displays your daily average systolic (red line) and diastolic (yellow line) blood pressure readings over the last 14 calendar days. Systolic is the pressure during heart contractions, while diastolic is the pressure during rest. Both metrics are important for heart health.')}
                  style={{ color: '#6c757d', cursor: 'pointer' }}>
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ minHeight: '300px' }}>
                  <BloodPressureChart data={dailyBP} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blood Oxygen Chart */}
        {dailyOx.length > 0 && (
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header with-border d-flex align-items-center">
                <h3 className="card-title">
                  <i className="fas fa-lungs mr-2"></i>Daily Average Blood Oxygen (Last 14 Days)
                </h3>
                <button className="btn btn-sm btn-link ms-auto" onClick={() => openInfoModal('Daily Average Blood Oxygen', 'This chart shows your daily average oxygen saturation (SpO2) in percentage over the last 14 calendar days. Healthy oxygen levels are typically 95% or higher. Lower levels may indicate respiratory or circulatory issues and should be monitored.')}
                  style={{ color: '#6c757d', cursor: 'pointer' }}>
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ minHeight: '300px' }}>
                  <OxygenChart data={dailyOx} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 1.5: Wrist Temperature */}
      <div className="row mt-3">
        {/* Wrist Temperature Chart */}
        {dailyTemp.length > 0 && (
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header with-border d-flex align-items-center">
                <h3 className="card-title">
                  <i className="fas fa-thermometer-half mr-2"></i>Daily Average Wrist Temperature (Last 14 Days)
                </h3>
                <button className="btn btn-sm btn-link ms-auto" onClick={() => openInfoModal('Daily Average Wrist Temperature', 'This chart displays your daily average wrist temperature in Celsius over the last 14 calendar days. Normal body temperature is around 36.5-37.5°C. Persistent elevation may indicate fever or infection.')}
                  style={{ color: '#6c757d', cursor: 'pointer' }}>
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ minHeight: '300px' }}>
                  <TemperatureChart data={dailyTemp} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Heart Rate vs Oxygen Correlation */}
        {hrOxCorrelation.length > 0 && (
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header with-border d-flex align-items-center">
                <h3 className="card-title">
                  <i className="fas fa-chart-scatter mr-2"></i>Heart Rate vs Oxygen Correlation
                </h3>
                <button className="btn btn-sm btn-link ms-auto" onClick={() => openInfoModal('Heart Rate vs Oxygen Correlation', 'This chart shows the relationship between your average heart rate (left axis) and blood oxygen levels (right axis) for days when both measurements were recorded. An inverse correlation (HR up, O2 down) might indicate exercise or stress. Patterns here can help identify health trends.')}
                  style={{ color: '#6c757d', cursor: 'pointer' }}>
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th className="text-center">Avg HR (BPM)</th>
                        <th className="text-center">Avg O₂ (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hrOxCorrelation.map((item) => (
                        <tr key={item.date}>
                          <td>{item.date}</td>
                          <td className="text-center">
                            <span style={{ color: '#28a745', fontWeight: 'bold' }}>{item.avgHr}</span>
                          </td>
                          <td className="text-center">
                            <span style={{ color: '#17a2b8', fontWeight: 'bold' }}>{item.avgOx}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 1.75: Temperature vs BP Correlation */}
      <div className="row mt-3">
        {/* Temperature vs Systolic BP Correlation */}
        {tempBpCorrelation.length > 0 && (
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header with-border d-flex align-items-center">
                <h3 className="card-title">
                  <i className="fas fa-link mr-2"></i>Temperature vs Blood Pressure Correlation
                </h3>
                <button className="btn btn-sm btn-link ms-auto" onClick={() => openInfoModal('Temperature vs Blood Pressure Correlation', 'This chart shows the relationship between your wrist temperature and blood pressure for days when both measurements were recorded. Fever often correlates with elevated blood pressure. Monitoring both together can help you understand your body\'s response to illness or stress.')}
                  style={{ color: '#6c757d', cursor: 'pointer' }}>
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th className="text-center">Avg Temp (°C)</th>
                        <th className="text-center">Avg Sys BP (mmHg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempBpCorrelation.map((item) => (
                        <tr key={item.date}>
                          <td>{item.date}</td>
                          <td className="text-center">
                            <span style={{ color: '#ff9800', fontWeight: 'bold' }}>{item.avgTemp}</span>
                          </td>
                          <td className="text-center">
                            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>{item.avgSys}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 2: ECG Classification Tables (side-by-side) */}
      {(Object.keys(stats.classificationBreakdown).length > 0 || ecgBpCorr.length > 0) && (
        <div className="row mt-3">
          {/* Classification Breakdown */}
          {Object.keys(stats.classificationBreakdown).length > 0 && (
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header with-border d-flex align-items-center">
                  <h3 className="card-title">
                    <i className="fas fa-chart-pie mr-2"></i>ECG Classification Breakdown
                  </h3>
                  <button className="btn btn-sm btn-link ms-auto" onClick={() => openInfoModal('ECG Classification Breakdown', 'This table shows a breakdown of your ECG recordings by classification type. It counts how many sessions fall into each category (e.g., Sinus Rhythm, Normal, Abnormal) and shows the percentage of total sessions. This helps you understand the distribution of your heart rhythm patterns.')}
                    style={{ color: '#6c757d', cursor: 'pointer' }}>
                    <i className="fas fa-info-circle"></i>
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Classification</th>
                          <th style={{ textAlign: 'center' }}>Count</th>
                          <th style={{ textAlign: 'center' }}>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(stats.classificationBreakdown)
                          .sort((a, b) => b[1] - a[1])
                          .map(([classification, count]) => (
                            <tr key={classification}>
                              <td>
                                <span className={`badge ${getClassificationBadge(classification)}`}>
                                  {classification}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>{count}</td>
                              <td style={{ textAlign: 'center' }}>
                                {((count / stats.totalEcgSessions) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ECG Classification vs Heart Rate */}
          {ecgBpCorr.length > 0 && (
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header with-border d-flex align-items-center">
                  <h3 className="card-title">
                    <i className="fas fa-chart-bar mr-2"></i>ECG Classification & Avg Heart Rate
                  </h3>
                  <button className="btn btn-sm btn-link ms-auto" onClick={() => openInfoModal('ECG Classification & Average Heart Rate', 'This table shows the relationship between ECG classifications and heart rate. For each ECG classification type, it displays the number of sessions and the average heart rate recorded during those sessions. This helps identify if certain heart rhythms are associated with higher or lower heart rates.')}
                    style={{ color: '#6c757d', cursor: 'pointer' }}>
                    <i className="fas fa-info-circle"></i>
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Classification</th>
                          <th style={{ textAlign: 'center' }}>Sessions</th>
                          <th style={{ textAlign: 'center' }}>Avg HR (BPM)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ecgBpCorr
                          .sort((a, b) => b.count - a.count)
                          .map(item => (
                            <tr key={item.classification}>
                              <td>
                                <span className={`badge ${getClassificationBadge(item.classification)}`}>
                                  {item.classification}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>{item.count}</td>
                              <td style={{ textAlign: 'center' }}>
                                <strong>{item.avgHr}</strong>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row 3: ESH Blood Pressure Categories */}
      {bpReadings.length > 0 && (
        <div className="row mt-3">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header with-border d-flex align-items-center">
                <h3 className="card-title">
                  <i className="fas fa-heartbeat mr-2"></i>ESH Blood Pressure Categories
                </h3>
                <button className="btn btn-sm btn-link ms-auto" onClick={() => openInfoModal('ESH Blood Pressure Categories', 'This table classifies your blood pressure readings using the European Society of Hypertension (ESH) guidelines. Categories range from Optimal (lowest risk) to Grade 3 Hypertension (highest risk). Green indicates healthy readings, while red indicates hypertension requiring attention.')}
                  style={{ color: '#6c757d', cursor: 'pointer' }}>
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th style={{ textAlign: 'center' }}>Count</th>
                        <th style={{ textAlign: 'center' }}>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'optimal', label: 'Optimal' },
                        { key: 'normal', label: 'Normal' },
                        { key: 'highNormal', label: 'High Normal' },
                        { key: 'grade1', label: 'Grade 1 Hypertension' },
                        { key: 'grade2', label: 'Grade 2 Hypertension' },
                        { key: 'grade3', label: 'Grade 3 Hypertension' },
                        { key: 'isolatedSystolic', label: 'Isolated Systolic HTN' }
                      ]
                        .filter(cat => eshStats[cat.key] > 0)
                        .map(cat => (
                          <tr key={cat.key}>
                            <td>
                              <span className={`badge ${getEshCategoryColor(cat.key)}`}>
                                {cat.label}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>{eshStats[cat.key]}</td>
                            <td style={{ textAlign: 'center' }}>
                              {((eshStats[cat.key] / stats.totalBpReadings) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heart Rate vs Blood Pressure Correlation */}
      {hrBpCorrelation.length > 0 && (
        <div className="row mt-3">
          <div className="col-lg-12">
            <div className="card">
            <div className="card-header with-border d-flex align-items-center">
              <h3 className="card-title">
                <i className="fas fa-exchange-alt mr-2"></i>Heart Rate vs Blood Pressure (Days with both readings)
              </h3>
              <button className="btn btn-sm btn-link ms-auto" onClick={() => openInfoModal('Heart Rate vs Blood Pressure Correlation', 'This scatter plot shows the relationship between your daily average heart rate (X-axis) and systolic blood pressure (Y-axis) on days where you have both types of readings. Each point represents one day. An upward trend suggests that higher heart rates tend to correlate with higher blood pressure.')}
                  style={{ color: '#6c757d', cursor: 'pointer' }}>
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
              <div className="card-body">
                <div className="chart-container">
                  <HrBpCorrelationChart data={hrBpCorrelation} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {infoModal.open && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header d-flex align-items-center">
                <h5 className="modal-title">{infoModal.title}</h5>
                <button type="button" className="close ms-auto" onClick={closeInfoModal}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>{infoModal.content}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeInfoModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HeartRateChart({ data }) {
  const chartRef = React.useRef(null)
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    if (!chartRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const canvas = chartRef.current
    const width = container.clientWidth - 10
    const height = 350

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')

    // Clear canvas
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    const padding = 50
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Get min/max
    const values = data.map(d => d.avg)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue || 1

    // Draw grid and axes
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Draw line chart
    ctx.strokeStyle = '#28a745'
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((point, i) => {
      const x = padding + (chartWidth / (data.length - 1 || 1)) * i
      const normalizedValue = (point.avg - minValue) / range
      const y = height - padding - normalizedValue * chartHeight
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Draw points
    ctx.fillStyle = '#28a745'
    data.forEach((point, i) => {
      const x = padding + (chartWidth / (data.length - 1 || 1)) * i
      const normalizedValue = (point.avg - minValue) / range
      const y = height - padding - normalizedValue * chartHeight
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw labels
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    data.forEach((point, i) => {
      if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
        const x = padding + (chartWidth / (data.length - 1 || 1)) * i
        ctx.fillText(new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), x, height - padding + 20)
      }
    })

    // Y-axis labels
    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (range / 5) * i
      const y = height - padding - (chartHeight / 5) * i
      ctx.fillText(Math.round(value), padding - 10, y + 4)
    }
  }, [data])

  return <div ref={containerRef} style={{ width: '100%' }}><canvas ref={chartRef} style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
}

function BloodPressureChart({ data }) {
  const chartRef = React.useRef(null)
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    if (!chartRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const canvas = chartRef.current
    const width = container.clientWidth - 10
    const height = 350

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')

    // Clear canvas
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    const padding = 50
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const allValues = data.flatMap(d => [d.avgSystolic, d.avgDiastolic])
    const minValue = Math.min(...allValues)
    const maxValue = Math.max(...allValues)
    const range = maxValue - minValue || 1

    // Draw grid
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Draw systolic line
    ctx.strokeStyle = '#dc3545'
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((point, i) => {
      const x = padding + (chartWidth / (data.length - 1 || 1)) * i
      const normalizedValue = (point.avgSystolic - minValue) / range
      const y = height - padding - normalizedValue * chartHeight
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Draw diastolic line
    ctx.strokeStyle = '#ffc107'
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((point, i) => {
      const x = padding + (chartWidth / (data.length - 1 || 1)) * i
      const normalizedValue = (point.avgDiastolic - minValue) / range
      const y = height - padding - normalizedValue * chartHeight
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Draw labels
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    data.forEach((point, i) => {
      if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
        const x = padding + (chartWidth / (data.length - 1 || 1)) * i
        ctx.fillText(new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), x, height - padding + 20)
      }
    })

    // Y-axis labels
    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (range / 5) * i
      const y = height - padding - (chartHeight / 5) * i
      ctx.fillText(Math.round(value), padding - 10, y + 4)
    }

    // Legend
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#dc3545'
    ctx.fillText('● Systolic', padding + 20, 20)
    ctx.fillStyle = '#ffc107'
    ctx.fillText('● Diastolic', padding + 150, 20)
  }, [data])

  return <div ref={containerRef} style={{ width: '100%' }}><canvas ref={chartRef} style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
}

function getClassificationBadge(classification) {
  const lower = classification.toLowerCase()
  if (lower === 'sinus rhythm' || lower === 'normal') return 'bg-success'
  if (lower === 'abnormal' || lower === 'atrial fibrillation') return 'bg-danger'
  return 'bg-warning'
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

function getEshCategoryColor(category) {
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

function HrBpCorrelationChart({ data }) {
  const chartRef = React.useRef(null)
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    if (!chartRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const canvas = chartRef.current
    const width = container.clientWidth - 10
    const height = 400

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')

    // Clear canvas
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    const padding = 60
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Get ranges
    const hrs = data.map(d => d.avgHr)
    const sysValues = data.map(d => d.avgSys)
    
    const minHr = Math.min(...hrs)
    const maxHr = Math.max(...hrs)
    const hrRange = maxHr - minHr || 1
    
    const minSys = Math.min(...sysValues)
    const maxSys = Math.max(...sysValues)
    const sysRange = maxSys - minSys || 1

    // Draw grid
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Draw data points
    ctx.fillStyle = '#28a745'
    ctx.strokeStyle = '#28a745'
    ctx.lineWidth = 1
    data.forEach(point => {
      const x = padding + ((point.avgHr - minHr) / hrRange) * chartWidth
      const y = height - padding - ((point.avgSys - minSys) / sysRange) * chartHeight
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw X-axis labels (Heart Rate)
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    for (let i = 0; i <= 5; i++) {
      const value = minHr + (hrRange / 5) * i
      const x = padding + (chartWidth / 5) * i
      ctx.fillText(Math.round(value), x, height - padding + 20)
    }
    ctx.fillText('Heart Rate (BPM)', width / 2, height - 10)

    // Draw Y-axis labels (Systolic BP)
    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const value = minSys + (sysRange / 5) * i
      const y = height - padding - (chartHeight / 5) * i
      ctx.fillText(Math.round(value), padding - 10, y + 4)
    }
    
    // Y-axis label
    ctx.save()
    ctx.translate(20, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('Systolic BP (mmHg)', 0, 0)
    ctx.restore()
  }, [data])

  return <div ref={containerRef} style={{ width: '100%' }}><canvas ref={chartRef} style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
}

function OxygenChart({ data }) {
  const chartRef = React.useRef(null)
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    if (!chartRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const canvas = chartRef.current
    const width = container.clientWidth - 10
    const height = 350

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')

    // Clear canvas
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    const padding = 50
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Get min/max
    const values = data.map(d => parseFloat(d.avg))
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue || 1

    // Draw grid and axes
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Draw line chart
    ctx.strokeStyle = '#17a2b8'
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((point, i) => {
      const x = padding + (chartWidth / (data.length - 1 || 1)) * i
      const normalizedValue = (parseFloat(point.avg) - minValue) / range
      const y = height - padding - normalizedValue * chartHeight
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Draw points
    ctx.fillStyle = '#17a2b8'
    data.forEach((point, i) => {
      const x = padding + (chartWidth / (data.length - 1 || 1)) * i
      const normalizedValue = (parseFloat(point.avg) - minValue) / range
      const y = height - padding - normalizedValue * chartHeight
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw labels
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    data.forEach((point, i) => {
      if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
        const x = padding + (chartWidth / (data.length - 1 || 1)) * i
        ctx.fillText(new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), x, height - padding + 20)
      }
    })

    // Y-axis labels
    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (range / 5) * i
      const y = height - padding - (chartHeight / 5) * i
      ctx.fillText(Math.round(value * 10) / 10, padding - 10, y + 4)
    }
  }, [data])

  return <div ref={containerRef} style={{ width: '100%' }}><canvas ref={chartRef} style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
}

function TemperatureChart({ data }) {
  const chartRef = React.useRef(null)
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    if (!chartRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const canvas = chartRef.current
    const width = container.clientWidth - 10
    const height = 350

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')

    // Clear canvas
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    const padding = 50
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Get min/max
    const values = data.map(d => parseFloat(d.avg))
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue || 1

    // Draw grid and axes
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Draw line chart
    ctx.strokeStyle = '#fd7e14'
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((point, i) => {
      const x = padding + (chartWidth / (data.length - 1 || 1)) * i
      const normalizedValue = (parseFloat(point.avg) - minValue) / range
      const y = height - padding - normalizedValue * chartHeight
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Draw points
    ctx.fillStyle = '#fd7e14'
    data.forEach((point, i) => {
      const x = padding + (chartWidth / (data.length - 1 || 1)) * i
      const normalizedValue = (parseFloat(point.avg) - minValue) / range
      const y = height - padding - normalizedValue * chartHeight
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw labels
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    data.forEach((point, i) => {
      if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
        const x = padding + (chartWidth / (data.length - 1 || 1)) * i
        ctx.fillText(new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), x, height - padding + 20)
      }
    })

    // Y-axis labels
    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (range / 5) * i
      const y = height - padding - (chartHeight / 5) * i
      ctx.fillText(Math.round(value * 10) / 10, padding - 10, y + 4)
    }
  }, [data])

  return <div ref={containerRef} style={{ width: '100%' }}><canvas ref={chartRef} style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
}
