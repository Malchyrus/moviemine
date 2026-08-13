import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { getAuthToken } from './token'
import { useAuth } from './auth'
import { API_BASE } from './config'

const API = API_BASE

const LibraryContext = createContext(null)

function typeOf(movie) {
  return (movie && movie.media_type) || 'movie'
}

function sameMovie(a, b) {
  return !!a && !!b && a.id === b.id && typeOf(a) === typeOf(b)
}

function snapshot(movie) {
  return {
    id: movie.id,
    media_type: typeOf(movie),
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

  const refreshLibrary = useCallback(() => {
    if (!authed) return Promise.resolve()
    return Promise.all([request('/api/movies'), request('/api/lists'), request('/api/automations')])
      .then(([moviesData, listsData, automationsData]) => {
        setEntries(moviesData.movies || [])
        setLists(listsData.lists || [])
        setAutomations(automationsData.automations || [])
      })
  }, [authed])

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

    refreshLibrary()
      .catch(() => {
        if (!cancelled) setError('Could not reach the backend API.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authed, user, refreshLibrary])

  const toggle = useCallback(
    (movie) => {
      setEntries((prev) => {
        const exists = prev.some((e) => sameMovie(e.movie, movie))
        if (exists) {
          request(`/api/movies/${movie.id}?media_type=${typeOf(movie)}`, { method: 'DELETE' }).catch(() => {})
          return prev.filter((e) => !sameMovie(e.movie, movie))
        }
        const data = snapshot(movie)
        request('/api/movies', { method: 'POST', body: JSON.stringify(data) })
          .then(() => refreshLists())
          .catch(() => {})
        return [
          ...prev,
          { movie: data, watched: false, rating: null, addedAt: Date.now(), watched_episodes: [], total_episodes: 0 },
        ]
      })
    },
    [refreshLists],
  )

  const setWatched = useCallback(
    (movie, watched) => {
      const data = snapshot(movie)
      const mediaType = typeOf(movie)
      setEntries((prev) => {
        const exists = prev.some((e) => sameMovie(e.movie, movie))
        if (!exists) {
          if (!watched) return prev
          request('/api/movies', { method: 'POST', body: JSON.stringify(data) })
            .then(() =>
              request(`/api/movies/${movie.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ watched, media_type: mediaType }),
              }),
            )
            .then(() => refreshLists())
            .catch(() => {})
          return [
            ...prev,
            { movie: data, watched, rating: null, addedAt: Date.now(), watched_episodes: [], total_episodes: 0 },
          ]
        }
        request(`/api/movies/${movie.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ watched, media_type: mediaType }),
        })
          .then(() => refreshLists())
          .catch(() => {})
        return prev.map((e) => (sameMovie(e.movie, movie) ? { ...e, watched } : e))
      })
    },
    [refreshLists],
  )

  const setRating = useCallback(
    (movie, rating) => {
      const data = snapshot(movie)
      const mediaType = typeOf(movie)
      setEntries((prev) => {
        const exists = prev.some((e) => sameMovie(e.movie, movie))
        if (!exists) {
          if (rating == null) return prev
          request('/api/movies', { method: 'POST', body: JSON.stringify(data) })
            .then(() =>
              request(`/api/movies/${movie.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ rating, media_type: mediaType }),
              }),
            )
            .then(() => refreshLists())
            .catch(() => {})
          return [
            ...prev,
            { movie: data, watched: false, rating, addedAt: Date.now(), watched_episodes: [], total_episodes: 0 },
          ]
        }
        request(`/api/movies/${movie.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ rating, media_type: mediaType }),
        })
          .then(() => refreshLists())
          .catch(() => {})
        return prev.map((e) => (sameMovie(e.movie, movie) ? { ...e, rating } : e))
      })
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
        setEntries((prev) =>
          prev.some((e) => sameMovie(e.movie, movie))
            ? prev
            : [...prev, { movie: snapshot(movie), watched: false, rating: null, addedAt: Date.now(), watched_episodes: [], total_episodes: 0 }],
        )
      })
    },
    [refreshLists, mergeList],
  )

  const removeFromList = useCallback(
    (tmdbId, listId, mediaType = 'movie') => {
      return request(`/api/lists/${listId}/movies/${tmdbId}?media_type=${mediaType}`, { method: 'DELETE' }).then(
        (data) => {
          if (data && data.id && Array.isArray(data.movies)) mergeList(data)
          else refreshLists()
          setEntries((prev) => {
            const updated = data && data.id && Array.isArray(data.movies) ? data : null
            const stillSomewhere = [updated, ...lists.filter((l) => l.id !== updated?.id)]
              .filter(Boolean)
              .some((l) => (l.movies || []).some((m) => m.id === tmdbId && typeOf(m) === mediaType))
            return stillSomewhere ? prev : prev.filter((e) => !(e.movie.id === tmdbId && typeOf(e.movie) === mediaType))
          })
        },
      )
    },
    [refreshLists, mergeList, lists],
  )

  const moveToList = useCallback((tmdbId, targetListId, mediaType = 'movie') => {
    return request(`/api/lists/${targetListId}/move`, {
      method: 'POST',
      body: JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType }),
    }).then((data) => {
      if (data && Array.isArray(data.lists)) setLists(data.lists)
      else refreshLists()
    })
  }, [refreshLists])

  const createList = useCallback((name) => {
    return request('/api/lists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
      .then((list) => {
        mergeList(list)
        refreshLists()
        return list
      })
  }, [refreshLists, mergeList])

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

  const setEpisode = useCallback((movie, season, episode, watched) => {
    return request(`/api/movies/${movie.id}/episodes`, {
      method: 'PATCH',
      body: JSON.stringify({
        media_type: typeOf(movie),
        season_number: season,
        episode_number: episode,
        watched,
      }),
    })
      .then((data) => {
        if (data && typeof data.watched === 'boolean') {
          setEntries((prev) =>
            prev.map((e) =>
              sameMovie(e.movie, movie)
                ? {
                    ...e,
                    watched: data.watched,
                    watched_episodes: data.watched_episodes ?? e.watched_episodes,
                    total_episodes: data.total_episodes ?? e.total_episodes,
                  }
                : e,
            ),
          )
        }
        return data
      })
      .catch(() => {})
  }, [])

  const has = useCallback(
    (id, mediaType = 'movie') => entries.some((e) => e.movie.id === id && typeOf(e.movie) === mediaType),
    [entries],
  )
  const entry = useCallback(
    (id, mediaType = 'movie') => entries.find((e) => e.movie.id === id && typeOf(e.movie) === mediaType),
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
      setEpisode,
      counts,
      refreshLibrary,
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
      setEpisode,
      counts,
      refreshLibrary,
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
