import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock localStorage before any imports
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock window.location
delete window.location
window.location = { 
  href: '', 
  pathname: '/', 
  assign: vi.fn() 
}

// Mock console methods
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('API Service', () => {
  let api

  beforeEach(async () => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.removeItem.mockClear()
    consoleLogSpy.mockClear()
    consoleErrorSpy.mockClear()
    
    // Reset window.location
    window.location.pathname = '/'
    window.location.href = ''
    
    // Import the API module fresh for each test
    const apiModule = await import('../api.js')
    api = apiModule.default
  })

  it('is properly configured', () => {
    expect(api).toBeDefined()
    expect(api.defaults.baseURL).toBe('/api')
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('has interceptors configured', () => {
    expect(api.interceptors.request.handlers).toBeDefined()
    expect(api.interceptors.response.handlers).toBeDefined()
    expect(api.interceptors.request.handlers.length).toBeGreaterThan(0)
    expect(api.interceptors.response.handlers.length).toBeGreaterThan(0)
  })

  it('supports GET requests', async () => {
    const mockResponse = { data: { test: 'data' } }
    vi.spyOn(api, 'get').mockResolvedValue(mockResponse)
    
    const response = await api.get('/test')
    expect(response).toEqual(mockResponse)
    expect(api.get).toHaveBeenCalledWith('/test')
  })

  it('supports POST requests', async () => {
    const mockResponse = { data: { created: true } }
    const postData = { name: 'test' }
    vi.spyOn(api, 'post').mockResolvedValue(mockResponse)
    
    const response = await api.post('/test', postData)
    expect(response).toEqual(mockResponse)
    expect(api.post).toHaveBeenCalledWith('/test', postData)
  })

  it('supports PUT requests', async () => {
    const mockResponse = { data: { updated: true } }
    const putData = { name: 'updated' }
    vi.spyOn(api, 'put').mockResolvedValue(mockResponse)
    
    const response = await api.put('/test/1', putData)
    expect(response).toEqual(mockResponse)
    expect(api.put).toHaveBeenCalledWith('/test/1', putData)
  })

  it('supports DELETE requests', async () => {
    const mockResponse = { data: { deleted: true } }
    vi.spyOn(api, 'delete').mockResolvedValue(mockResponse)
    
    const response = await api.delete('/test/1')
    expect(response).toEqual(mockResponse)
    expect(api.delete).toHaveBeenCalledWith('/test/1')
  })

  it('handles request errors', async () => {
    const mockError = new Error('Network Error')
    vi.spyOn(api, 'get').mockRejectedValue(mockError)
    
    try {
      await api.get('/test')
      fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBe(mockError)
    }
  })

  it('handles 401 errors', async () => {
    const mockError = {
      response: { status: 401, data: { message: 'Unauthorized' } }
    }
    
    vi.spyOn(api, 'get').mockRejectedValue(mockError)
    
    try {
      await api.get('/protected')
      fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBe(mockError)
    }
  })

  it('handles server errors', async () => {
    const mockError = {
      response: { status: 500, data: { message: 'Server Error' } }
    }
    
    vi.spyOn(api, 'get').mockRejectedValue(mockError)
    
    try {
      await api.get('/test')
      fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBe(mockError)
    }
  })
})
