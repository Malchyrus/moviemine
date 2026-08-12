import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { getAuthToken } from './token'
import { useAuth } from './auth'
import { API_BASE } from './config'

const API = API_BASE

const LibraryContext = createContext(null)

function snapshot(movie) {
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
    genres: Array.isArray(movie.genres) ? movie.genres : undefined,
  }
}

async function request(path, options = {}) {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getAuthToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`API request failed: ${res.status}`)
  return res.json()
}

export function LibraryProvider({ children }) {
  const { user, initializing } = useAuth()
  const [entries, setEntries] = useState([])
  const [lists, setLists] = useState([])
  const [automations, setAutomations] = useState([])
  const [preferences, setPreferences] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const authed = !initializing && !!user

  const refreshLists = useCallback(() => {
    request('/api/lists')
      .then((data) => setLists(data.lists || []))
      .catch(() => {})
  }, [])

  const refreshAutomations = useCallback(() => {
    request('/api/automations')
      .then((data) => setAutomations(data.automations || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!authed) {
      setEntries([])
      setLists([])
      setAutomations([])
      setPreferences({})
      setLoading(false)
      return
    }

    setPreferences((user && user.preferences) || {})

    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([request('/api/movies'), request('/api/lists'), request('/api/automations')])
      .then(([moviesData, listsData, automationsData]) => {
        if (cancelled) return
        setEntries(moviesData.movies || [])
        setLists(listsData.lists || [])
        setAutomations(automationsData.automations || [])
      })
      .catch(() => {
        if (!cancelled) setError('Could not reach the backend API.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authed, user])

  const toggle = useCallback(
    (movie) => {
      setEntries((prev) => {
        const exists = prev.some((e) => e.movie.id === movie.id)
        if (exists) {
          request(`/api/movies/${movie.id}`, { method: 'DELETE' }).catch(() => {})
          return prev.filter((e) => e.movie.id !== movie.id)
        }
        const data = snapshot(movie)
        request('/api/movies', { method: 'POST', body: JSON.stringify(data) })
          .then(() => refreshLists())
          .catch(() => {})
        return [
          ...prev,
          { movie: data, watched: false, rating: null, addedAt: Date.now() },
        ]
      })
    },
    [refreshLists],
  )

  const setWatched = useCallback(
    (id, watched) => {
      setEntries((prev) =>
        prev.map((e) => (e.movie.id === id ? { ...e, watched } : e)),
      )
      request(`/api/movies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ watched }),
      })
        .then(() => refreshLists())
        .catch(() => {})
    },
    [refreshLists],
  )

  const setRating = useCallback(
    (id, rating) => {
      setEntries((prev) =>
        prev.map((e) => (e.movie.id === id ? { ...e, rating } : e)),
      )
      request(`/api/movies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ rating }),
      })
        .then(() => refreshLists())
        .catch(() => {})
    },
    [refreshLists],
  )

  const mergeList = useCallback((list) => {
    setLists((prev) => {
      const exists = prev.some((l) => l.id === list.id)
      return exists
        ? prev.map((l) => (l.id === list.id ? list : l))
        : [...prev, list]
    })
  }, [])

  const addToList = useCallback(
    (movie, listId) => {
      return request(`/api/lists/${listId}/movies`, {
        method: 'POST',
        body: JSON.stringify(snapshot(movie)),
      }).then((data) => {
        if (data && data.id && Array.isArray(data.movies)) mergeList(data)
        else refreshLists()
      })
    },
    [refreshLists, mergeList],
  )

  const removeFromList = useCallback(
    (tmdbId, listId) => {
      return request(`/api/lists/${listId}/movies/${tmdbId}`, { method: 'DELETE' })
        .then((data) => {
          if (data && data.id && Array.isArray(data.movies)) mergeList(data)
          else refreshLists()
        })
    },
    [refreshLists, mergeList],
  )

  const moveToList = useCallback((tmdbId, targetListId) => {
    return request(`/api/lists/${targetListId}/move`, {
      method: 'POST',
      body: JSON.stringify({ tmdb_id: tmdbId }),
    }).then((data) => {
      if (data && Array.isArray(data.lists)) setLists(data.lists)
      else refreshLists()
    })
  }, [refreshLists])

  const createList = useCallback((name) => {
    return request('/api/lists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }).then(() => refreshLists())
  }, [refreshLists])

  const renameList = useCallback((id, name) => {
    return request(`/api/lists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }).then(() => refreshLists())
  }, [refreshLists])

  const deleteList = useCallback((id) => {
    return request(`/api/lists/${id}`, { method: 'DELETE' }).then(() => refreshLists())
  }, [refreshLists])

  const createAutomation = useCallback((payload) => {
    return request('/api/automations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(() => refreshAutomations())
  }, [refreshAutomations])

  const updateAutomation = useCallback((id, payload) => {
    return request(`/api/automations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then(() => refreshAutomations())
  }, [refreshAutomations])

  const deleteAutomation = useCallback((id) => {
    return request(`/api/automations/${id}`, { method: 'DELETE' }).then(() =>
      refreshAutomations(),
    )
  }, [refreshAutomations])

  const updatePreferences = useCallback((patch) => {
    setPreferences((prev) => ({ ...prev, ...patch }))
    return request('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ preferences: patch }),
    })
      .then((data) => {
        if (data && data.user && data.user.preferences) {
          setPreferences(data.user.preferences)
        }
      })
      .catch(() => {})
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
    () => ({
      entries,
      lists,
      automations,
      preferences,
      loading,
      error,
      toggle,
      has,
      entry,
      setWatched,
      setRating,
      counts,
      refreshLists,
      addToList,
      removeFromList,
      moveToList,
      createList,
      renameList,
      deleteList,
      createAutomation,
      updateAutomation,
      deleteAutomation,
      updatePreferences,
    }),
    [
      entries,
      lists,
      automations,
      preferences,
      loading,
      error,
      toggle,
      has,
      entry,
      setWatched,
      setRating,
      counts,
      refreshLists,
      addToList,
      removeFromList,
      moveToList,
      createList,
      renameList,
      deleteList,
      createAutomation,
      updateAutomation,
      deleteAutomation,
      updatePreferences,
    ],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider')
  return ctx
}
