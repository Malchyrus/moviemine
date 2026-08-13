import { createContext, useContext, useEffect, useState } from 'react'
import { fetchGenres, fetchGenresTv } from './api'

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
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
}

const GenreContext = createContext(FALLBACK)

export function GenreProvider({ children }) {
  const [genres, setGenres] = useState(FALLBACK)

  useEffect(() => {
    Promise.allSettled([fetchGenres(), fetchGenresTv()])
      .then(([movie, tv]) => {
        const map = {}
        const add = (list) =>
          (list || []).forEach((g) => {
            map[g.id] = g.name
          })
        add(movie.value?.genres)
        add(tv.value?.genres)
        setGenres({ ...FALLBACK, ...map })
      })
      .catch(() => {})
  }, [])

  return <GenreContext.Provider value={genres}>{children}</GenreContext.Provider>
}

export function useGenres() {
  return useContext(GenreContext)
}
