import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchBar } from './SearchBar'
import { useLibraryStore } from '@/stores/libraryStore'

const fetchMock = vi.fn()

function renderSearchBar(props: Partial<React.ComponentProps<typeof SearchBar>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SearchBar placeholder="Search music…" {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ suggestions: ['coldplay', 'cold water'] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  useLibraryStore.setState({ searchHistory: [] })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('SearchBar', () => {
  it('debounces input into change callbacks and submits on Enter', async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    const onSubmit = vi.fn()
    renderSearchBar({ onQueryChange, onSubmit, navigateOnSubmit: false })

    await user.type(screen.getByPlaceholderText('Search music…'), 'yellow')
    expect(onQueryChange).toHaveBeenCalled()
    expect(onQueryChange).toHaveBeenLastCalledWith('yellow')

    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('yellow')
  })

  it('records submitted queries in search history', async () => {
    const user = userEvent.setup()
    renderSearchBar({ navigateOnSubmit: false })
    await user.type(screen.getByPlaceholderText('Search music…'), 'radiohead{Enter}')
    expect(useLibraryStore.getState().searchHistory).toContain('radiohead')
  })

  it('clears the query with the clear button', async () => {
    const user = userEvent.setup()
    renderSearchBar()
    const input = screen.getByPlaceholderText('Search music…')
    await user.type(input, 'abc')
    await user.click(screen.getByLabelText('Clear search'))
    expect(input).toHaveValue('')
  })

  it('shows recent history when focused with an empty query', async () => {
    const user = userEvent.setup()
    useLibraryStore.getState().addSearchHistory('daft punk')
    renderSearchBar()
    await user.click(screen.getByPlaceholderText('Search music…'))
    expect(await screen.findByText('daft punk')).toBeInTheDocument()
    expect(screen.getByText(/^recent$/i)).toBeInTheDocument()
  })
})
