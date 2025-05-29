import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useQueryClient } from 'react-query'
import api from '../services/api'

// Create a function to get access to the queryClient outside of components
let queryClientInstance = null
export const setQueryClientForAuth = (client) => {
  queryClientInstance = client
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email, password) => {
        try {
          // Use the JSON login endpoint that expects email
          const response = await api.post('/auth/login/json', { email, password })
          const { user, token } = response.data
          
          // Log the token to verify it's received
          console.log('Received token:', token)
          
          // Set the authentication state
          set({ user, token, isAuthenticated: true })
          
          // Set the token in the API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Log that the token has been set in headers
          console.log('Token set in Authorization header')
          
          return { success: true }
        } catch (error) {
          console.error('Login error:', error.response?.data)
          return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || 'Login failed' 
          }
        }
      },
      
      register: async (userData) => {
        try {
          const response = await api.post('/auth/register', userData)
          return { success: true, data: response.data }
        } catch (error) {
          return { 
            success: false, 
            message: error.response?.data?.message || 'Registration failed' 
          }
        }
      },
      
      logout: () => {
        // Clear authentication state
        set({ user: null, token: null, isAuthenticated: false })
        delete api.defaults.headers.common['Authorization']
        
        // Clear React Query cache if available
        if (queryClientInstance) {
          console.log('Clearing React Query cache on logout')
          queryClientInstance.clear()
        } else {
          console.warn('QueryClient not available, cache not cleared')
        }
        
        // Also clear localStorage cache of React Query
        try {
          const queryKeys = Object.keys(localStorage).filter(key => key.startsWith('reactQueryData'))
          queryKeys.forEach(key => localStorage.removeItem(key))
          console.log(`Cleared ${queryKeys.length} React Query cache items from localStorage`)
        } catch (e) {
          console.error('Error clearing React Query localStorage cache:', e)
        }
      },
      
      checkAuth: async () => {
        const token = get().token
        if (!token) return false
        
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/auth/verify')
          set({ user: response.data, isAuthenticated: true })
          return true
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false })
          delete api.defaults.headers.common['Authorization']
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)