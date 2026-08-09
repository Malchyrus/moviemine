const API = import.meta.env.VITE_API_URL || ''
const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const IMG = {
  poster: (path, size = 'w500') => (path ? `${IMAGE_BASE}/${size}${path}` : null),
  backdrop: (path, size = 'w1280') =>
    path ? `${IMAGE_BASE}/${size}${path}` : null,
  profile: (path, size = 'w185') => (path ? `${IMAGE_BASE}/${size}${path}` : null),
}

export function imageFallback(movie) {
  return movie.poster_path || movie.backdrop_path || null
}

async function request(path) {
  const res = await fetch(`${API}${path}`)
  if (!res.ok) throw new Error(`TMDB request failed: ${res.status}`)
  return res.json()
}

export function fetchTrending() {
  return request('/api/tmdb/trending')
}

export function fetchPopular() {
  return request('/api/tmdb/popular')
}

export function fetchUpcoming() {
  return request('/api/tmdb/upcoming')
}

export function fetchTopRated() {
  return request('/api/tmdb/top-rated')
}

export function searchMovies(query, page = 1) {
  return request(`/api/tmdb/search?q=${encodeURIComponent(query)}&page=${page}`)
}

export function fetchMovieDetails(id) {
  return request(`/api/tmdb/movie/${id}`)
}

export function fetchGenres() {
  return request('/api/tmdb/genres')
}
