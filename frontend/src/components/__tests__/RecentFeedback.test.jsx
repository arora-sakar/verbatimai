import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import RecentFeedback from '../dashboard/RecentFeedback'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
  }
})

// Wrapper component for router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('RecentFeedback Component', () => {
  const mockRecentItems = [
    {
      id: 1,
      feedback_text: 'Great product with excellent quality!',
      sentiment: 'positive',
      source: 'Google My Business',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      feedback_text: 'Could be better in terms of delivery speed',
      sentiment: 'neutral',
      source: 'Email',
      created_at: '2024-01-14T09:20:00Z'
    },
    {
      id: 3,
      feedback_text: 'Very disappointed with the service quality and customer support response time',
      sentiment: 'negative',
      source: 'Survey',
      created_at: '2024-01-13T14:15:00Z'
    }
  ]

  const mockLongTextItem = {
    id: 4,
    feedback_text: 'This is an extremely long feedback text that should be truncated because it exceeds the 100 character limit set by the component for display purposes in the recent feedback section',
    sentiment: 'positive',
    source: 'Web Widget',
    created_at: '2024-01-12T11:45:00Z'
  }

  it('renders recent feedback items correctly', () => {
    renderWithRouter(<RecentFeedback items={mockRecentItems} />)
    
    expect(screen.getByText('Great product with excellent quality!')).toBeInTheDocument()
    expect(screen.getByText('Could be better in terms of delivery speed')).toBeInTheDocument()
    expect(screen.getByText(/Very disappointed with the service quality/)).toBeInTheDocument()
  })

  it('displays sentiment badges correctly', () => {
    renderWithRouter(<RecentFeedback items={mockRecentItems} />)
    
    // Check for sentiment badges
    expect(screen.getByText('Positive')).toBeInTheDocument()
    expect(screen.getByText('Neutral')).toBeInTheDocument()
    expect(screen.getByText('Negative')).toBeInTheDocument()
    
    // Check badge styling
    const positiveBadge = screen.getByText('Positive')
    expect(positiveBadge).toHaveClass('bg-green-100', 'text-green-800')
    
    const neutralBadge = screen.getByText('Neutral')
    expect(neutralBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
    
    const negativeBadge = screen.getByText('Negative')
    expect(negativeBadge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('displays feedback sources and dates', () => {
    renderWithRouter(<RecentFeedback items={mockRecentItems} />)
    
    expect(screen.getByText('Google My Business')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Survey')).toBeInTheDocument()
    
    // Check date formatting (dates should be formatted as locale strings)
    expect(screen.getByText(/1\/15\/2024|15\/1\/2024|Jan.*15.*2024/)).toBeInTheDocument()
  })

  it('truncates long feedback text', () => {
    renderWithRouter(<RecentFeedback items={[mockLongTextItem]} />)
    
    // Should show truncated text with ellipsis
    expect(screen.getByText(/This is an extremely long feedback text.*\.\.\./)).toBeInTheDocument()
    
    // Should not show the full text
    expect(screen.queryByText(/display purposes in the recent feedback section/)).not.toBeInTheDocument()
  })

  it('renders "View all feedback" link', () => {
    renderWithRouter(<RecentFeedback items={mockRecentItems} />)
    
    const viewAllLink = screen.getByText('View all feedback')
    expect(viewAllLink).toBeInTheDocument()
    expect(viewAllLink.closest('a')).toHaveAttribute('href', '/feedback')
  })

  it('shows empty state when no items provided', () => {
    renderWithRouter(<RecentFeedback items={[]} />)
    
    expect(screen.getByText('No feedback available yet')).toBeInTheDocument()
    expect(screen.queryByText('View all feedback')).not.toBeInTheDocument()
  })

  it('handles null items gracefully', () => {
    renderWithRouter(<RecentFeedback items={null} />)
    
    expect(screen.getByText('No feedback available yet')).toBeInTheDocument()
  })

  it('handles undefined items gracefully', () => {
    renderWithRouter(<RecentFeedback />)
    
    expect(screen.getByText('No feedback available yet')).toBeInTheDocument()
  })

  it('handles items with missing sentiment', () => {
    const itemWithoutSentiment = {
      id: 5,
      feedback_text: 'Feedback without sentiment',
      source: 'Email',
      created_at: '2024-01-10T12:00:00Z'
    }
    
    renderWithRouter(<RecentFeedback items={[itemWithoutSentiment]} />)
    
    expect(screen.getByText('Feedback without sentiment')).toBeInTheDocument()
    // Should not render any sentiment badge
    expect(screen.queryByText('Positive')).not.toBeInTheDocument()
    expect(screen.queryByText('Negative')).not.toBeInTheDocument()
    expect(screen.queryByText('Neutral')).not.toBeInTheDocument()
  })

  it('handles items with missing feedback text', () => {
    const itemWithoutText = {
      id: 6,
      sentiment: 'positive',
      source: 'Email',
      created_at: '2024-01-10T12:00:00Z'
    }
    
    renderWithRouter(<RecentFeedback items={[itemWithoutText]} />)
    
    expect(screen.getByText('No feedback text available')).toBeInTheDocument()
  })

  it('handles items with missing date', () => {
    const itemWithoutDate = {
      id: 7,
      feedback_text: 'Feedback without date',
      sentiment: 'positive',
      source: 'Email'
    }
    
    renderWithRouter(<RecentFeedback items={[itemWithoutDate]} />)
    
    expect(screen.getByText('No date')).toBeInTheDocument()
  })

  it('handles items with missing source', () => {
    const itemWithoutSource = {
      id: 8,
      feedback_text: 'Feedback without source',
      sentiment: 'positive',
      created_at: '2024-01-10T12:00:00Z'
    }
    
    renderWithRouter(<RecentFeedback items={[itemWithoutSource]} />)
    
    expect(screen.getByText('Unknown source')).toBeInTheDocument()
  })

  it('handles invalid date gracefully', () => {
    const itemWithInvalidDate = {
      id: 9,
      feedback_text: 'Feedback with invalid date',
      sentiment: 'positive',
      source: 'Email',
      created_at: 'invalid-date'
    }
    
    renderWithRouter(<RecentFeedback items={[itemWithInvalidDate]} />)
    
    // Should render without crashing
    expect(screen.getByText('Feedback with invalid date')).toBeInTheDocument()
  })

  it('capitalizes sentiment text correctly', () => {
    const itemsWithLowercaseSentiment = [
      { ...mockRecentItems[0], sentiment: 'positive' },
      { ...mockRecentItems[1], sentiment: 'neutral' },
      { ...mockRecentItems[2], sentiment: 'negative' }
    ]
    
    renderWithRouter(<RecentFeedback items={itemsWithLowercaseSentiment} />)
    
    expect(screen.getByText('Positive')).toBeInTheDocument()
    expect(screen.getByText('Neutral')).toBeInTheDocument()
    expect(screen.getByText('Negative')).toBeInTheDocument()
  })

  it('renders correct number of items', () => {
    renderWithRouter(<RecentFeedback items={mockRecentItems} />)
    
    // Should render all 3 items
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(3)
  })

  it('handles empty string feedback text', () => {
    const itemWithEmptyText = {
      id: 10,
      feedback_text: '',
      sentiment: 'positive',
      source: 'Email',
      created_at: '2024-01-10T12:00:00Z'
    }
    
    renderWithRouter(<RecentFeedback items={[itemWithEmptyText]} />)
    
    expect(screen.getByText('No feedback text available')).toBeInTheDocument()
  })

  it('displays separator between date and source', () => {
    renderWithRouter(<RecentFeedback items={mockRecentItems} />)
    
    // Check for middot separator
    expect(screen.getAllByText('·')).toHaveLength(mockRecentItems.length)
  })

  it('applies correct CSS classes for styling', () => {
    renderWithRouter(<RecentFeedback items={mockRecentItems} />)
    
    // Check for main container classes
    const container = screen.getByRole('list')
    expect(container).toHaveClass('divide-y', 'divide-gray-200')
    
    // Check link styling
    const viewAllLink = screen.getByText('View all feedback')
    expect(viewAllLink).toHaveClass('text-primary-600', 'hover:text-primary-500')
  })
})
