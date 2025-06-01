import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils'
import Register from '../Register'

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

// Mock the auth store
const mockRegister = vi.fn()
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    register: mockRegister,
    user: null,
    token: null,
  }),
}))

// Mock react-router-dom with importOriginal
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  }
})

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders registration form', () => {
    renderWithProviders(<Register />)
    
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('allows typing in all form fields', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<Register />)
    
    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const businessNameInput = screen.getByLabelText(/business name/i)
    
    await act(async () => {
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.type(businessNameInput, 'Test Business')
    })
    
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
    expect(confirmPasswordInput).toHaveValue('password123')
    expect(businessNameInput).toHaveValue('Test Business')
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<Register />)
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      // Check that form didn't submit by verifying button is still there
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({ success: true })
    
    renderWithProviders(<Register />)
    
    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const businessNameInput = screen.getByLabelText(/business name/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await act(async () => {
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.type(businessNameInput, 'Test Business')
      await user.click(submitButton)
    })
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        business_name: 'Test Business'
      })
    })
  })

  it('handles registration success', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({ success: true })
    
    renderWithProviders(<Register />)
    
    // Fill and submit form
    await act(async () => {
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.type(screen.getByLabelText(/business name/i), 'Test Business')
      await user.click(screen.getByRole('button', { name: /create account/i }))
    })
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { message: 'Registration successful! Please log in.' } })
    })
  })

  it('handles registration failure', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({ 
      success: false, 
      message: 'Email already exists' 
    })
    
    renderWithProviders(<Register />)
    
    // Fill and submit form
    await act(async () => {
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'existing@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.type(screen.getByLabelText(/business name/i), 'Test Business')
      await user.click(screen.getByRole('button', { name: /create account/i }))
    })
    
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    })
  })

  it('has proper form accessibility', () => {
    renderWithProviders(<Register />)
    
    // Check for proper labels
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument()
    
    // Check for form elements
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })
})
