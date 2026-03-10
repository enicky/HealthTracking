import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('authUser')
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch (err) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await response.json()
      
      // Save token and user to state and localStorage
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authUser', JSON.stringify(data.user))
      
      return data
    } catch (err) {
      const errorMsg = err.message || 'Invalid credentials'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setError(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
  }, [])

  // Role values: 0 = SuperAdmin, 1 = TenantAdmin, 2 = User
  const isSuperAdmin = user?.role === 0
  const isTenantAdmin = user?.role === 1
  
  const isAuthenticated = !!token && !!user

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    isSuperAdmin,
    isTenantAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
