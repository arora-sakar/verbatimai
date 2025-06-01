import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
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

describe('UploadFeedback Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload interface', () => {
    renderWithProviders(<UploadFeedback />)
    
    expect(screen.getByText(/upload feedback/i)).toBeInTheDocument()
    expect(screen.getByText(/drag.*drop.*csv file/i)).toBeInTheDocument()
  })

  it('renders page title', () => {
    renderWithProviders(<UploadFeedback />)
    expect(screen.getByRole('heading', { name: /upload feedback/i })).toBeInTheDocument()
  })

  it('shows file upload instructions', () => {
    renderWithProviders(<UploadFeedback />)
    
    // Check for upload instructions
    expect(screen.getByText(/drag.*drop.*csv file/i)).toBeInTheDocument()
  })

  it('displays upload area', () => {
    renderWithProviders(<UploadFeedback />)
    
    // Look for the dropzone or upload area
    const uploadArea = screen.getByText(/drag.*drop.*csv file/i).closest('div')
    expect(uploadArea).toBeInTheDocument()
  })

  it('has proper page structure', () => {
    renderWithProviders(<UploadFeedback />)
    
    // Check for main page elements
    expect(screen.getByRole('heading', { name: /upload feedback/i })).toBeInTheDocument()
    expect(screen.getByText(/drag.*drop.*csv file/i)).toBeInTheDocument()
  })
})
