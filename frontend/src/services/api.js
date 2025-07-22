/**
 * API service for MX70 frontend
 * Handles both mock and real API calls based on configuration
 */

import mockApi from './mockApi'
import axios from 'axios'

// Configuration flag - set to false when backend is working
const USE_MOCK_API = true

// Set up axios for real API calls
if (!USE_MOCK_API) {
  axios.defaults.baseURL = 'http://localhost:8005'
  
  // Add request interceptor to include auth token
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )
  
  // Add response interceptor to handle auth errors
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )
}

// Unified API service
export const api = {
  // Authentication
  async login(email, password) {
    if (USE_MOCK_API) {
      return await mockApi.login(email, password)
    } else {
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)
      
      const response = await axios.post('/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      
      return response.data
    }
  },

  async signup(userData) {
    if (USE_MOCK_API) {
      return await mockApi.signup(userData)
    } else {
      const response = await axios.post('/signup', userData)
      return response.data
    }
  },

  async getCurrentUser() {
    if (USE_MOCK_API) {
      return await mockApi.getCurrentUser()
    } else {
      const response = await axios.get('/users/me')
      return response.data
    }
  },

  async logout() {
    if (USE_MOCK_API) {
      await mockApi.logout()
    }
    // For real API, just remove token (no server-side logout endpoint needed)
    localStorage.removeItem('token')
  },

  // Gigs
  async createGig(gigData) {
    if (USE_MOCK_API) {
      return await mockApi.createGig(gigData)
    } else {
      const response = await axios.post('/gigs/post-gig', gigData)
      return response.data
    }
  },

  async getAvailableGigs() {
    if (USE_MOCK_API) {
      return await mockApi.getAvailableGigs()
    } else {
      const response = await axios.get('/gigs/available')
      return response.data
    }
  },

  async getMyGigs() {
    if (USE_MOCK_API) {
      return await mockApi.getMyGigs()
    } else {
      const response = await axios.get('/gigs/my-gigs')
      return response.data
    }
  },

  async claimGig(gigId) {
    if (USE_MOCK_API) {
      return await mockApi.claimGig(gigId)
    } else {
      const response = await axios.post(`/gigs/${gigId}/claim`)
      return response.data
    }
  },

  async submitVideo(gigId, submissionData) {
    if (USE_MOCK_API) {
      return await mockApi.submitVideo(gigId, submissionData)
    } else {
      const response = await axios.post(`/gigs/${gigId}/submit`, submissionData)
      return response.data
    }
  },

  // Lessons
  async getLessons() {
    if (USE_MOCK_API) {
      return await mockApi.getLessons()
    } else {
      const response = await axios.get('/lessons/')
      return response.data
    }
  },

  async getLesson(lessonId) {
    if (USE_MOCK_API) {
      return await mockApi.getLesson(lessonId)
    } else {
      const response = await axios.get(`/lessons/${lessonId}`)
      return response.data
    }
  },

  async completeQuiz(lessonId, answers) {
    if (USE_MOCK_API) {
      return await mockApi.completeQuiz(lessonId, answers)
    } else {
      const response = await axios.post(`/lessons/${lessonId}/complete-quiz`, { answers })
      return response.data
    }
  },

  // Dashboard
  async getDashboard() {
    if (USE_MOCK_API) {
      return await mockApi.getDashboard()
    } else {
      const response = await axios.get('/dashboard/')
      return response.data
    }
  },

  // Self-promo
  async submitSelfPromo(promoData) {
    if (USE_MOCK_API) {
      return await mockApi.submitSelfPromo(promoData)
    } else {
      const response = await axios.post('/dashboard/self-promo', promoData)
      return response.data
    }
  },

  // File upload
  async uploadFile(file, type = 'video') {
    if (USE_MOCK_API) {
      return await mockApi.uploadFile(file, type)
    } else {
      const formData = new FormData()
      formData.append('file', file)
      
      const endpoint = type === 'raw-footage' ? '/gigs/upload-raw-footage' : '/files/upload'
      const response = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      return response.data
    }
  },

  // Analytics (for dashboard charts)
  async getAnalytics(timeframe = '30d') {
    if (USE_MOCK_API) {
      // Generate mock analytics data
      const mockData = {
        views: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 100) + 50
        })),
        earnings: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 50) + 10
        })),
        engagement: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 20) + 5
        }))
      }
      return new Promise(resolve => setTimeout(() => resolve(mockData), 500))
    } else {
      const response = await axios.get(`/dashboard/analytics?timeframe=${timeframe}`)
      return response.data
    }
  }
}

export default api 