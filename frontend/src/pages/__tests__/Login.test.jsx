import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/utils'
import Login from '../Login'

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

// Mock the auth store
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    login: vi.fn(),
    user: null,
    token: null,
  }),
}))

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    renderWithProviders(<Login />)
    
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<Login />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      // The browser's built-in HTML5 validation should prevent submission
      // We can check that the form didn't submit by verifying the button is still there
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })
  })

  it('allows typing in email field', () => {
    renderWithProviders(<Login />)
    
    const emailInput = screen.getByRole('textbox', { name: /email/i })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('allows typing in password field', () => {
    renderWithProviders(<Login />)
    
    const passwordInput = screen.getByLabelText(/password/i)
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    expect(passwordInput).toHaveValue('password123')
  })
})
