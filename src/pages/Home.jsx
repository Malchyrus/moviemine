import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchTrending, fetchPopular, fetchUpcoming, fetchTopRated, searchMovies } from '../lib/api'
import Hero from '../components/Hero'
import MovieRow from '../components/MovieRow'
import MovieGrid from '../components/MovieGrid'
import SearchBar from '../components/SearchBar'
import { EmptyState } from '../components/SkeletonCard'

export default function Home({ onView }) {
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [topRated, setTopRated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
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
    } catch (e) {
      setError(
        'Failed to load movies. Check the backend is running and TMDB_API_KEY is set on the server.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
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

  return (
    <>
      <Hero featured={featured} onView={onView} />

      <main
        id="search"
        className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6"
      >
        <SearchBar
          query={query}
          onChange={setQuery}
          onSubmit={(e) => e.preventDefault()}
          inputRef={searchRef}
        />

        {showSearch ? (
          <div className="mt-8">
            {searching ? (
              <MovieGrid loading />
            ) : results.length > 0 ? (
              <MovieGrid
                title={`Results for “${query.trim()}”`}
                movies={results}
                onView={onView}
              />
            ) : (
              <EmptyState
                title={`No results for “${query.trim()}”`}
                message="Try a different title, like “Inception” or “Parasite”."
              />
            )}
          </div>
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
        <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-2xl border border-red-500/30 bg-red-950/90 px-5 py-3 text-sm text-red-200 backdrop-blur">
          {error}
        </div>
      )}
    </>
  )
}
