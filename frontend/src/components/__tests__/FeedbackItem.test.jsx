import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FeedbackItem from '../feedback/FeedbackItem'

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
    render(<FeedbackItem item={mockFeedbackItem} />)
    
    expect(screen.getByText('This is a great product with excellent quality and fast shipping!')).toBeInTheDocument()
    expect(screen.getByText('Positive')).toBeInTheDocument()
    expect(screen.getByText('Google My Business')).toBeInTheDocument()
    expect(screen.getByText('product quality')).toBeInTheDocument()
    expect(screen.getByText('shipping speed')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('★')).toBeInTheDocument()
  })

  it('renders minimal feedback item without optional fields', () => {
    render(<FeedbackItem item={mockFeedbackItemMinimal} />)
    
    expect(screen.getByText('Basic feedback text')).toBeInTheDocument()
    expect(screen.getByText('Neutral')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    
    // Should not render rating or topics
    expect(screen.queryByText('★')).not.toBeInTheDocument()
    expect(screen.queryByText('product quality')).not.toBeInTheDocument()
  })

  it('formats date correctly', () => {
    render(<FeedbackItem item={mockFeedbackItem} />)
    
    // Check that date is formatted (exact format may vary by locale)
    expect(screen.getByText(/Jan.*15.*2024|15.*Jan.*2024/)).toBeInTheDocument()
  })

  it('renders different sentiment badges correctly', () => {
    // Test positive sentiment
    const positiveItem = { ...mockFeedbackItem, sentiment: 'positive' }
    const { rerender } = render(<FeedbackItem item={positiveItem} />)
    
    let sentimentBadge = screen.getByText('Positive')
    expect(sentimentBadge).toHaveClass('bg-green-100', 'text-green-800')
    
    // Test negative sentiment
    const negativeItem = { ...mockFeedbackItem, sentiment: 'negative' }
    rerender(<FeedbackItem item={negativeItem} />)
    
    sentimentBadge = screen.getByText('Negative')
    expect(sentimentBadge).toHaveClass('bg-red-100', 'text-red-800')
    
    // Test neutral sentiment
    const neutralItem = { ...mockFeedbackItem, sentiment: 'neutral' }
    rerender(<FeedbackItem item={neutralItem} />)
    
    sentimentBadge = screen.getByText('Neutral')
    expect(sentimentBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('handles missing sentiment gracefully', () => {
    const itemWithoutSentiment = { ...mockFeedbackItem, sentiment: null }
    render(<FeedbackItem item={itemWithoutSentiment} />)
    
    // Should not render any sentiment badge
    expect(screen.queryByText('Positive')).not.toBeInTheDocument()
    expect(screen.queryByText('Negative')).not.toBeInTheDocument()
    expect(screen.queryByText('Neutral')).not.toBeInTheDocument()
  })

  it('toggles expanded state when clicked', () => {
    render(<FeedbackItem item={mockFeedbackItem} />)
    
    const feedbackItem = screen.getByRole('listitem')
    const feedbackText = screen.getByText('This is a great product with excellent quality and fast shipping!')
    
    // Initially should have line-clamp-2 class (collapsed)
    expect(feedbackText).toHaveClass('line-clamp-2')
    
    // Click to expand
    fireEvent.click(feedbackItem)
    
    // Should no longer have line-clamp-2 class (expanded)
    expect(feedbackText).not.toHaveClass('line-clamp-2')
    
    // Click again to collapse
    fireEvent.click(feedbackItem)
    
    // Should have line-clamp-2 class again (collapsed)
    expect(feedbackText).toHaveClass('line-clamp-2')
  })

  it('renders multiple topics correctly', () => {
    const itemWithManyTopics = {
      ...mockFeedbackItem,
      topics: ['quality', 'shipping', 'customer service', 'pricing', 'usability']
    }
    
    render(<FeedbackItem item={itemWithManyTopics} />)
    
    expect(screen.getByText('quality')).toBeInTheDocument()
    expect(screen.getByText('shipping')).toBeInTheDocument()
    expect(screen.getByText('customer service')).toBeInTheDocument()
    expect(screen.getByText('pricing')).toBeInTheDocument()
    expect(screen.getByText('usability')).toBeInTheDocument()
  })

  it('handles empty topics array', () => {
    const itemWithEmptyTopics = { ...mockFeedbackItem, topics: [] }
    render(<FeedbackItem item={itemWithEmptyTopics} />)
    
    // Should not render any topic elements
    expect(screen.queryByText('product quality')).not.toBeInTheDocument()
    expect(screen.queryByText('shipping speed')).not.toBeInTheDocument()
  })

  it('handles null topics', () => {
    const itemWithNullTopics = { ...mockFeedbackItem, topics: null }
    render(<FeedbackItem item={itemWithNullTopics} />)
    
    // Should not render any topic elements
    expect(screen.queryByText('product quality')).not.toBeInTheDocument()
    expect(screen.queryByText('shipping speed')).not.toBeInTheDocument()
  })

  it('displays rating when present', () => {
    render(<FeedbackItem item={mockFeedbackItem} />)
    
    expect(screen.getByText('★')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('hides rating when not present', () => {
    const itemWithoutRating = { ...mockFeedbackItem, rating: null }
    render(<FeedbackItem item={itemWithoutRating} />)
    
    expect(screen.queryByText('★')).not.toBeInTheDocument()
  })

  it('handles different rating values', () => {
    const itemWithLowRating = { ...mockFeedbackItem, rating: 2 }
    render(<FeedbackItem item={itemWithLowRating} />)
    
    expect(screen.getByText('★')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('displays source correctly', () => {
    // Test different sources
    const sources = ['Email', 'Survey', 'Web Widget', 'Google My Business']
    
    sources.forEach(source => {
      const itemWithSource = { ...mockFeedbackItem, source }
      const { rerender } = render(<FeedbackItem item={itemWithSource} />)
      
      expect(screen.getByText(source)).toBeInTheDocument()
      
      if (source !== sources[sources.length - 1]) {
        rerender(<div />) // Clear between renders
      }
    })
  })

  it('has proper accessibility attributes', () => {
    render(<FeedbackItem item={mockFeedbackItem} />)
    
    const listItem = screen.getByRole('listitem')
    expect(listItem).toBeInTheDocument()
    expect(listItem).toHaveClass('cursor-pointer')
  })

  it('handles very long feedback text', () => {
    const longText = 'This is a very long feedback text that should be truncated when not expanded. '.repeat(10)
    const itemWithLongText = { ...mockFeedbackItem, feedback_text: longText }
    
    render(<FeedbackItem item={itemWithLongText} />)
    
    // Find the feedback text element using a partial match
    const feedbackText = screen.getByText(/This is a very long feedback text/)
    expect(feedbackText).toHaveClass('line-clamp-2')
    
    // Click to expand
    fireEvent.click(screen.getByRole('listitem'))
    
    // Should no longer be truncated
    expect(feedbackText).not.toHaveClass('line-clamp-2')
  })

  it('handles edge case with invalid date', () => {
    const itemWithInvalidDate = { ...mockFeedbackItem, created_at: 'invalid-date' }
    render(<FeedbackItem item={itemWithInvalidDate} />)
    
    // Should not crash, but might show "Invalid Date" - this is acceptable
    expect(screen.getByRole('listitem')).toBeInTheDocument()
  })

  it('capitalizes sentiment correctly', () => {
    const sentiments = ['positive', 'negative', 'neutral']
    
    sentiments.forEach(sentiment => {
      const itemWithSentiment = { ...mockFeedbackItem, sentiment }
      const { rerender } = render(<FeedbackItem item={itemWithSentiment} />)
      
      const expectedText = sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
      expect(screen.getByText(expectedText)).toBeInTheDocument()
      
      if (sentiment !== sentiments[sentiments.length - 1]) {
        rerender(<div />) // Clear between renders
      }
    })
  })

  it('renders topic chips with correct styling', () => {
    render(<FeedbackItem item={mockFeedbackItem} />)
    
    const topicChip = screen.getByText('product quality')
    expect(topicChip).toHaveClass('bg-gray-100', 'text-gray-800', 'text-xs')
  })

  it('displays feedback metadata correctly', () => {
    render(<FeedbackItem item={mockFeedbackItem} />)
    
    // Check for date, source, and rating in metadata section
    expect(screen.getByText(/Jan.*15.*2024|15.*Jan.*2024/)).toBeInTheDocument()
    expect(screen.getByText('Google My Business')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    
    // Check for separator
    expect(screen.getByText('·')).toBeInTheDocument()
  })
})
