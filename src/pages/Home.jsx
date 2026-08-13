import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTrendingAll, fetchPopular, fetchPopularTv, fetchUpcoming, fetchTopRated, fetchRecommendations } from '../lib/api'
import { useAuth } from '../lib/auth'
import Hero from '../components/Hero'
import MovieRow from '../components/MovieRow'
import SearchBar from '../components/SearchBar'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Home({ onView }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const [popularTv, setPopularTv] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [topRated, setTopRated] = useState([])
  const [recommended, setRecommended] = useState([])
  const [recsLoading, setRecsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const retryTimer = useRef(null)

  const load = useCallback(async (attempt = 1) => {
    setError('')
    if (attempt === 1) setLoading(true)
    try {
      const [t, p, u, tr, ptv] = await Promise.all([
        fetchTrendingAll(),
        fetchPopular(),
        fetchUpcoming(),
        fetchTopRated(),
        fetchPopularTv(),
      ])
      setTrending(shuffle(t.results || []))
      setPopular(p.results || [])
      setUpcoming(u.results || [])
      setTopRated(tr.results || [])
      setPopularTv(ptv.results || [])
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
    if (!user) {
      setRecommended([])
      return
    }
    let active = true
    setRecsLoading(true)
    fetchRecommendations()
      .then((data) => {
        if (active) setRecommended(data.results || [])
      })
      .catch(() => {
        if (active) setRecommended([])
      })
      .finally(() => {
        if (active) setRecsLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const goSearch = useCallback(
    (value) => {
      const q = value.trim()
      if (q) navigate(`/search?q=${encodeURIComponent(q)}`, { replace: true })
    },
    [navigate],
  )

  return (
    <>
      <Hero movies={trending} onView={onView} />

      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <SearchBar query="" onChange={goSearch} onSubmit={(e) => e.preventDefault()} />

        <div className="mt-12 space-y-12">
          {user && (recsLoading || recommended.length > 0) && (
            <MovieRow
              title="Recommended for you"
              movies={recommended}
              loading={recsLoading}
              onView={onView}
            />
          )}
          <MovieRow
            title="Popular right now"
            movies={popular}
            loading={loading}
            onView={onView}
          />
          <MovieRow
            title="Popular TV shows"
            movies={popularTv}
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
