import { getAuthToken } from './token'

const API = import.meta.env.VITE_API_URL || ''
const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const IMG = {
  poster: (path, size = 'w500') => (path ? `${IMAGE_BASE}/${size}${path}` : null),
  backdrop: (path, size = 'w1280') =>
    path ? `${IMAGE_BASE}/${size}${path}` : null,
  profile: (path, size = 'w185') => (path ? `${IMAGE_BASE}/${size}${path}` : null),
  provider: (path, size = 'w92') => (path ? `${IMAGE_BASE}/${size}${path}` : null),
}

export function imageFallback(movie) {
  return movie.poster_path || movie.backdrop_path || null
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  const token = getAuthToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { ...options, headers })
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const error = new Error(data?.error || data?.message || `Request failed: ${res.status}`)
    error.status = res.status
    throw error
  }

  return data
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

export function fetchWatchProviders(id, region) {
  return request(`/api/tmdb/movie/${id}/watch-providers?region=${encodeURIComponent(region)}`)
}

export function fetchRegions() {
  return request('/api/tmdb/watch-providers/regions')
}

export function fetchGenres() {
  return request('/api/tmdb/genres')
}

export function registerUser(fields) {
  return request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
}

export function loginUser(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}

export function fetchMe() {
  return request('/api/auth/me')
}

export function logoutUser() {
  return request('/api/auth/logout', { method: 'POST' })
}
