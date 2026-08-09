import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownWideNarrow, ArrowUpAZ, Clock, Search, Star, X } from 'lucide-react'
import { useLibrary } from '../lib/library'
import { useAuth } from '../lib/auth'
import MovieCard from './MovieCard'
import SkeletonCard, { EmptyState } from './SkeletonCard'
import Button from './ui/Button'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'watchlist', label: 'Watchlist' },
  { key: 'watched', label: 'Watched' },
  { key: 'rated', label: 'Rated' },
]

const SORTS = [
  { key: 'recent', label: 'Recently added', icon: Clock },
  { key: 'title', label: 'Title A–Z', icon: ArrowUpAZ },
  { key: 'rating', label: 'Rating', icon: Star },
]

const EMPTY = {
  all: ['Your library is empty', 'Tap the bookmark icon on any movie to save it here.'],
  watchlist: ['No movies in your watchlist', 'Movies you save but haven’t watched yet appear here.'],
  watched: ['Nothing watched yet', 'Open a movie and mark it as watched to see it here.'],
  rated: ['No ratings yet', 'Rate a movie 1–10 to see it here.'],
}

export default function Library({ onView, onOpenAuth }) {
  const { user } = useAuth()
  const { entries, loading, error, counts } = useLibrary()
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let list = [...entries]
    if (filter === 'watchlist') list = list.filter((e) => !e.watched)
    if (filter === 'watched') list = list.filter((e) => e.watched)
    if (filter === 'rated') list = list.filter((e) => e.rating != null)

    const q = query.trim().toLowerCase()
    if (q) list = list.filter((e) => e.movie.title.toLowerCase().includes(q))

    switch (sort) {
      case 'title':
        list.sort((a, b) =>
          a.movie.title.localeCompare(b.movie.title, undefined, { sensitivity: 'base' }),
        )
        break
      case 'rating':
        list.sort(
          (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.addedAt - a.addedAt,
        )
        break
      default:
        list.sort((a, b) => b.addedAt - a.addedAt)
    }
    return list
  }, [entries, filter, sort, query])

  const [title, message] = EMPTY[filter]
  const countFor = (key) => (key === 'all' ? counts.total : counts[key])
  const searching = query.trim().length > 0

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            My library
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {counts.total} {counts.total === 1 ? 'title' : 'titles'} saved ·{' '}
            {counts.watched} watched · {counts.rated} rated
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your library…"
              className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-9 text-sm text-white placeholder-neutral-500 outline-none transition-all duration-300 focus:border-cyan-500/50 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-neutral-400 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'text-white'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="library-filter"
                      className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/15"
                      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    />
                  )}
                  <span className="relative">
                    {f.label}
                    <span className={`ml-1.5 ${active ? 'text-cyan-300' : 'text-neutral-600'}`}>
                      {countFor(f.key)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5">
            <ArrowDownWideNarrow className="h-3.5 w-3.5 text-neutral-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-xs font-medium text-neutral-300 outline-none [&>option]:bg-neutral-900"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="signin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              title="Your library is waiting"
              message="Log in to save movies, track what you've watched, and rate titles."
            >
              <Button variant="accent" onClick={onOpenAuth}>
                Log in
              </Button>
            </EmptyState>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 lg:grid-cols-5"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              title="Library unavailable"
              message="Couldn't reach the backend. Check the Railway service is running and VITE_API_URL is set."
            />
          </motion.div>
        ) : filtered.length > 0 ? (
          <motion.div
            key={`${filter}-${sort}-${query}`}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 lg:grid-cols-5"
          >
            {filtered.map((e, i) => (
              <MovieCard key={e.movie.id} movie={e.movie} index={i} onView={onView} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={`${filter}-empty-${query}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              title={searching ? `No matches for “${query.trim()}”` : title}
              message={
                searching
                  ? 'Try a different title in your library.'
                  : message
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
