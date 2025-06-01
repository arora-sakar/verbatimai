import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock the API module first before importing authStore
const mockApi = {
  post: vi.fn(),
  get: vi.fn(),
  defaults: {
    headers: {
      common: {}
    }
  }
}

vi.mock('../../services/api', () => ({
  default: mockApi
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock console methods
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('Auth Store', () => {
  let useAuthStore, setQueryClientForAuth
  let mockQueryClient

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Reset API mock
    mockApi.post.mockClear()
    mockApi.get.mockClear()
    mockApi.defaults.headers.common = {}
    
    // Reset localStorage mock
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    
    // Create mock query client
    mockQueryClient = {
      clear: vi.fn()
    }
    
    // Import authStore after mocks are set up
    const authStoreModule = await import('../authStore')
    useAuthStore = authStoreModule.useAuthStore
    setQueryClientForAuth = authStoreModule.setQueryClientForAuth
    
    // Reset query client
    setQueryClientForAuth(mockQueryClient)
    
    // Clear console spies
    consoleLogSpy.mockClear()
    consoleErrorSpy.mockClear()
    consoleWarnSpy.mockClear()
  })

  afterEach(() => {
    // Reset the store state if available
    if (useAuthStore) {
      act(() => {
        useAuthStore.getState().logout()
      })
    }
  })

  it('has correct initial state', () => {
    const { result } = renderHook(() => useAuthStore())
    
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('provides all required methods', () => {
    const { result } = renderHook(() => useAuthStore())
    
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.register).toBe('function')
    expect(typeof result.current.logout).toBe('function')
    expect(typeof result.current.checkAuth).toBe('function')
  })

  it('successfully logs in user', async () => {
    const mockResponse = {
      data: {
        user: { id: 1, email: 'test@example.com', business_name: 'Test Business' },
        token: 'mock-jwt-token'
      }
    }
    
    mockApi.post.mockResolvedValue(mockResponse)
    
    const { result } = renderHook(() => useAuthStore())
    
    let loginResult
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password123')
    })
    
    expect(mockApi.post).toHaveBeenCalledWith('/auth/login/json', {
      email: 'test@example.com',
      password: 'password123'
    })
    
    expect(loginResult).toEqual({ success: true })
    expect(result.current.user).toEqual(mockResponse.data.user)
    expect(result.current.token).toBe('mock-jwt-token')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles login failure', async () => {
    const mockError = {
      response: {
        data: {
          detail: 'Invalid credentials'
        }
      }
    }
    
    mockApi.post.mockRejectedValue(mockError)
    
    const { result } = renderHook(() => useAuthStore())
    
    let loginResult
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'wrongpassword')
    })
    
    expect(loginResult).toEqual({
      success: false,
      message: 'Invalid credentials'
    })
  })

  it('successfully registers user', async () => {
    const mockResponse = {
      data: {
        message: 'User created successfully',
        user: { id: 1, email: 'new@example.com' }
      }
    }
    
    mockApi.post.mockResolvedValue(mockResponse)
    
    const { result } = renderHook(() => useAuthStore())
    
    const userData = {
      email: 'new@example.com',
      password: 'password123',
      business_name: 'New Business'
    }
    
    let registerResult
    await act(async () => {
      registerResult = await result.current.register(userData)
    })
    
    expect(mockApi.post).toHaveBeenCalledWith('/auth/register', userData)
    expect(registerResult).toEqual({
      success: true,
      data: mockResponse.data
    })
  })

  it('handles registration failure', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Email already exists'
        }
      }
    }
    
    mockApi.post.mockRejectedValue(mockError)
    
    const { result } = renderHook(() => useAuthStore())
    
    let registerResult
    await act(async () => {
      registerResult = await result.current.register({
        email: 'existing@example.com',
        password: 'password123'
      })
    })
    
    expect(registerResult).toEqual({
      success: false,
      message: 'Email already exists'
    })
  })

  it('clears authentication state on logout', () => {
    const { result } = renderHook(() => useAuthStore())
    
    // Set some initial state
    act(() => {
      useAuthStore.setState({
        user: { id: 1, email: 'test@example.com' },
        token: 'test-token',
        isAuthenticated: true
      })
    })
    
    expect(result.current.isAuthenticated).toBe(true)
    
    act(() => {
      result.current.logout()
    })
    
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('verifies valid token successfully', async () => {
    const mockUser = { id: 1, email: 'test@example.com' }
    const mockResponse = { data: mockUser }
    
    mockApi.get.mockResolvedValue(mockResponse)
    
    const { result } = renderHook(() => useAuthStore())
    
    // Set initial token
    act(() => {
      useAuthStore.setState({ token: 'valid-token' })
    })
    
    let authResult
    await act(async () => {
      authResult = await result.current.checkAuth()
    })
    
    expect(mockApi.get).toHaveBeenCalledWith('/auth/verify')
    expect(authResult).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles invalid token', async () => {
    const mockError = {
      response: {
        status: 401,
        data: { message: 'Invalid token' }
      }
    }
    
    mockApi.get.mockRejectedValue(mockError)
    
    const { result } = renderHook(() => useAuthStore())
    
    // Set initial token
    act(() => {
      useAuthStore.setState({ token: 'invalid-token' })
    })
    
    let authResult
    await act(async () => {
      authResult = await result.current.checkAuth()
    })
    
    expect(authResult).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns false when no token exists', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    let authResult
    await act(async () => {
      authResult = await result.current.checkAuth()
    })
    
    expect(authResult).toBe(false)
    expect(mockApi.get).not.toHaveBeenCalled()
  })

  it('clears React Query cache when available', () => {
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.logout()
    })
    
    expect(mockQueryClient.clear).toHaveBeenCalled()
  })

  it('handles missing query client gracefully', () => {
    setQueryClientForAuth(null)
    
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.logout()
    })
    
    expect(consoleWarnSpy).toHaveBeenCalledWith('QueryClient not available, cache not cleared')
  })

  it('handles API errors gracefully', async () => {
    mockApi.post.mockRejectedValue(new Error('Network failure'))
    
    const { result } = renderHook(() => useAuthStore())
    
    let loginResult
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password')
    })
    
    expect(loginResult.success).toBe(false)
    expect(loginResult.message).toBe('Login failed')
  })
})
