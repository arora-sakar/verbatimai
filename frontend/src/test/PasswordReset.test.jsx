import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ForgotPasswordPage from '../pages/ForgotPassword'
import ResetPasswordPage from '../pages/ResetPassword'

// Mock fetch globally
global.fetch = vi.fn()

// Mock react-router-dom
const mockNavigate = vi.fn()
const mockUseSearchParams = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockUseSearchParams, vi.fn()],
    BrowserRouter: ({ children }) => children, // Simplified for testing
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
  }
})

const renderWithRouter = (component) => {
  return render(component)
}

describe('Password Reset Frontend Components', () => {
  beforeEach(() => {
    fetch.mockClear()
    mockNavigate.mockClear()
    mockUseSearchParams.mockClear()
    // Default to no token
    mockUseSearchParams.get = vi.fn().mockReturnValue(null)
  })

  describe('ForgotPassword Component', () => {
    it('renders forgot password form correctly', () => {
      renderWithRouter(<ForgotPasswordPage />)
      
      expect(screen.getByText('Reset your password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send reset instructions/i })).toBeInTheDocument()
      expect(screen.getByText('Back to sign in')).toBeInTheDocument()
    })

    it('validates email input', async () => {
      renderWithRouter(<ForgotPasswordPage />)
      
      const emailInput = screen.getByPlaceholderText('Enter your email address')
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      
      // Button should be disabled when email is empty
      expect(submitButton).toBeDisabled()
      
      // Type invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      
      // HTML5 validation should prevent form submission
      fireEvent.click(submitButton)
      
      // No fetch should be called with invalid email
      expect(fetch).not.toHaveBeenCalled()
    })

    it('handles successful password reset request', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Password reset instructions sent' })
      })
      
      renderWithRouter(<ForgotPasswordPage />)
      
      const emailInput = screen.getByPlaceholderText('Enter your email address')
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)
      
      expect(submitButton).toHaveTextContent('Sending...')
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/request-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' })
        })
      })
      
      await waitFor(() => {
        expect(screen.getByText('Password reset instructions sent')).toBeInTheDocument()
      })
    })

    it('handles API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Email service unavailable' })
      })
      
      renderWithRouter(<ForgotPasswordPage />)
      
      const emailInput = screen.getByPlaceholderText('Enter your email address')
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Email service unavailable')).toBeInTheDocument()
      })
    })

    it('handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))
      
      renderWithRouter(<ForgotPasswordPage />)
      
      const emailInput = screen.getByPlaceholderText('Enter your email address')
      const submitButton = screen.getByRole('button', { name: /send reset instructions/i })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument()
      })
    })
  })

  describe('ResetPassword Component', () => {
    it('renders invalid token message when no token provided', () => {
      renderWithRouter(<ResetPasswordPage />)
      
      expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument()
      expect(screen.getByText('This password reset link is invalid, has expired, or has already been used.')).toBeInTheDocument()
      expect(screen.getByText('Request a new reset link')).toBeInTheDocument()
    })

    it('renders reset password form with valid token', () => {
      // Mock search params to return a valid token
      mockUseSearchParams.get = vi.fn().mockReturnValue('valid-token')
      
      renderWithRouter(<ResetPasswordPage />)
      
      expect(screen.getByText('Set new password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your new password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Confirm your new password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
    })

    it('validates password strength', async () => {
      // Mock search params to return a valid token
      mockUseSearchParams.get = vi.fn().mockReturnValue('valid-token')
      
      renderWithRouter(<ResetPasswordPage />)
      
      const passwordInput = screen.getByPlaceholderText('Enter your new password')
      
      // Test weak password
      fireEvent.change(passwordInput, { target: { value: 'weak' } })
      await waitFor(() => {
        expect(screen.getByText('very weak')).toBeInTheDocument()
      })
      
      // Test medium password
      fireEvent.change(passwordInput, { target: { value: 'Password123' } })
      await waitFor(() => {
        expect(screen.getByText('strong')).toBeInTheDocument()
      })
    })

    it('validates password confirmation', async () => {
      // Mock search params to return a valid token
      mockUseSearchParams.get = vi.fn().mockReturnValue('valid-token')
      
      renderWithRouter(<ResetPasswordPage />)
      
      const passwordInput = screen.getByPlaceholderText('Enter your new password')
      const confirmInput = screen.getByPlaceholderText('Confirm your new password')
      
      fireEvent.change(passwordInput, { target: { value: 'Password123' } })
      fireEvent.change(confirmInput, { target: { value: 'Different123' } })
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })
      
      fireEvent.change(confirmInput, { target: { value: 'Password123' } })
      
      await waitFor(() => {
        expect(screen.getByText('Passwords match')).toBeInTheDocument()
      })
    })

    it('handles successful password reset', async () => {
      // Mock search params to return a valid token
      mockUseSearchParams.get = vi.fn().mockReturnValue('valid-token')
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Password reset successful' })
      })
      
      renderWithRouter(<ResetPasswordPage />)
      
      const passwordInput = screen.getByPlaceholderText('Enter your new password')
      const confirmInput = screen.getByPlaceholderText('Confirm your new password')
      const submitButton = screen.getByRole('button', { name: /update password/i })
      
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } })
      fireEvent.change(confirmInput, { target: { value: 'NewPassword123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'valid-token', new_password: 'NewPassword123' })
        })
      })
      
      await waitFor(() => {
        expect(screen.getByText('Password Reset Successful!')).toBeInTheDocument()
      })
    })

    it('handles invalid token error', async () => {
      // Mock search params to return an invalid token
      mockUseSearchParams.get = vi.fn().mockReturnValue('invalid-token')
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid or expired password reset token' })
      })
      
      renderWithRouter(<ResetPasswordPage />)
      
      const passwordInput = screen.getByPlaceholderText('Enter your new password')
      const confirmInput = screen.getByPlaceholderText('Confirm your new password')
      const submitButton = screen.getByRole('button', { name: /update password/i })
      
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } })
      fireEvent.change(confirmInput, { target: { value: 'NewPassword123' } })
      fireEvent.click(submitButton)
      
      // Verify the API was called correctly
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'invalid-token', new_password: 'NewPassword123' })
        })
      })
      
      // The component should show some error message
      await waitFor(() => {
        const errorElements = screen.queryAllByText(/invalid|expired|error/i)
        expect(errorElements.length).toBeGreaterThan(0)
      }, { timeout: 3000 })
    })
  })
})
