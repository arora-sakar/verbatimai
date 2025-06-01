import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, mockUser } from '../../test/utils'
import Dashboard from '../Dashboard'

// Mock Chart.js to prevent canvas errors
vi.mock('chart.js', () => {
  const Chart = vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
  }))
  Chart.register = vi.fn()
  
  return {
    Chart,
    CategoryScale: vi.fn(),
    LinearScale: vi.fn(),
    BarElement: vi.fn(),
    Title: vi.fn(),
    Tooltip: vi.fn(),
    Legend: vi.fn(),
    ArcElement: vi.fn(),
    DoughnutController: vi.fn(),
    BarController: vi.fn(),
    register: vi.fn(),
  }
})

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Doughnut: ({ data, options }) => (
    <div data-testid="mock-doughnut-chart">
      <span>Mock Doughnut Chart</span>
    </div>
  ),
  Bar: ({ data, options }) => (
    <div data-testid="mock-bar-chart">
      <span>Mock Bar Chart</span>
    </div>
  ),
  Pie: ({ data, options }) => (
    <div data-testid="mock-pie-chart">
      <span>Mock Pie Chart</span>
    </div>
  ),
}))

// Mock the auth store
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: mockUser,
    token: 'mock-token',
  }),
}))

// Mock React Query
const mockUseQuery = vi.fn()
vi.mock('react-query', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useQuery: (queryKey) => {
      // Return different mock data based on the query key
      if (Array.isArray(queryKey) && queryKey[0] === 'recentFeedback') {
        return {
          data: [],
          isLoading: false,
          error: null,
          refetch: vi.fn()
        }
      }
      // Default to analytics query mock
      return mockUseQuery()
    },
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
      refetchQueries: vi.fn(),
    }),
  }
})

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock for analytics query
    mockUseQuery.mockReturnValue({
      data: { sentiment: { total: 0 } },
      isLoading: false,
      refetch: vi.fn(),
    })
  })

  it('shows loading state initially', async () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    })

    renderWithProviders(<Dashboard />)
    
    // Look for the spinning loading element
    const loadingElement = await screen.findByTestId('dashboard-loading-spinner')
    expect(loadingElement).toBeInTheDocument()
  })

  it('shows welcome message when no data', async () => {
    mockUseQuery.mockReturnValue({
      data: { sentiment: { total: 0 } },
      isLoading: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/welcome to smb feedback insights/i)).toBeInTheDocument()
      expect(screen.getByText(/upload feedback/i)).toBeInTheDocument()
    })
  })

  it('shows dashboard content when data is available', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        sentiment: { total: 10, positive: 7, negative: 2, neutral: 1 },
        top_positive_topics: [{ topic: 'quality', count: 5 }],
        top_negative_topics: [{ topic: 'shipping', count: 2 }],
      },
      isLoading: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/sentiment overview/i)).toBeInTheDocument()
      expect(screen.getByText(/top topics/i)).toBeInTheDocument()
      // Check for mocked chart component
      expect(screen.getByTestId('mock-pie-chart')).toBeInTheDocument()
    })
  })

  it('renders dashboard title', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders refresh button', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText('Refresh Data')).toBeInTheDocument()
  })

  it('handles error state gracefully', async () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch analytics'),
      refetch: vi.fn(),
    })

    renderWithProviders(<Dashboard />)
    
    // Should render without crashing even with errors
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      // Should show welcome message when there's an error
      expect(screen.getByText(/welcome to smb feedback insights/i)).toBeInTheDocument()
    })
  })

  it('displays feedback sections when there is data', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        sentiment: { total: 15, positive: 10, negative: 3, neutral: 2 },
        top_positive_topics: [{ topic: 'service', count: 8 }],
        top_negative_topics: [{ topic: 'delivery', count: 3 }],
      },
      isLoading: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/sentiment overview/i)).toBeInTheDocument()
      expect(screen.getByText(/top topics/i)).toBeInTheDocument()
      expect(screen.getByText(/feedback summary/i)).toBeInTheDocument()
      expect(screen.getByText(/recent feedback/i)).toBeInTheDocument()
    })
  })
})
