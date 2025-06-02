import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import NotFound from '../NotFound'

// Mock react-router-dom Link component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
  }
})

// Wrapper component for router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('NotFound Component', () => {
  it('renders 404 page correctly', () => {
    renderWithRouter(<NotFound />)
    
    // Check main elements
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page not found')).toBeInTheDocument()
    expect(screen.getByText("Sorry, we couldn't find the page you're looking for.")).toBeInTheDocument()
    expect(screen.getByText('Go back home')).toBeInTheDocument()
  })

  it('displays large 404 heading', () => {
    renderWithRouter(<NotFound />)
    
    const heading404 = screen.getByText('404')
    expect(heading404).toBeInTheDocument()
    expect(heading404).toHaveClass('text-9xl', 'font-bold', 'text-primary-600')
  })

  it('displays proper heading hierarchy', () => {
    renderWithRouter(<NotFound />)
    
    // Check heading levels
    const mainHeading = screen.getByRole('heading', { level: 1 })
    expect(mainHeading).toHaveTextContent('404')
    
    const subHeading = screen.getByRole('heading', { level: 2 })
    expect(subHeading).toHaveTextContent('Page not found')
  })

  it('displays descriptive error message', () => {
    renderWithRouter(<NotFound />)
    
    const errorMessage = screen.getByText("Sorry, we couldn't find the page you're looking for.")
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveClass('text-base', 'text-gray-500')
  })

  it('renders home link with correct attributes', () => {
    renderWithRouter(<NotFound />)
    
    const homeLink = screen.getByText('Go back home')
    expect(homeLink).toBeInTheDocument()
    
    // Check link attributes
    const linkElement = homeLink.closest('a')
    expect(linkElement).toHaveAttribute('href', '/')
  })

  it('applies correct CSS classes for styling', () => {
    renderWithRouter(<NotFound />)
    
    // Check main container styling
    const container = screen.getByText('404').closest('div')
    expect(container.parentElement).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center', 'bg-gray-50')
    
    // Check content container
    expect(container).toHaveClass('max-w-md', 'w-full', 'text-center')
    
    // Check sub-heading styling
    const subHeading = screen.getByText('Page not found')
    expect(subHeading).toHaveClass('mt-4', 'text-3xl', 'font-extrabold', 'text-gray-900')
    
    // Check button styling
    const homeLink = screen.getByText('Go back home')
    expect(homeLink).toHaveClass(
      'inline-flex', 'items-center', 'px-4', 'py-2', 'border', 'border-transparent',
      'text-sm', 'font-medium', 'rounded-md', 'shadow-sm', 'text-white',
      'bg-primary-600', 'hover:bg-primary-700'
    )
  })

  it('has proper semantic structure', () => {
    renderWithRouter(<NotFound />)
    
    // Check that there are exactly 2 headings
    const headings = screen.getAllByRole('heading')
    expect(headings).toHaveLength(2)
    
    // Check that there's a link
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveTextContent('Go back home')
  })

  it('maintains responsive design classes', () => {
    renderWithRouter(<NotFound />)
    
    // Check responsive padding classes
    const mainContainer = screen.getByText('404').closest('div').parentElement
    expect(mainContainer).toHaveClass('py-12', 'px-4', 'sm:px-6', 'lg:px-8')
  })

  it('uses consistent color scheme', () => {
    renderWithRouter(<NotFound />)
    
    // Check primary color usage
    const heading404 = screen.getByText('404')
    expect(heading404).toHaveClass('text-primary-600')
    
    const homeLink = screen.getByText('Go back home')
    expect(homeLink).toHaveClass('bg-primary-600', 'hover:bg-primary-700')
    
    // Check gray color usage for text
    const errorMessage = screen.getByText("Sorry, we couldn't find the page you're looking for.")
    expect(errorMessage).toHaveClass('text-gray-500')
    
    const subHeading = screen.getByText('Page not found')
    expect(subHeading).toHaveClass('text-gray-900')
  })

  it('has proper focus management for accessibility', () => {
    renderWithRouter(<NotFound />)
    
    const homeLink = screen.getByText('Go back home')
    expect(homeLink).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-primary-500')
  })

  it('renders as a complete page layout', () => {
    renderWithRouter(<NotFound />)
    
    // Should have min-height screen for full page layout
    const pageContainer = screen.getByText('404').closest('div').parentElement
    expect(pageContainer).toHaveClass('min-h-screen')
    
    // Should be centered both horizontally and vertically
    expect(pageContainer).toHaveClass('flex', 'items-center', 'justify-center')
  })

  it('displays content in correct order', () => {
    renderWithRouter(<NotFound />)
    
    const container = screen.getByText('404').closest('div')
    const children = Array.from(container.children)
    
    // Check content order
    expect(children[0]).toHaveTextContent('404')
    expect(children[1]).toHaveTextContent('Page not found')
    expect(children[2]).toHaveTextContent("Sorry, we couldn't find the page you're looking for.")
    expect(children[3]).toContainElement(screen.getByText('Go back home'))
  })

  it('has appropriate spacing between elements', () => {
    renderWithRouter(<NotFound />)
    
    // Check spacing classes
    const subHeading = screen.getByText('Page not found')
    expect(subHeading).toHaveClass('mt-4')
    
    const errorMessage = screen.getByText("Sorry, we couldn't find the page you're looking for.")
    expect(errorMessage).toHaveClass('mt-2')
    
    const linkContainer = screen.getByText('Go back home').closest('div')
    expect(linkContainer).toHaveClass('mt-6')
  })

  it('renders without any console errors', () => {
    // This test ensures the component renders cleanly
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    renderWithRouter(<NotFound />)
    
    expect(consoleSpy).not.toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })

  it('handles router context properly', () => {
    // Test that the component doesn't crash when rendered outside router context
    // by ensuring our mock Link component works
    renderWithRouter(<NotFound />)
    
    const homeLink = screen.getByText('Go back home')
    expect(homeLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('is keyboard accessible', () => {
    renderWithRouter(<NotFound />)
    
    const homeLink = screen.getByText('Go back home')
    
    // Should be focusable
    expect(homeLink.closest('a')).toHaveAttribute('href')
    
    // Should have proper focus styles
    expect(homeLink).toHaveClass('focus:outline-none', 'focus:ring-2')
  })

  it('displays consistent typography', () => {
    renderWithRouter(<NotFound />)
    
    // Check font weights and sizes
    const heading404 = screen.getByText('404')
    expect(heading404).toHaveClass('font-bold')
    
    const subHeading = screen.getByText('Page not found')
    expect(subHeading).toHaveClass('font-extrabold')
    
    const homeLink = screen.getByText('Go back home')
    expect(homeLink).toHaveClass('font-medium')
  })
})
