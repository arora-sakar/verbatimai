import axios from 'axios'

// Environment-based API configuration
const getBaseURL = () => {
  const environment = import.meta.env.MODE || 'development'
  
  if (environment === 'production') {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
  }
  
  // Development mode - use proxy
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token to every request
api.interceptors.request.use(
  (config) => {
    // Try to get the token from localStorage
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage)
        if (state.token) {
          config.headers['Authorization'] = `Bearer ${state.token}`
          console.log('Added auth token to request:', config.url)
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error)
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized globally
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login if unauthorized
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api