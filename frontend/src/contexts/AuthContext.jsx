import React, { createContext, useContext, useState, useEffect } from 'react'
import mockApi from '../services/mockApi'

const AuthContext = createContext()

// Development mode flag - set to false when backend is working
const USE_MOCK_API = true

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      if (USE_MOCK_API) {
        const user = await mockApi.getCurrentUser()
        setUser(user)
      } else {
        // Real API call when backend is working
        const response = await axios.get('/users/me')
        setUser(response.data)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      if (USE_MOCK_API) {
        const response = await mockApi.login(email, password)
        localStorage.setItem('token', response.access_token)
        setUser(response.user)
        return { success: true }
      } else {
        // Real API call when backend is working
        const formData = new FormData()
        formData.append('username', email)
        formData.append('password', password)
        
        const response = await axios.post('/token', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
        
        const { access_token } = response.data
        localStorage.setItem('token', access_token)
        
        await fetchUser()
        return { success: true }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      }
    }
  }

  const signup = async (email, password, role) => {
    try {
      if (USE_MOCK_API) {
        await mockApi.signup({ email, password, role })
        // Auto-login after signup
        return await login(email, password)
      } else {
        // Real API call when backend is working
        await axios.post('/signup', {
          email,
          password,
          role
        })
        
        // Auto-login after signup
        return await login(email, password)
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { 
        success: false, 
        error: error.message || 'Signup failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    if (USE_MOCK_API) {
      mockApi.logout()
    }
  }

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext 