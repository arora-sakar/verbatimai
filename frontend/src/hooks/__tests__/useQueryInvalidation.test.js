import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'

// Create a simple mock for react-query
const mockQueryClient = {
  invalidateQueries: vi.fn()
}

const mockUseQueryClient = vi.fn(() => mockQueryClient)

vi.mock('react-query', () => ({
  useQueryClient: mockUseQueryClient,
  QueryClient: vi.fn(() => mockQueryClient),
  QueryClientProvider: ({ children }) => children
}))

// Mock console.log
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

describe('useQueryInvalidation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consoleLogSpy.mockClear()
    mockQueryClient.invalidateQueries.mockClear()
  })

  it('returns invalidation functions', async () => {
    // Dynamic import to ensure mocks are applied
    const { useQueryInvalidation } = await import('../useQueryInvalidation.js')
    const { result } = renderHook(() => useQueryInvalidation())
    
    expect(typeof result.current.invalidateDashboard).toBe('function')
    expect(typeof result.current.invalidateAll).toBe('function')
  })

  it('invalidates dashboard queries', async () => {
    const { useQueryInvalidation } = await import('../useQueryInvalidation.js')
    const { result } = renderHook(() => useQueryInvalidation())
    
    result.current.invalidateDashboard()
    
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith(['analytics'])
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith(['recentFeedback'])
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith(['sources'])
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith(['feedback'])
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(4)
  })

  it('invalidates all queries', async () => {
    const { useQueryInvalidation } = await import('../useQueryInvalidation.js')
    const { result } = renderHook(() => useQueryInvalidation())
    
    result.current.invalidateAll()
    
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith()
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1)
  })

  it('logs invalidation messages', async () => {
    const { useQueryInvalidation } = await import('../useQueryInvalidation.js')
    const { result } = renderHook(() => useQueryInvalidation())
    
    result.current.invalidateDashboard()
    result.current.invalidateAll()
    
    expect(consoleLogSpy).toHaveBeenCalledWith('Invalidating dashboard queries...')
    expect(consoleLogSpy).toHaveBeenCalledWith('Invalidating all queries...')
  })
})
