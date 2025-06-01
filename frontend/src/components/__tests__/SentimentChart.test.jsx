import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SentimentChart from '../dashboard/SentimentChart'

// Mock Chart.js components
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  ArcElement: {},
  Tooltip: {},
  Legend: {},
}))

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Pie: ({ data, options }) => {
    const testId = 'sentiment-pie-chart'
    return (
      <div 
        data-testid={testId}
        data-chart-data={JSON.stringify(data)}
        data-chart-options={JSON.stringify(options)}
      >
        <div data-testid="chart-labels">
          {data.labels?.join(', ')}
        </div>
        <div data-testid="chart-data">
          {data.datasets?.[0]?.data?.join(', ')}
        </div>
        <div data-testid="chart-colors">
          {data.datasets?.[0]?.backgroundColor?.join(', ')}
        </div>
      </div>
    )
  },
}))

describe('SentimentChart Component', () => {
  const mockData = {
    positive: 15,
    neutral: 8,
    negative: 5,
    total: 28
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<SentimentChart data={mockData} />)
    expect(screen.getByTestId('sentiment-pie-chart')).toBeInTheDocument()
  })

  it('displays correct chart labels', () => {
    render(<SentimentChart data={mockData} />)
    const labels = screen.getByTestId('chart-labels')
    expect(labels).toHaveTextContent('Positive, Neutral, Negative')
  })

  it('passes correct data to chart', () => {
    render(<SentimentChart data={mockData} />)
    const chartData = screen.getByTestId('chart-data')
    expect(chartData).toHaveTextContent('15, 8, 5')
  })

  it('uses correct colors for sentiments', () => {
    render(<SentimentChart data={mockData} />)
    const colors = screen.getByTestId('chart-colors')
    
    // Check that colors are included (rgba values)
    expect(colors.textContent).toContain('rgba(34, 197, 94, 0.7)') // green for positive
    expect(colors.textContent).toContain('rgba(250, 204, 21, 0.7)') // yellow for neutral
    expect(colors.textContent).toContain('rgba(239, 68, 68, 0.7)') // red for negative
  })

  it('handles zero values correctly', () => {
    const zeroData = {
      positive: 0,
      neutral: 0,
      negative: 0,
      total: 0
    }
    
    render(<SentimentChart data={zeroData} />)
    const chartData = screen.getByTestId('chart-data')
    expect(chartData).toHaveTextContent('0, 0, 0')
  })
})
