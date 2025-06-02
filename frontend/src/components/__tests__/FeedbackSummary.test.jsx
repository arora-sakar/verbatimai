import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FeedbackSummary from '../dashboard/FeedbackSummary'

describe('FeedbackSummary Component', () => {
  const mockData = {
    positive: 15,
    negative: 5,
    neutral: 8,
    total: 28
  }

  const mockEmptyData = {
    positive: 0,
    negative: 0,
    neutral: 0,
    total: 0
  }

  const mockSingleItemData = {
    positive: 1,
    negative: 0,
    neutral: 0,
    total: 1
  }

  it('renders feedback summary correctly with data', () => {
    render(<FeedbackSummary data={mockData} />)
    
    // Check total feedback display
    expect(screen.getByText('Total Feedback')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
    
    // Check sentiment labels
    expect(screen.getByText('Positive')).toBeInTheDocument()
    expect(screen.getByText('Neutral')).toBeInTheDocument()
    expect(screen.getByText('Negative')).toBeInTheDocument()
  })

  it('calculates and displays percentages correctly', () => {
    render(<FeedbackSummary data={mockData} />)
    
    // Positive: 15/28 = 53.57% → rounds to 54%
    expect(screen.getByText('15 (54%)')).toBeInTheDocument()
    
    // Neutral: 8/28 = 28.57% → rounds to 29%
    expect(screen.getByText('8 (29%)')).toBeInTheDocument()
    
    // Negative: 5/28 = 17.86% → rounds to 18%
    expect(screen.getByText('5 (18%)')).toBeInTheDocument()
  })

  it('handles zero data correctly', () => {
    render(<FeedbackSummary data={mockEmptyData} />)
    
    // Should show 0 for total
    expect(screen.getByText('0')).toBeInTheDocument() // Total
    
    // Check that all sentiment categories show 0 (0%)
    const zeroPercentages = screen.getAllByText('0 (0%)')
    expect(zeroPercentages).toHaveLength(3) // positive, neutral, negative
  })

  it('handles single item data correctly', () => {
    render(<FeedbackSummary data={mockSingleItemData} />)
    
    expect(screen.getByText('1')).toBeInTheDocument() // Total
    expect(screen.getByText('1 (100%)')).toBeInTheDocument() // Positive
    
    // Should have two entries with 0 (0%) for neutral and negative
    const zeroPercentages = screen.getAllByText('0 (0%)')
    expect(zeroPercentages).toHaveLength(2) // neutral and negative
  })

  it('renders progress bars with correct widths', () => {
    render(<FeedbackSummary data={mockData} />)
    
    // Get progress bars by their CSS classes
    const positiveBar = document.querySelector('.bg-green-600')
    const neutralBar = document.querySelector('.bg-yellow-500')
    const negativeBar = document.querySelector('.bg-red-600')
    
    // Check positive progress bar (54%)
    expect(positiveBar).toHaveStyle({ width: '54%' })
    expect(positiveBar).toHaveClass('bg-green-600')
    
    // Check neutral progress bar (29%)
    expect(neutralBar).toHaveStyle({ width: '29%' })
    expect(neutralBar).toHaveClass('bg-yellow-500')
    
    // Check negative progress bar (18%)
    expect(negativeBar).toHaveStyle({ width: '18%' })
    expect(negativeBar).toHaveClass('bg-red-600')
  })

  it('applies correct CSS classes for sentiment colors', () => {
    render(<FeedbackSummary data={mockData} />)
    
    // Check positive sentiment styling
    const positiveLabel = screen.getByText('Positive')
    expect(positiveLabel).toHaveClass('text-green-600')
    
    // Check neutral sentiment styling
    const neutralLabel = screen.getByText('Neutral')
    expect(neutralLabel).toHaveClass('text-yellow-500')
    
    // Check negative sentiment styling
    const negativeLabel = screen.getByText('Negative')
    expect(negativeLabel).toHaveClass('text-red-600')
  })

  it('renders divider line', () => {
    const { container } = render(<FeedbackSummary data={mockData} />)
    
    // Check for divider element
    const divider = container.querySelector('.h-px.bg-gray-200')
    expect(divider).toBeInTheDocument()
  })

  it('handles edge case with high numbers', () => {
    const largeData = {
      positive: 9500,
      negative: 300,
      neutral: 200,
      total: 10000
    }
    
    render(<FeedbackSummary data={largeData} />)
    
    expect(screen.getByText('10000')).toBeInTheDocument()
    expect(screen.getByText('9500 (95%)')).toBeInTheDocument()
    expect(screen.getByText('200 (2%)')).toBeInTheDocument()
    expect(screen.getByText('300 (3%)')).toBeInTheDocument()
  })

  it('handles fractional percentages correctly', () => {
    const fractionalData = {
      positive: 1,
      negative: 1,
      neutral: 1,
      total: 3
    }
    
    render(<FeedbackSummary data={fractionalData} />)
    
    // 1/3 = 33.33% should round to 33%
    // All three sentiments should show 1 (33%)
    const percentages = screen.getAllByText('1 (33%)')
    expect(percentages).toHaveLength(3)
  })

  it('maintains semantic structure', () => {
    render(<FeedbackSummary data={mockData} />)
    
    // Check that the component has proper semantic structure
    expect(screen.getByText('Total Feedback')).toBeInTheDocument()
    
    // All sentiment categories should be present
    expect(screen.getByText('Positive')).toBeInTheDocument()
    expect(screen.getByText('Neutral')).toBeInTheDocument()
    expect(screen.getByText('Negative')).toBeInTheDocument()
  })

  it('handles missing data properties gracefully', () => {
    const incompleteData = {
      positive: 5,
      total: 10
      // missing negative and neutral
    }
    
    render(<FeedbackSummary data={incompleteData} />)
    
    // Should still render without crashing
    expect(screen.getByText('Total Feedback')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('handles undefined data object', () => {
    // This tests the component's resilience to missing props
    const { container } = render(<FeedbackSummary data={{}} />)
    
    // Should render basic structure without crashing
    expect(container).toBeInTheDocument()
  })

  it('displays progress bars with correct accessibility attributes', () => {
    render(<FeedbackSummary data={mockData} />)
    
    // Check that progress bars have proper styling by finding them by CSS class
    const progressBars = document.querySelectorAll('.bg-green-600, .bg-yellow-500, .bg-red-600')
    expect(progressBars).toHaveLength(3)
    
    // Each progress bar should have proper styling
    progressBars.forEach(bar => {
      expect(bar).toHaveClass('h-2.5', 'rounded-full')
    })
  })

  it('maintains consistent spacing and layout', () => {
    const { container } = render(<FeedbackSummary data={mockData} />)
    
    // Check main container has proper spacing
    const mainContainer = container.firstChild
    expect(mainContainer).toHaveClass('space-y-4')
    
    // Check individual sections have proper spacing
    const sections = container.querySelectorAll('.space-y-2')
    expect(sections).toHaveLength(3) // One for each sentiment
  })

  it('rounds percentages to whole numbers', () => {
    const preciseData = {
      positive: 7,
      negative: 3,
      neutral: 4,
      total: 14
    }
    
    render(<FeedbackSummary data={preciseData} />)
    
    // 7/14 = 50%, 3/14 ≈ 21.43% → 21%, 4/14 ≈ 28.57% → 29%
    expect(screen.getByText('7 (50%)')).toBeInTheDocument()
    expect(screen.getByText('3 (21%)')).toBeInTheDocument()
    expect(screen.getByText('4 (29%)')).toBeInTheDocument()
  })
})
