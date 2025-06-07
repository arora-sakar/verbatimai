import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../test/utils'
import UploadFeedback from '../UploadFeedback'

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

// Mock the auth store
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 1, email: 'test@example.com' },
    token: 'mock-token',
  }),
}))

// Mock the UniversalReviewUploader component since it's the default view
vi.mock('../../components/feedback/UniversalReviewUploader', () => {
  return {
    default: () => <div data-testid="universal-uploader">Universal Review Uploader</div>
  }
})

describe('UploadFeedback Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload interface', () => {
    renderWithProviders(<UploadFeedback />)
    
    expect(screen.getByText(/upload feedback/i)).toBeInTheDocument()
    expect(screen.getByTestId('universal-uploader')).toBeInTheDocument()
  })

  it('renders page title', () => {
    renderWithProviders(<UploadFeedback />)
    expect(screen.getByRole('heading', { name: /upload feedback/i })).toBeInTheDocument()
  })

  it('shows file upload instructions when CSV tab is selected', () => {
    renderWithProviders(<UploadFeedback />)
    
    // Click on the CSV tab
    const csvTab = screen.getByRole('button', { name: 'Basic CSV Upload' })
    fireEvent.click(csvTab)
    
    // Check for upload instructions
    expect(screen.getByText(/drag and drop a CSV file/i)).toBeInTheDocument()
  })

  it('displays upload area when CSV tab is selected', () => {
    renderWithProviders(<UploadFeedback />)
    
    // Click on the CSV tab
    const csvTab = screen.getByRole('button', { name: 'Basic CSV Upload' })
    fireEvent.click(csvTab)
    
    // Look for the dropzone or upload area
    const uploadArea = screen.getByText(/drag and drop a CSV file/i).closest('div')
    expect(uploadArea).toBeInTheDocument()
  })

  it('has proper page structure', () => {
    renderWithProviders(<UploadFeedback />)
    
    // Check for main page elements
    expect(screen.getByRole('heading', { name: /upload feedback/i })).toBeInTheDocument()
    
    // Check for tab navigation
    expect(screen.getByRole('button', { name: 'Universal Review Importer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Basic CSV Upload' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Manual Entry' })).toBeInTheDocument()
  })

  it('shows manual entry form when manual tab is selected', () => {
    renderWithProviders(<UploadFeedback />)
    
    // Click on the Manual Entry tab
    const manualTab = screen.getByRole('button', { name: 'Manual Entry' })
    fireEvent.click(manualTab)
    
    // Check for manual entry form elements
    expect(screen.getByLabelText(/feedback text/i)).toBeInTheDocument()
    expect(screen.getByText('Submit Feedback')).toBeInTheDocument()
  })

  it('has correct tab navigation', () => {
    renderWithProviders(<UploadFeedback />)
    
    // Default tab should be Universal Review Importer
    expect(screen.getByTestId('universal-uploader')).toBeInTheDocument()
    
    // Click CSV tab
    const csvTab = screen.getByRole('button', { name: 'Basic CSV Upload' })
    fireEvent.click(csvTab)
    expect(screen.getByText(/drag and drop a CSV file/i)).toBeInTheDocument()
    expect(screen.queryByTestId('universal-uploader')).not.toBeInTheDocument()
    
    // Click Manual Entry tab
    const manualTab = screen.getByRole('button', { name: 'Manual Entry' })
    fireEvent.click(manualTab)
    expect(screen.getByLabelText(/feedback text/i)).toBeInTheDocument()
    expect(screen.queryByText(/drag and drop a CSV file/i)).not.toBeInTheDocument()
  })
})
