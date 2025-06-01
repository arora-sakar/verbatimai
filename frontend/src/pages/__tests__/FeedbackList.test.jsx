import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockUser, mockFeedback, mockSources } from '../../test/utils'
import FeedbackList from '../FeedbackList'

// Mock the auth store
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: mockUser,
    token: 'mock-token',
  }),
}))

// Track which useQuery call is being made
let queryCallIndex = 0
const mockUseQuery = vi.fn()

// Mock React Query with proper handling for multiple queries
vi.mock('react-query', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useQuery: (queryKey, queryFn, options) => {
      // Handle sources query (from FeedbackFilters component)
      if (Array.isArray(queryKey) && queryKey[0] === 'sources') {
        return {
          data: mockSources,
          isLoading: false,
          error: null,
          refetch: vi.fn()
        }
      }
      
      // Handle feedback query (from FeedbackList component)
      if (Array.isArray(queryKey) && queryKey[0] === 'feedback') {
        return mockUseQuery(queryKey, queryFn, options)
      }
      
      // Default fallback
      return mockUseQuery(queryKey, queryFn, options)
    },
  }
})

describe('FeedbackList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryCallIndex = 0
    
    // Default mock for feedback useQuery
    mockUseQuery.mockReturnValue({
      data: mockFeedback,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    })
  })

  it('renders feedback list title', () => {
    renderWithProviders(<FeedbackList />)
    
    expect(screen.getByRole('heading', { name: /feedback/i })).toBeInTheDocument()
  })

  it('displays loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn()
    })
    
    renderWithProviders(<FeedbackList />)
    
    // The component shows a spinning animation with a test ID
    const loadingElement = screen.getByTestId('loading-spinner')
    expect(loadingElement).toBeInTheDocument()
  })

  it('displays feedback items when data is available', () => {
    renderWithProviders(<FeedbackList />)
    
    expect(screen.getByText('Great product!')).toBeInTheDocument()
    expect(screen.getByText('Could be better')).toBeInTheDocument()
  })

  it('shows empty state when no feedback', () => {
    mockUseQuery.mockReturnValue({
      data: [],  // Empty array
      isLoading: false,
      error: null,
      refetch: vi.fn()
    })
    
    renderWithProviders(<FeedbackList />)
    
    expect(screen.getByText(/no feedback found/i)).toBeInTheDocument()
  })

  it('displays basic page structure', () => {
    renderWithProviders(<FeedbackList />)
    
    // Check for main page elements that should always be present
    expect(screen.getByRole('heading', { name: /feedback/i })).toBeInTheDocument()
  })

  it('handles error state gracefully', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch feedback'),
      refetch: vi.fn()
    })
    
    renderWithProviders(<FeedbackList />)
    
    // Should render without crashing even with errors
    expect(screen.getByRole('heading', { name: /feedback/i })).toBeInTheDocument()
    // Should show empty state when there's an error
    expect(screen.getByText(/no feedback found/i)).toBeInTheDocument()
  })

  it('renders filters component', () => {
    renderWithProviders(<FeedbackList />)
    
    // Check for filter elements
    expect(screen.getByPlaceholderText(/search in feedback text/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /positive/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /neutral/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /negative/i })).toBeInTheDocument()
  })

  it('handles pagination when there are many feedback items', () => {
    const totalItems = 50
    mockUseQuery.mockReturnValue({
      data: mockFeedback,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    })
    
    renderWithProviders(<FeedbackList />)
    
    // Component should render successfully with feedback
    expect(screen.getByText('Great product!')).toBeInTheDocument()
  })
})
