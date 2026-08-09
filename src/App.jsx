import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './lib/auth'
import { LibraryProvider, useLibrary } from './lib/library'
import { GenreProvider } from './lib/genres'
import { fetchTrending, fetchPopular, fetchUpcoming, fetchTopRated, searchMovies } from './lib/api'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import MovieRow from './components/MovieRow'
import MovieGrid from './components/MovieGrid'
import SearchBar from './components/SearchBar'
import MovieModal from './components/MovieModal'
import AuthModal from './components/AuthModal'
import Library from './components/Library'
import Footer from './components/Footer'
import { EmptyState } from './components/SkeletonCard'

function AppContent() {
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [topRated, setTopRated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const { counts } = useLibrary()
  const searchRef = useRef(null)

  const openAuth = useCallback(() => setAuthOpen(true), [])

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
    <div className="min-h-screen bg-neutral-950">
      <Navbar
        onSearchFocus={() => searchRef.current?.scrollIntoView({ behavior: 'smooth' })}
        onOpenAuth={openAuth}
        libraryCount={counts.total}
      />

      {!showSearch ? (
        <>
          <Hero featured={featured} onView={setSelected} />

          <div id="explore" className="space-y-12 pb-16">
            <MovieRow
              title="Popular right now"
              movies={popular}
              loading={loading}
              onView={setSelected}
            />
            <MovieRow
              title="Top rated"
              movies={topRated}
              loading={loading}
              onView={setSelected}
            />
            <MovieRow
              title="Coming soon"
              movies={upcoming}
              loading={loading}
              onView={setSelected}
            />
          </div>

          <Library onView={setSelected} onOpenAuth={openAuth} />
        </>
      ) : (
        <main className="mx-auto max-w-7xl px-4 pt-28 sm:px-6">
          <SearchBar
            query={query}
            onChange={setQuery}
            onSubmit={(e) => e.preventDefault()}
            inputRef={searchRef}
          />
          <div className="mt-8">
            {searching ? (
              <MovieGrid loading />
            ) : results.length > 0 ? (
              <MovieGrid
                title={`Results for “${query.trim()}”`}
                movies={results}
                onView={setSelected}
              />
            ) : (
              <EmptyState
                title={`No results for “${query.trim()}”`}
                message="Try a different title, like “Inception” or “Parasite”."
              />
            )}
          </div>
        </main>
      )}

      <Footer />

      {error && (
        <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-2xl border border-red-500/30 bg-red-950/90 px-5 py-3 text-sm text-red-200 backdrop-blur">
          {error}
        </div>
      )}

      <AnimatePresence>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {selected && (
          <MovieModal
            movie={selected}
            onClose={() => setSelected(null)}
            onRequireAuth={openAuth}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <GenreProvider>
        <LibraryProvider>
          <AppContent />
        </LibraryProvider>
      </GenreProvider>
    </AuthProvider>
  )
}
