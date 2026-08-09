import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_API_URL || ''

const LibraryContext = createContext(null)

function snapshot(movie) {
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API request failed: ${res.status}`)
  return res.json()
}

export function LibraryProvider({ children }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    request('/api/movies')
      .then((data) => {
        if (!cancelled) setEntries(data.movies || [])
      })
      .catch((e) => {
        if (!cancelled) setError('Could not reach the backend API.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = useCallback((movie) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.movie.id === movie.id)
      if (exists) {
        request(`/api/movies/${movie.id}`, { method: 'DELETE' }).catch(() => {})
        return prev.filter((e) => e.movie.id !== movie.id)
      }
      const data = snapshot(movie)
      request('/api/movies', { method: 'POST', body: JSON.stringify(data) }).catch(
        () => {},
      )
      return [
        ...prev,
        { movie: data, watched: false, rating: null, addedAt: Date.now() },
      ]
    })
  }, [])

  const setWatched = useCallback((id, watched) => {
    setEntries((prev) =>
      prev.map((e) => (e.movie.id === id ? { ...e, watched } : e)),
    )
    request(`/api/movies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ watched }),
    }).catch(() => {})
  }, [])

  const setRating = useCallback((id, rating) => {
    setEntries((prev) =>
      prev.map((e) => (e.movie.id === id ? { ...e, rating } : e)),
    )
    request(`/api/movies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ rating }),
    }).catch(() => {})
  }, [])

  const has = useCallback((id) => entries.some((e) => e.movie.id === id), [entries])
  const entry = useCallback(
    (id) => entries.find((e) => e.movie.id === id),
    [entries],
  )

  const counts = useMemo(
    () => ({
      total: entries.length,
      watchlist: entries.filter((e) => !e.watched).length,
      watched: entries.filter((e) => e.watched).length,
      rated: entries.filter((e) => e.rating != null).length,
    }),
    [entries],
  )

  const value = useMemo(
    () => ({ entries, loading, toggle, has, entry, setWatched, setRating, counts }),
    [entries, loading, toggle, has, entry, setWatched, setRating, counts],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider')
  return ctx
}
