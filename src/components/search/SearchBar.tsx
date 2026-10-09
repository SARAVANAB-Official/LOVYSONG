import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, Search, X } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useSuggestions } from '@/hooks/queries'
import { useLibraryStore } from '@/stores/libraryStore'
import { cn } from '@/utils/cn'

interface SearchBarProps {
  initialQuery?: string
  onSubmit?: (query: string) => void
  onQueryChange?: (query: string) => void
  navigateOnSubmit?: boolean
  autoFocus?: boolean
  className?: string
  placeholder?: string
  compact?: boolean
}

/** Debounced search input with suggestions, recent history, and keyboard navigation. */
export function SearchBar({
  initialQuery = '',
  onSubmit,
  onQueryChange,
  navigateOnSubmit = true,
  autoFocus,
  className,
  placeholder = 'Songs, artists, albums, playlists…',
  compact = false,
}: SearchBarProps) {
  const [value, setValue] = useState(initialQuery)
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounced = useDebounce(value, 350)
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  const history = useLibraryStore((s) => s.searchHistory)
  const addHistory = useLibraryStore((s) => s.addSearchHistory)
  const removeHistory = useLibraryStore((s) => s.removeSearchHistory)
  const clearHistory = useLibraryStore((s) => s.clearSearchHistory)

  const { data: suggestions } = useSuggestions(debounced)

  const query = debounced.trim()
  const suggestionsList = suggestions ?? []
  const hasHistory = history.length > 0 && query.length === 0
  // Show the dropdown for typed queries (>=2 chars) and for recent history when empty.
  const showDropdown = focused && (query.length > 1 || hasHistory)
  const options = !showDropdown
    ? []
    : query.length > 1
      ? suggestionsList.length
        ? suggestionsList.slice(0, 8)
        : [value]
      : history

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const submit = (query: string) => {
    const q = query.trim()
    if (!q) return
    setValue(q)
    setFocused(false)
    setActiveIndex(-1)
    addHistory(q)
    onSubmit?.(q)
    if (navigateOnSubmit) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i < options.length - 1 ? i + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i > 0 ? i - 1 : options.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const picked = activeIndex >= 0 ? options[activeIndex] : value
      submit(picked)
    } else if (e.key === 'Escape') {
      setFocused(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-full border bg-ink-850/90 px-4 transition-all duration-200 backdrop-blur',
          compact ? 'h-10' : 'h-12',
          focused ? 'border-brand-500/60 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]' : 'border-white/10 hover:border-white/20',
        )}
      >
        <Search className={cn('shrink-0 text-white/40', compact ? 'h-4 w-4' : 'h-5 w-5')} />
        <input
          type="text"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            setValue(e.target.value)
            setActiveIndex(-1)
            onQueryChange?.(e.target.value)
            if (e.target.value === '') setFocused(true)
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search music"
          className="h-full w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue('')
              setActiveIndex(-1)
              setFocused(true)
            }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {options.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-ink-800/98 py-2 shadow-soft backdrop-blur-xl animate-fade-up">
          {hasHistory ? (
            <div className="flex items-center justify-between px-4 pb-1.5 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/35">Recent</span>
              <button
                type="button"
                onClick={clearHistory}
                className="text-[11px] text-white/40 transition hover:text-white/70"
              >
                Clear
              </button>
            </div>
          ) : null}
          {options.map((option, i) => (
            <button
              key={`${option}-${i}`}
              type="button"
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => submit(option)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition',
                activeIndex === i ? 'bg-white/[0.06] text-white' : 'text-white/75 hover:text-white',
              )}
            >
              {hasHistory ? <History className="h-4 w-4 shrink-0 text-white/35" /> : <Search className="h-4 w-4 shrink-0 text-white/35" />}
              <span className="truncate">{option}</span>
              {hasHistory ? (
                <span
                  role="button"
                  aria-label={`Remove ${option}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeHistory(option)
                  }}
                  className="ml-auto rounded-full p-1 text-white/30 hover:bg-white/10 hover:text-white/80"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
