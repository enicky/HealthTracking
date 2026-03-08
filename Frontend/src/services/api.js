const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

/**
 * Creates headers with tenant and user context
 * @param {string} tenantId - Tenant identifier
 * @param {string} userId - User identifier
 * @returns {Object} Headers object
 */
function createHeaders(tenantId, userId) {
  return {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
    'X-User-Id': userId,
  }
}

/**
 * API Service for health tracking
 */
export const apiService = {
  /**
   * Get all ECG sessions for the current user
   * @param {string} tenantId
   * @param {string} userId
   * @param {number} skip - Number of records to skip (for pagination)
   * @param {number} take - Number of records to take (for pagination)
   * @returns {Promise<Array>}
   */
  async getEcgSessions(tenantId, userId, skip = 0, take = 10) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ecg?skip=${skip}&take=${take}`,
        {
          method: 'GET',
          headers: createHeaders(tenantId, userId),
        }
      )
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching ECG sessions:', error)
      throw error
    }
  },

  /**
   * Get a specific ECG session by ID
   * @param {string} tenantId
   * @param {string} userId
   * @param {string} sessionId
   * @returns {Promise<Object>}
   */
  async getEcgSessionById(tenantId, userId, sessionId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ecg/${sessionId}`,
        {
          method: 'GET',
          headers: createHeaders(tenantId, userId),
        }
      )
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching ECG session:', error)
      throw error
    }
  },

  /**
   * Create a new ECG session
   * @param {string} tenantId
   * @param {string} userId
   * @param {Object} data - ECG session data
   * @returns {Promise<Object>}
   */
  async createEcgSession(tenantId, userId, data) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ecg`,
        {
          method: 'POST',
          headers: createHeaders(tenantId, userId),
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating ECG session:', error)
      throw error
    }
  },

  /**
   * Delete an ECG session
   * @param {string} tenantId
   * @param {string} userId
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  async deleteEcgSession(tenantId, userId, sessionId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ecg/${sessionId}`,
        {
          method: 'DELETE',
          headers: createHeaders(tenantId, userId),
        }
      )
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json().catch(() => ({}))
    } catch (error) {
      console.error('Error deleting ECG session:', error)
      throw error
    }
  },

  /**
   * Get all blood pressure readings for the current user
   * @param {string} tenantId
   * @param {string} userId
   * @param {number} skip - Number of records to skip (for pagination)
   * @param {number} take - Number of records to take (for pagination)
   * @returns {Promise<Array>}
   */
  async getBloodPressureReadings(tenantId, userId, skip = 0, take = 10) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bloodpressure?skip=${skip}&take=${take}`,
        {
          method: 'GET',
          headers: createHeaders(tenantId, userId),
        }
      )
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching blood pressure readings:', error)
      throw error
    }
  },

  /**
   * Get a specific blood pressure reading by ID
   * @param {string} tenantId
   * @param {string} userId
   * @param {string} readingId
   * @returns {Promise<Object>}
   */
  async getBloodPressureReadingById(tenantId, userId, readingId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bloodpressure/${readingId}`,
        {
          method: 'GET',
          headers: createHeaders(tenantId, userId),
        }
      )
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching blood pressure reading:', error)
      throw error
    }
  },

  /**
   * Create a new blood pressure reading
   * @param {string} tenantId
   * @param {string} userId
   * @param {Object} data - Blood pressure reading data
   * @returns {Promise<Object>}
   */
  async createBloodPressureReading(tenantId, userId, data) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bloodpressure`,
        {
          method: 'POST',
          headers: createHeaders(tenantId, userId),
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating blood pressure reading:', error)
      throw error
    }
  },

  /**
   * Delete a blood pressure reading by ID
   * @param {string} tenantId
   * @param {string} userId
   * @param {string} readingId
   * @returns {Promise<void>}
   */
  async deleteBloodPressureReading(tenantId, userId, readingId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bloodpressure/${readingId}`,
        {
          method: 'DELETE',
          headers: createHeaders(tenantId, userId),
        }
      )
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json().catch(() => ({}))
    } catch (error) {
      console.error('Error deleting blood pressure reading:', error)
      throw error
    }
  },
}
