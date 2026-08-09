import { createContext, useContext, useEffect, useState } from 'react'
import { fetchGenres } from './api'

const FALLBACK = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
}

const GenreContext = createContext(FALLBACK)

export function GenreProvider({ children }) {
  const [genres, setGenres] = useState(FALLBACK)

  useEffect(() => {
    fetchGenres()
      .then(({ genres: list }) => {
        const map = {}
        list.forEach((g) => {
          map[g.id] = g.name
        })
        setGenres({ ...FALLBACK, ...map })
      })
      .catch(() => {})
  }, [])

  return <GenreContext.Provider value={genres}>{children}</GenreContext.Provider>
}

export function useGenres() {
  return useContext(GenreContext)
}
