import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import FeedbackFilters from '../feedback/FeedbackFilters'

// Simple mock for auth store
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 1, email: 'test@example.com' },
  }),
}))

// Simple mock for react-query that returns what we need
vi.mock('react-query', () => ({
  useQuery: () => ({
    data: [
      { source: 'Email', count: 25 },
      { source: 'Survey', count: 18 }
    ],
    isLoading: false,
    error: null
  }),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }) => children
}))

// Simple wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('FeedbackFilters Component', () => {
  const mockFilters = {
    sentiment: '',
    source: '',
    search: ''
  }

  const mockOnFilterChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <FeedbackFilters filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    )
    
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument()
    expect(screen.getByText('Sentiment')).toBeInTheDocument()
  })

  it('displays search input', () => {
    render(
      <TestWrapper>
        <FeedbackFilters filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    )
    
    const searchInput = screen.getByPlaceholderText('Search in feedback text...')
    expect(searchInput).toBeInTheDocument()
  })

  it('displays sentiment filter buttons', () => {
    render(
      <TestWrapper>
        <FeedbackFilters filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    )
    
    expect(screen.getByRole('button', { name: /positive/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /neutral/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /negative/i })).toBeInTheDocument()
  })

  it('displays source dropdown', () => {
    render(
      <TestWrapper>
        <FeedbackFilters filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    )
    
    expect(screen.getByLabelText(/source/i)).toBeInTheDocument()
    expect(screen.getByText('All Sources')).toBeInTheDocument()
  })

  it('shows filter components', () => {
    render(
      <TestWrapper>
        <FeedbackFilters filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    )
    
    // Check that all main filter elements are present
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/source/i)).toBeInTheDocument()
    expect(screen.getByText('Sentiment')).toBeInTheDocument()
  })
})
