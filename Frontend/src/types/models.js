/**
 * ECG Session Model
 * @typedef {Object} EcgSession
 * @property {string} id - Unique identifier
 * @property {string} tenantId - Tenant identifier
 * @property {string} userId - User identifier
 * @property {string} recordedAt - ISO 8601 timestamp
 * @property {number[]} samples - ECG data samples
 * @property {string} classification - ECG classification (e.g., "Normal", "Abnormal")
 * @property {number|null} averageHeartRate - Average heart rate in BPM
 * @property {string} createdAt - ISO 8601 creation timestamp
 * @property {string} updatedAt - ISO 8601 update timestamp
 */

/**
 * Blood Pressure Reading Model
 * @typedef {Object} BloodPressureReading
 * @property {string} id - Unique identifier
 * @property {string} tenantId - Tenant identifier
 * @property {string} userId - User identifier
 * @property {string} recordedAt - ISO 8601 timestamp
 * @property {number} systolic - Systolic pressure (mmHg)
 * @property {number} diastolic - Diastolic pressure (mmHg)
 * @property {number} pulse - Pulse rate (BPM)
 * @property {string} createdAt - ISO 8601 creation timestamp
 * @property {string} updatedAt - ISO 8601 update timestamp
 */

/**
 * Tenant Context
 * @typedef {Object} TenantContext
 * @property {string} tenantId - Current tenant ID
 * @property {string} userId - Current user ID
 */

export const EcgSessionDefaults = {
  id: '',
  tenantId: '',
  userId: '',
  recordedAt: '',
  samples: [],
  classification: '',
  averageHeartRate: null,
  createdAt: '',
  updatedAt: ''
}

export const BloodPressureReadingDefaults = {
  id: '',
  tenantId: '',
  userId: '',
  recordedAt: '',
  systolic: 0,
  diastolic: 0,
  pulse: 0,
  createdAt: '',
  updatedAt: ''
}
