import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import userEvent from '@testing-library/user-event'

// Create a test wrapper with all necessary providers
export function renderWithProviders(ui, options = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  })

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
    user: userEvent.setup()
  }
}

// Helper function to render with custom query client
export function renderWithCustomQueryClient(ui, customQueryClient, options = {}) {
  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={customQueryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Mock user for authenticated tests
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  business_name: 'Test Business',
}

// Mock feedback data with comprehensive test scenarios
export const mockFeedback = [
  {
    id: 1,
    feedback_text: 'Great product!',
    sentiment: 'positive',
    source: 'Email',
    rating: 5,
    topics: ['product quality'],
    created_at: '2024-01-01T10:00:00Z',
    reviewer_name: 'John Doe'
  },
  {
    id: 2,
    feedback_text: 'Could be better',
    sentiment: 'neutral',
    source: 'Survey',
    rating: 3,
    topics: ['improvement'],
    created_at: '2024-01-02T10:00:00Z',
    reviewer_name: 'Jane Smith'
  },
  {
    id: 3,
    feedback_text: 'Poor quality and slow delivery',
    sentiment: 'negative',
    source: 'Google My Business',
    rating: 2,
    topics: ['quality', 'delivery'],
    created_at: '2024-01-03T10:00:00Z',
    reviewer_name: 'Bob Johnson'
  }
]

// Mock analytics data
export const mockAnalyticsData = {
  sentiment: {
    total: 100,
    positive: 60,
    neutral: 25,
    negative: 15
  },
  top_positive_topics: [
    { topic: 'product quality', count: 25 },
    { topic: 'fast shipping', count: 20 },
    { topic: 'great service', count: 15 },
    { topic: 'easy to use', count: 10 },
    { topic: 'good value', count: 8 }
  ],
  top_negative_topics: [
    { topic: 'slow delivery', count: 8 },
    { topic: 'poor quality', count: 6 },
    { topic: 'expensive', count: 4 },
    { topic: 'hard to use', count: 3 },
    { topic: 'bad service', count: 2 }
  ]
}

// Mock sources data
export const mockSources = [
  { source: 'Email', count: 45 },
  { source: 'Survey', count: 32 },
  { source: 'Google My Business', count: 18 },
  { source: 'Web Widget', count: 5 }
]

// Helper functions for common test scenarios
export const createMockFile = (name = 'test.csv', content = 'feedback_text\n"Great product"', type = 'text/csv') => {
  const file = new File([content], name, { type })
  Object.defineProperty(file, 'size', { value: content.length, writable: false })
  return file
}

export const createMockFormData = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

// Auth helpers
export const mockAuthResponse = {
  user: mockUser,
  token: 'mock-jwt-token'
}

export const mockLoginSuccess = {
  data: mockAuthResponse
}

export const mockLoginError = {
  response: {
    status: 401,
    data: {
      detail: 'Invalid credentials'
    }
  }
}

// API response helpers
export const createMockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {}
})

export const createMockApiError = (message = 'API Error', status = 500) => ({
  response: {
    status,
    data: { message },
    statusText: status === 404 ? 'Not Found' : 'Internal Server Error'
  }
})

// Chart.js mock helpers
export const mockChartData = {
  labels: ['Positive', 'Neutral', 'Negative'],
  datasets: [{
    data: [60, 25, 15],
    backgroundColor: [
      'rgba(34, 197, 94, 0.7)',
      'rgba(250, 204, 21, 0.7)',
      'rgba(239, 68, 68, 0.7)'
    ]
  }]
}

// Date helpers for consistent testing
export const mockDates = {
  recent: '2024-01-01T10:00:00Z',
  older: '2023-12-01T10:00:00Z',
  future: '2024-12-01T10:00:00Z'
}

// Pagination helpers
export const createMockPaginatedResponse = (items, page = 1, itemsPerPage = 10) => {
  const total = items.length
  const pages = Math.ceil(total / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = items.slice(startIndex, endIndex)
  
  return {
    items: paginatedItems,
    total,
    page,
    pages,
    per_page: itemsPerPage,
    has_next: page < pages,
    has_prev: page > 1
  }
}

// Testing utilities for async operations
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Mock implementations for common hooks
export const createMockUseQuery = (data, isLoading = false, error = null) => ({
  data,
  isLoading,
  error,
  refetch: () => {},
  isError: !!error,
  isSuccess: !isLoading && !error && !!data
})
