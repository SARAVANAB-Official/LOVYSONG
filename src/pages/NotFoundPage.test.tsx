import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('shows a 404 with navigation back into the app', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Page not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /search music/i })).toHaveAttribute('href', '/search')
  })
})
