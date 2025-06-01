import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TopTopics from '../dashboard/TopTopics'

describe('TopTopics Component', () => {
  const mockPositiveTopics = [
    { topic: 'product quality', count: 15 },
    { topic: 'fast shipping', count: 12 },
    { topic: 'great service', count: 8 }
  ]

  const mockNegativeTopics = [
    { topic: 'slow delivery', count: 8 },
    { topic: 'poor quality', count: 6 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<TopTopics positiveTopics={mockPositiveTopics} negativeTopics={mockNegativeTopics} />)
    expect(screen.getByText('Top Positive Topics')).toBeInTheDocument()
    expect(screen.getByText('Top Negative Topics')).toBeInTheDocument()
  })

  it('displays positive topics correctly', () => {
    render(<TopTopics positiveTopics={mockPositiveTopics} negativeTopics={[]} />)
    
    expect(screen.getByText('product quality')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('displays negative topics correctly', () => {
    render(<TopTopics positiveTopics={[]} negativeTopics={mockNegativeTopics} />)
    
    expect(screen.getByText('slow delivery')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('shows empty state when no topics available', () => {
    render(<TopTopics positiveTopics={[]} negativeTopics={[]} />)
    expect(screen.getByText('No topics found in feedback')).toBeInTheDocument()
  })

  it('handles undefined props gracefully', () => {
    render(<TopTopics positiveTopics={undefined} negativeTopics={undefined} />)
    expect(screen.getByText('No topics found in feedback')).toBeInTheDocument()
  })
})
