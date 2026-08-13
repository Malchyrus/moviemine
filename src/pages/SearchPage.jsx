import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { searchMovies } from '../lib/api'
import { useGenres } from '../lib/genres'
import SearchBar from '../components/SearchBar'
import GenreFilter, { cycleGenre, matchesGenreFilters } from '../components/GenreFilter'
import MovieCard from '../components/MovieCard'
import SkeletonCard, { EmptyState } from '../components/SkeletonCard'
import Button from '../components/ui/Button'

export default function SearchPage({ onView }) {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const genres = useGenres()
  const [input, setInput] = useState(q)
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [included, setIncluded] = useState(() => new Set())
  const [excluded, setExcluded] = useState(() => new Set())
  const searchSeq = useRef(0)

  useEffect(() => {
    setInput(q)
  }, [q])

  const runSearch = useCallback(async (query, pg, seq) => {
    setLoading(true)
    setError('')
    try {
      const data = await searchMovies(query, pg)
      if (seq !== searchSeq.current) return
      setMovies((prev) => (pg === 1 ? data.results || [] : [...prev, ...(data.results || [])]))
      setPage(pg)
      setTotalPages(data.total_pages || 0)
      setTotalResults(data.total_results || 0)
    } catch {
      if (seq === searchSeq.current) {
        setError('Search failed. Check the backend is running and TMDB_API_KEY is set.')
      }
    } finally {
      if (seq === searchSeq.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = input.trim()
      if (trimmed && trimmed !== q) setParams({ q: trimmed }, { replace: true })
    }, 350)
    return () => clearTimeout(timer)
  }, [input, q, setParams])

  useEffect(() => {
    const trimmed = q.trim()
    if (!trimmed) return
    searchSeq.current += 1
    const seq = searchSeq.current
    setIncluded(new Set())
    setExcluded(new Set())
    runSearch(trimmed, 1, seq)
  }, [q, runSearch])

  const loadMore = () => {
    const trimmed = q.trim()
    if (!trimmed || loading || page >= totalPages) return
    searchSeq.current += 1
    const seq = searchSeq.current
    runSearch(trimmed, page + 1, seq)
  }

  const cycleHandler = (id) => {
    const next = cycleGenre(included, excluded, id)
    setIncluded(next.included)
    setExcluded(next.excluded)
  }

  const clearGenres = () => {
    setIncluded(new Set())
    setExcluded(new Set())
  }

  const genreCounts = useMemo(() => {
    const map = new Map()
    for (const m of movies) {
      for (const g of m.genres || []) {
        map.set(g.id, (map.get(g.id) || 0) + 1)
      }
    }
    return map
  }, [movies])

  const filtered = useMemo(() => {
    if (included.size === 0 && excluded.size === 0) return movies
    return movies.filter((m) => matchesGenreFilters(m, included, excluded))
  }, [movies, included, excluded])

  const searching = !!q.trim()
  const hasFilter = included.size > 0 || excluded.size > 0

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-xl">
        <SearchBar
          query={input}
          onChange={setInput}
          onSubmit={(e) => e.preventDefault()}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <GenreFilter
            counts={genreCounts}
            included={included}
            excluded={excluded}
            onCycle={cycleHandler}
          />
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
            <span className="font-semibold text-white">
              {searching ? `Results for “${q.trim()}”` : 'Search'}
            </span>
            {totalResults > 0 && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-neutral-300">
                {totalResults}
              </span>
            )}
            {hasFilter && (
              <button
                type="button"
                onClick={clearGenres}
                className="text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200"
              >
                Clear genres
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {[...genreCounts.entries()].map(([id, count]) => {
              const key = Number(id)
              const isIn = included.has(key)
              const isEx = excluded.has(key)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => cycleHandler(key)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isIn
                      ? 'bg-cyan-500 text-white'
                      : isEx
                        ? 'border border-red-500 bg-red-500/20 text-red-400'
                        : 'border border-white/10 bg-white/5 text-neutral-400'
                  }`}
                >
                  {genres[key] || `Genre ${id}`} · {count}
                </button>
              )
            })}
          </div>

          {error ? (
            <EmptyState
              title="Search unavailable"
              message="Couldn't reach the backend. Check the Railway service is running and TMDB_API_KEY is set."
            />
          ) : !searching ? (
            <EmptyState
              title="Find your next watch"
              message="Type a movie title above to search across TMDB's catalog."
            />
          ) : loading && movies.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <motion.div
                key={`${q}-${included.size}-${excluded.size}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 xl:grid-cols-5"
              >
                {filtered.map((m, i) => (
                  <MovieCard key={m.id} movie={m} index={i} onView={onView} />
                ))}
              </motion.div>

              {page < totalPages && (
                <div className="flex justify-center pb-8">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Load more
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="No matches"
              message={hasFilter ? 'No results match the selected genres.' : `Nothing found for “${q.trim()}”.`}
            />
          )}
        </section>
      </div>
    </main>
  )
}
