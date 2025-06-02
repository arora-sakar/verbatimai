import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { flushSync } from 'react-dom'
import Settings from '../Settings'

// Mock the API service
vi.mock('../../services/api', () => ({
  default: {
    put: vi.fn()
  }
}))

// Import the mocked API
import api from '../../services/api'
const mockApiPut = vi.mocked(api.put)

// Mock react-query
let mockMutationReturn = {
  mutate: vi.fn(),
  isLoading: false,
  isError: false,
  isSuccess: false,
  error: null
}

vi.mock('react-query', () => ({
  useMutation: vi.fn(() => mockMutationReturn)
}))

// Import the mocked useMutation
import { useMutation } from 'react-query'
const mockUseMutation = vi.mocked(useMutation)

// Mock the auth store
const mockAuthStore = {
  user: {
    id: 1,
    email: 'test@example.com',
    business_name: 'Test Business'
  },
  logout: vi.fn()
}

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => mockAuthStore
}))

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock user state
    mockAuthStore.user = {
      id: 1,
      email: 'test@example.com',
      business_name: 'Test Business'
    }
    // Reset the mutation mock
    mockMutationReturn = {
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null
    }
    mockUseMutation.mockReturnValue(mockMutationReturn)
    mockApiPut.mockResolvedValue({ data: {} })
  })

  it('renders settings page correctly', () => {
    render(<Settings />)
    
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Account Settings')).toBeInTheDocument()
    expect(screen.getByText('Data Management')).toBeInTheDocument()
    expect(screen.getByText('Subscription')).toBeInTheDocument()
  })

  it('displays user information correctly', () => {
    render(<Settings />)
    
    // Check email field (disabled)
    const emailInput = screen.getByDisplayValue('test@example.com')
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toBeDisabled()
    expect(screen.getByText('Email address cannot be changed')).toBeInTheDocument()
    
    // Check business name field (editable)
    const businessNameInput = screen.getByDisplayValue('Test Business')
    expect(businessNameInput).toBeInTheDocument()
    expect(businessNameInput).not.toBeDisabled()
  })

  it('allows editing business name', async () => {
    render(<Settings />)
    
    const businessNameInput = screen.getByDisplayValue('Test Business')
    
    // Use fireEvent wrapped in act instead of userEvent
    act(() => {
      fireEvent.change(businessNameInput, {
        target: { value: 'New Business Name' }
      })
    })
    
    // Verify the final state
    expect(businessNameInput).toHaveValue('New Business Name')
  })

  it('submits business name update on form submission', async () => {
    render(<Settings />)
    
    const businessNameInput = screen.getByDisplayValue('Test Business')
    const submitButton = screen.getByText('Save Changes')
    
    // Change business name using fireEvent wrapped in act
    act(() => {
      fireEvent.change(businessNameInput, {
        target: { value: 'Updated Business' }
      })
    })
    
    // Submit form using fireEvent wrapped in act
    act(() => {
      fireEvent.click(submitButton)
    })
    
    // Wait for the mutation to be called
    await waitFor(() => {
      expect(mockMutationReturn.mutate).toHaveBeenCalledWith('Updated Business')
    })
  })

  it('prevents submission with empty business name', async () => {
    render(<Settings />)
    
    const businessNameInput = screen.getByDisplayValue('Test Business')
    const submitButton = screen.getByText('Save Changes')
    
    // Clear business name using fireEvent wrapped in act
    act(() => {
      fireEvent.change(businessNameInput, {
        target: { value: '' }
      })
    })
    
    // Submit form using fireEvent wrapped in act
    act(() => {
      fireEvent.click(submitButton)
    })
    
    // Wait for the validation message to appear
    await waitFor(() => {
      expect(screen.getByText('Business name cannot be empty')).toBeInTheDocument()
    })
    expect(mockMutationReturn.mutate).not.toHaveBeenCalled()
  })

  it('prevents submission with whitespace-only business name', async () => {
    render(<Settings />)
    
    const businessNameInput = screen.getByDisplayValue('Test Business')
    const submitButton = screen.getByText('Save Changes')
    
    // Enter only whitespace using fireEvent wrapped in act
    act(() => {
      fireEvent.change(businessNameInput, {
        target: { value: '   ' }
      })
    })
    
    // Submit form using fireEvent wrapped in act
    act(() => {
      fireEvent.click(submitButton)
    })
    
    // Wait for the validation message to appear
    await waitFor(() => {
      expect(screen.getByText('Business name cannot be empty')).toBeInTheDocument()
    })
    expect(mockMutationReturn.mutate).not.toHaveBeenCalled()
  })

  it('shows loading state during submission', () => {
    // Set up the mock to return loading state
    mockMutationReturn.isLoading = true
    mockUseMutation.mockReturnValue(mockMutationReturn)
    
    render(<Settings />)
    
    const submitButton = screen.getByText('Saving...')
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('displays subscription information', () => {
    render(<Settings />)
    
    expect(screen.getByText('Free Tier')).toBeInTheDocument()
    expect(screen.getByText('You are currently on the Free Tier, which includes:')).toBeInTheDocument()
    expect(screen.getByText('Up to 100 feedback items per month')).toBeInTheDocument()
    expect(screen.getByText('Basic sentiment analysis')).toBeInTheDocument()
    expect(screen.getByText('Topic extraction')).toBeInTheDocument()
    expect(screen.getByText('CSV uploads')).toBeInTheDocument()
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
  })

  it('displays data management options', () => {
    render(<Settings />)
    
    expect(screen.getByText('Export Feedback')).toBeInTheDocument()
    expect(screen.getByText('Download your feedback data as a CSV file.')).toBeInTheDocument()
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
    
    // Check for the Delete Account heading
    expect(screen.getByRole('heading', { name: 'Delete Account', level: 3 })).toBeInTheDocument()
    expect(screen.getByText('Permanently delete your account and all associated data. This action cannot be undone.')).toBeInTheDocument()
    // Check for the Delete Account button
    expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument()
  })

  it('handles missing user gracefully', () => {
    // Set the mock user to null for this test
    mockAuthStore.user = null
    
    render(<Settings />)
    
    // Should render without crashing
    expect(screen.getByText('Settings')).toBeInTheDocument()
    
    // Email and business name inputs should have empty values
    const emailInput = screen.getByLabelText('Email Address')
    const businessNameInput = screen.getByLabelText('Business Name')
    
    expect(emailInput).toHaveValue('')
    expect(businessNameInput).toHaveValue('')
  })

  it('handles user with missing business_name', () => {
    // Set the mock user without business_name for this test
    mockAuthStore.user = { id: 1, email: 'test@example.com' }
    
    render(<Settings />)
    
    const businessNameInput = screen.getByLabelText('Business Name')
    expect(businessNameInput).toHaveValue('')
  })

  describe('Status Messages', () => {
    it('displays success message when mutation succeeds', async () => {
      // Mock the useMutation to capture the options and simulate success
      let capturedOptions
      mockUseMutation.mockImplementation((mutationFn, options) => {
        capturedOptions = options
        return {
          mutate: (data) => {
            // Simulate successful API call by calling onSuccess
            capturedOptions.onSuccess()
          },
          isLoading: false
        }
      })
      
      render(<Settings />)
      
      // Trigger a successful update using act
      act(() => {
        fireEvent.click(screen.getByText('Save Changes'))
      })
      
      // Wait for success message to appear
      await waitFor(() => {
        expect(screen.getByText('Business name updated successfully!')).toBeInTheDocument()
      })
      
      // Check success styling - traverse up to find the status message container
      const messageText = screen.getByText('Business name updated successfully!')
      const statusContainer = messageText.closest('div').parentElement.parentElement
      expect(statusContainer).toHaveClass('bg-green-50')
    })

    it('displays error message when mutation fails', async () => {
      // Mock the useMutation to capture the options and simulate error
      let capturedOptions
      mockUseMutation.mockImplementation((mutationFn, options) => {
        capturedOptions = options
        return {
          mutate: (data) => {
            // Simulate API error by calling onError
            capturedOptions.onError({
              response: {
                data: {
                  detail: 'Business name already exists'
                }
              }
            })
          },
          isLoading: false
        }
      })
      
      render(<Settings />)
      
      // Trigger a failed update using act
      act(() => {
        fireEvent.click(screen.getByText('Save Changes'))
      })
      
      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText('Business name already exists')).toBeInTheDocument()
      })
      
      // Check error styling - traverse up to find the status message container
      const messageText = screen.getByText('Business name already exists')
      const statusContainer = messageText.closest('div').parentElement.parentElement
      expect(statusContainer).toHaveClass('bg-red-50')
    })

    it('displays generic error message when no detail provided', async () => {
      // Mock the useMutation to capture the options and simulate generic error
      let capturedOptions
      mockUseMutation.mockImplementation((mutationFn, options) => {
        capturedOptions = options
        return {
          mutate: (data) => {
            // Simulate generic error by calling onError
            capturedOptions.onError({
              response: {
                data: {}
              }
            })
          },
          isLoading: false
        }
      })
      
      render(<Settings />)
      
      // Trigger error using act
      act(() => {
        fireEvent.click(screen.getByText('Save Changes'))
      })
      
      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText('Failed to update business name')).toBeInTheDocument()
      })
    })

    it('allows dismissing status messages', async () => {
      // Mock the useMutation to capture the options and simulate success
      let capturedOptions
      mockUseMutation.mockImplementation((mutationFn, options) => {
        capturedOptions = options
        return {
          mutate: (data) => {
            capturedOptions.onSuccess()
          },
          isLoading: false
        }
      })
      
      render(<Settings />)
      
      // Trigger success message using act
      act(() => {
        fireEvent.click(screen.getByText('Save Changes'))
      })
      
      await waitFor(() => {
        expect(screen.getByText('Business name updated successfully!')).toBeInTheDocument()
      })
      
      // Dismiss the message using fireEvent wrapped in act
      const dismissButton = screen.getByRole('button', { name: 'Dismiss' })
      act(() => {
        fireEvent.click(dismissButton)
      })
      
      // Wait for the message to be removed
      await waitFor(() => {
        expect(screen.queryByText('Business name updated successfully!')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Interactions', () => {
    it('has proper form accessibility', () => {
      const { container } = render(<Settings />)
      
      // Check for proper labels
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByLabelText('Business Name')).toBeInTheDocument()
      
      // Check form element exists
      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()
      
      // Verify the form has the submit button
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
    })

    it('submits form when form submit event is triggered', async () => {
      const { container } = render(<Settings />)
      
      const businessNameInput = screen.getByDisplayValue('Test Business')
      const form = container.querySelector('form')
      
      // Change value using fireEvent wrapped in act
      act(() => {
        fireEvent.change(businessNameInput, {
          target: { value: 'New Name' }
        })
      })
      
      // Submit form by triggering the submit event on the form element
      act(() => {
        fireEvent.submit(form)
      })
      
      // Wait for the mutation to be called
      await waitFor(() => {
        expect(mockMutationReturn.mutate).toHaveBeenCalledWith('New Name')
      })
    })
  })

  describe('Button Interactions', () => {
    it('renders all action buttons', () => {
      render(<Settings />)
      
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument()
    })

    it('applies correct styling to buttons', () => {
      render(<Settings />)
      
      const saveButton = screen.getByText('Save Changes')
      expect(saveButton).toHaveClass('bg-primary-600', 'hover:bg-primary-700')
      
      // Use getByRole to be more specific about which Delete Account element we want
      const deleteButton = screen.getByRole('button', { name: 'Delete Account' })
      expect(deleteButton).toHaveClass('text-red-700', 'border-red-300')
      
      const upgradeButton = screen.getByText('Upgrade to Pro')
      expect(upgradeButton).toHaveClass('bg-primary-600', 'hover:bg-primary-700')
    })
  })
})
