import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchTrending, fetchPopular, fetchUpcoming, fetchTopRated, searchMovies } from '../lib/api'
import { useGenres } from '../lib/genres'
import Hero from '../components/Hero'
import MovieRow from '../components/MovieRow'
import MovieGrid from '../components/MovieGrid'
import SearchBar from '../components/SearchBar'
import { EmptyState } from '../components/SkeletonCard'

export default function Home({ onView }) {
  const genres = useGenres()
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [topRated, setTopRated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [genreFilter, setGenreFilter] = useState(null)
  const searchRef = useRef(null)
  const retryTimer = useRef(null)

  const load = useCallback(async (attempt = 1) => {
    setError('')
    if (attempt === 1) setLoading(true)
    try {
      const [t, p, u, tr] = await Promise.all([
        fetchTrending('week'),
        fetchPopular(),
        fetchUpcoming(),
        fetchTopRated(),
      ])
      setTrending(t.results || [])
      setPopular(p.results || [])
      setUpcoming(u.results || [])
      setTopRated(tr.results || [])
      setLoading(false)
    } catch (e) {
      if (attempt < 4) {
        retryTimer.current = setTimeout(() => load(attempt + 1), 3000)
        return
      }
      setLoading(false)
      setError(
        'Failed to load movies. Check the backend is running and TMDB_API_KEY is set on the server.',
      )
    }
  }, [])

  useEffect(() => {
    load()
    return () => clearTimeout(retryTimer.current)
  }, [load])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearching(false)
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await searchMovies(query.trim())
        setResults(data.results || [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  const featured = useMemo(() => trending[0] || null, [trending])
  const showSearch = query.trim().length > 0

  const filteredResults = useMemo(() => {
    if (!genreFilter) return results
    return results.filter((m) => m.genre_ids?.includes(genreFilter))
  }, [results, genreFilter])

  const genresInResults = useMemo(() => {
    const ids = new Set()
    results.forEach((m) => (m.genre_ids || []).forEach((id) => ids.add(id)))
    return [...ids]
      .map((id) => ({ id, name: genres[id] }))
      .filter((g) => g.name)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [results, genres])

  const onQueryChange = useCallback((value) => {
    setQuery(value)
    setGenreFilter(null)
  }, [])

  const chipClass = (active) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
      active
        ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
        : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
    }`

  return (
    <>
      <Hero featured={featured} onView={onView} />

      <main
        id="search"
        className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6"
      >
        <SearchBar
          query={query}
          onChange={onQueryChange}
          onSubmit={(e) => e.preventDefault()}
          inputRef={searchRef}
        />

        {showSearch ? (
          <>
            {genresInResults.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGenreFilter(null)}
                  className={chipClass(genreFilter === null)}
                >
                  All
                </button>
                {genresInResults.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGenreFilter(genreFilter === g.id ? null : g.id)}
                    className={chipClass(genreFilter === g.id)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8">
              {searching ? (
                <MovieGrid loading />
              ) : filteredResults.length > 0 ? (
                <MovieGrid
                  title={`Results for “${query.trim()}”`}
                  movies={filteredResults}
                  onView={onView}
                />
              ) : results.length > 0 ? (
                <EmptyState
                  title="No movies match this genre"
                  message="Try a different genre or clear the filter."
                />
              ) : (
                <EmptyState
                  title={`No results for “${query.trim()}”`}
                  message="Try a different title, like “Inception” or “Parasite”."
                />
              )}
            </div>
          </>
        ) : (
          <div className="mt-12 space-y-12">
            <MovieRow
              title="Popular right now"
              movies={popular}
              loading={loading}
              onView={onView}
            />
            <MovieRow
              title="Top rated"
              movies={topRated}
              loading={loading}
              onView={onView}
            />
            <MovieRow
              title="Coming soon"
              movies={upcoming}
              loading={loading}
              onView={onView}
            />
          </div>
        )}
      </main>

      {error && (
        <div className="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/90 px-5 py-3 text-sm text-red-200 backdrop-blur">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => load()}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            Retry
          </button>
        </div>
      )}
    </>
  )
}
