import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FeedbackItem from '../feedback/FeedbackItem'

// Mock the FeedbackDetailModal component
vi.mock('../feedback/FeedbackDetailModal', () => ({
  default: ({ isOpen, onClose, feedback }) => {
    return isOpen ? (
      <div data-testid="feedback-modal">
        <button onClick={onClose}>Close</button>
        <div data-testid="modal-feedback-text">{feedback.feedback_text}</div>
      </div>
    ) : null
  }
}))

// Helper to render FeedbackItem in a proper list context
const renderFeedbackItem = (item) => {
  return render(
    <ul>
      <FeedbackItem item={item} />
    </ul>
  )
}

describe('FeedbackItem Component', () => {
  const mockFeedbackItem = {
    id: 1,
    feedback_text: 'This is a great product with excellent quality and fast shipping!',
    sentiment: 'positive',
    source: 'Google My Business',
    topics: ['product quality', 'shipping speed'],
    created_at: '2024-01-15T10:30:00Z',
    rating: 5,
    reviewer_name: 'John Doe'
  }

  const mockFeedbackItemMinimal = {
    id: 2,
    feedback_text: 'Basic feedback text',
    sentiment: 'neutral',
    source: 'Email',
    created_at: '2024-01-10T14:20:00Z'
    // No topics, rating, or reviewer_name
  }

  it('renders feedback item correctly', () => {
    renderFeedbackItem(mockFeedbackItem)
    
    expect(screen.getByText('This is a great product with excellent quality and fast shipping!')).toBeInTheDocument()
    expect(screen.getByText('Positive')).toBeInTheDocument()
    expect(screen.getByText('Google My Business')).toBeInTheDocument()
    expect(screen.getByText('product quality')).toBeInTheDocument()
    expect(screen.getByText('shipping speed')).toBeInTheDocument()
    expect(screen.getByText('5/5')).toBeInTheDocument()
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toBeInTheDocument()
  })

  it('renders minimal feedback item without optional fields', () => {
    renderFeedbackItem(mockFeedbackItemMinimal)
    
    expect(screen.getByText('Basic feedback text')).toBeInTheDocument()
    expect(screen.getByText('Neutral')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    
    // Should not render rating or topics
    expect(screen.queryByText('5/5')).not.toBeInTheDocument()
    expect(screen.queryByText('product quality')).not.toBeInTheDocument()
  })

  it('formats date correctly', () => {
    renderFeedbackItem(mockFeedbackItem)
    
    // Check that date is formatted (exact format may vary by locale)
    expect(screen.getByText(/Jan.*15.*2024|15.*Jan.*2024/)).toBeInTheDocument()
  })

  it('renders different sentiment badges correctly', () => {
    // Test positive sentiment
    const positiveItem = { ...mockFeedbackItem, sentiment: 'positive' }
    const { rerender } = renderFeedbackItem(positiveItem)
    
    let sentimentBadge = screen.getByText('Positive')
    expect(sentimentBadge).toHaveClass('bg-green-100', 'text-green-800')
    
    // Test negative sentiment
    const negativeItem = { ...mockFeedbackItem, sentiment: 'negative' }
    rerender(<ul><FeedbackItem item={negativeItem} /></ul>)
    
    sentimentBadge = screen.getByText('Negative')
    expect(sentimentBadge).toHaveClass('bg-red-100', 'text-red-800')
    
    // Test neutral sentiment
    const neutralItem = { ...mockFeedbackItem, sentiment: 'neutral' }
    rerender(<ul><FeedbackItem item={neutralItem} /></ul>)
    
    sentimentBadge = screen.getByText('Neutral')
    expect(sentimentBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('handles missing sentiment gracefully', () => {
    const itemWithoutSentiment = { ...mockFeedbackItem, sentiment: null }
    renderFeedbackItem(itemWithoutSentiment)
    
    // Should not render any sentiment badge
    expect(screen.queryByText('Positive')).not.toBeInTheDocument()
    expect(screen.queryByText('Negative')).not.toBeInTheDocument()
    expect(screen.queryByText('Neutral')).not.toBeInTheDocument()
  })

  it('opens modal when clicked', () => {
    renderFeedbackItem(mockFeedbackItem)
    
    const feedbackItem = screen.getByRole('listitem')
    
    // Modal should not be visible initially
    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument()
    
    // Click to open modal
    fireEvent.click(feedbackItem)
    
    // Modal should now be visible
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument()
    // Check the modal specifically contains the feedback text
    expect(screen.getByTestId('modal-feedback-text')).toHaveTextContent('This is a great product with excellent quality and fast shipping!')
  })

  it('renders multiple topics correctly', () => {
    const itemWithManyTopics = {
      ...mockFeedbackItem,
      topics: ['quality', 'shipping', 'customer service', 'pricing', 'usability']
    }
    
    renderFeedbackItem(itemWithManyTopics)
    
    expect(screen.getByText('quality')).toBeInTheDocument()
    expect(screen.getByText('shipping')).toBeInTheDocument()
    expect(screen.getByText('customer service')).toBeInTheDocument()
    
    // Should show "+2 more" for the remaining topics
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('handles empty topics array', () => {
    const itemWithEmptyTopics = { ...mockFeedbackItem, topics: [] }
    renderFeedbackItem(itemWithEmptyTopics)
    
    // Should not render any topic elements
    expect(screen.queryByText('product quality')).not.toBeInTheDocument()
    expect(screen.queryByText('shipping speed')).not.toBeInTheDocument()
  })

  it('handles null topics', () => {
    const itemWithNullTopics = { ...mockFeedbackItem, topics: null }
    renderFeedbackItem(itemWithNullTopics)
    
    // Should not render any topic elements
    expect(screen.queryByText('product quality')).not.toBeInTheDocument()
    expect(screen.queryByText('shipping speed')).not.toBeInTheDocument()
  })

  it('displays rating when present', () => {
    renderFeedbackItem(mockFeedbackItem)
    
    expect(screen.getByText('5/5')).toBeInTheDocument()
  })

  it('hides rating when not present', () => {
    const itemWithoutRating = { ...mockFeedbackItem, rating: null }
    renderFeedbackItem(itemWithoutRating)
    
    expect(screen.queryByText('5/5')).not.toBeInTheDocument()
  })

  it('handles different rating values', () => {
    const itemWithLowRating = { ...mockFeedbackItem, rating: 2 }
    renderFeedbackItem(itemWithLowRating)
    
    expect(screen.getByText('2/5')).toBeInTheDocument()
  })

  it('displays source correctly', () => {
    // Test different sources
    const sources = ['Email', 'Survey', 'Web Widget', 'Google My Business']
    
    sources.forEach(source => {
      const itemWithSource = { ...mockFeedbackItem, source }
      const { rerender } = renderFeedbackItem(itemWithSource)
      
      expect(screen.getByText(source)).toBeInTheDocument()
      
      if (source !== sources[sources.length - 1]) {
        rerender(<ul><div /></ul>) // Clear between renders
      }
    })
  })

  it('has proper accessibility attributes', () => {
    renderFeedbackItem(mockFeedbackItem)
    
    const listItem = screen.getByRole('listitem')
    expect(listItem).toBeInTheDocument()
    expect(listItem).toHaveClass('cursor-pointer')
  })

  it('handles very long feedback text', () => {
    const longText = 'This is a very long feedback text that should be truncated when not expanded. '.repeat(10)
    const itemWithLongText = { ...mockFeedbackItem, feedback_text: longText }
    
    renderFeedbackItem(itemWithLongText)
    
    // The component truncates text with JavaScript, not CSS classes
    const feedbackText = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && content.includes('This is a very long feedback text')
    })
    expect(feedbackText).toBeInTheDocument()
    
    // Text should be truncated (ends with ...)
    expect(feedbackText.textContent?.endsWith('...')).toBe(true)
  })

  it('handles edge case with invalid date', () => {
    const itemWithInvalidDate = { ...mockFeedbackItem, created_at: 'invalid-date' }
    renderFeedbackItem(itemWithInvalidDate)
    
    // Should not crash, but might show "Invalid Date" - this is acceptable
    expect(screen.getByRole('listitem')).toBeInTheDocument()
  })

  it('capitalizes sentiment correctly', () => {
    const sentiments = ['positive', 'negative', 'neutral']
    
    sentiments.forEach(sentiment => {
      const itemWithSentiment = { ...mockFeedbackItem, sentiment }
      const { rerender } = renderFeedbackItem(itemWithSentiment)
      
      const expectedText = sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
      expect(screen.getByText(expectedText)).toBeInTheDocument()
      
      if (sentiment !== sentiments[sentiments.length - 1]) {
        rerender(<ul><div /></ul>) // Clear between renders
      }
    })
  })

  it('renders topic chips with correct styling', () => {
    renderFeedbackItem(mockFeedbackItem)
    
    const topicChip = screen.getByText('product quality')
    expect(topicChip).toHaveClass('bg-gray-100', 'text-gray-800', 'text-xs')
  })

  it('displays feedback metadata correctly', () => {
    renderFeedbackItem(mockFeedbackItem)
    
    // Check for date, source, and rating in metadata section
    expect(screen.getByText(/Jan.*15.*2024|15.*Jan.*2024/)).toBeInTheDocument()
    expect(screen.getByText('Google My Business')).toBeInTheDocument()
    expect(screen.getByText('5/5')).toBeInTheDocument()
  })

  it('displays customer name when present', () => {
    const itemWithCustomerName = { ...mockFeedbackItem, customer_name: 'Alice Johnson' }
    renderFeedbackItem(itemWithCustomerName)
    
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
  })

  it('does not display customer name when not present', () => {
    renderFeedbackItem(mockFeedbackItem)
    
    // The component checks for customer_name, not reviewer_name
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('closes modal when close button is clicked', () => {
    renderFeedbackItem(mockFeedbackItem)
    
    // Open modal
    fireEvent.click(screen.getByRole('listitem'))
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument()
    
    // Close modal
    fireEvent.click(screen.getByText('Close'))
    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument()
  })

  it('truncates very long text correctly', () => {
    const longText = 'A'.repeat(200) // Text longer than 150 characters
    const itemWithLongText = { ...mockFeedbackItem, feedback_text: longText }
    
    renderFeedbackItem(itemWithLongText)
    
    // Should see truncated text
    const truncatedElement = screen.getByText((content) => content.includes('A') && content.endsWith('...'))
    expect(truncatedElement).toBeInTheDocument()
  })
})
