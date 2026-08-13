import { getAuthToken } from './token'
import { API_BASE } from './config'

const API = API_BASE
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

export function mediaTypeOf(movie) {
  return movie?.media_type || 'movie'
}

/**
 * Flatten TMDB list results into one shape. Movie results carry title /
 * release_date; TV results carry name / first_air_date, and list endpoints
 * only report media_type on some of them (trending/all, search/multi).
 */
export function normalizeList(items, mediaType) {
  return (items || []).map((item) => ({
    ...item,
    media_type: mediaTypeOf(item) || mediaType || 'movie',
    title: item.title ?? item.name ?? null,
    release_date: item.release_date ?? item.first_air_date ?? null,
  }))
}

export function normalizeDetails(details, mediaType = 'movie') {
  if (!details) return details
  return {
    ...details,
    media_type: details.media_type || mediaType,
    title: details.title ?? details.name ?? null,
    release_date: details.release_date ?? details.first_air_date ?? null,
  }
}

async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) }
  const token = getAuthToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { ...options, headers })
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const error = new Error(data?.error || data?.message || `Request failed: ${res.status}`)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}

async function listRequest(path, mediaType, options) {
  const data = await request(path, options)
  return { ...data, results: normalizeList(data?.results, mediaType) }
}

export function fetchTrending() {
  return listRequest('/api/tmdb/trending', 'movie')
}

export function fetchTrendingAll() {
  return listRequest('/api/tmdb/trending/all', 'all')
}

export function fetchTrendingTv() {
  return listRequest('/api/tmdb/trending/tv', 'tv')
}

export function fetchPopular() {
  return listRequest('/api/tmdb/popular', 'movie')
}

export function fetchPopularTv() {
  return listRequest('/api/tmdb/tv/popular', 'tv')
}

export function fetchUpcoming() {
  return listRequest('/api/tmdb/upcoming', 'movie')
}

export function fetchTopRated() {
  return listRequest('/api/tmdb/top-rated', 'movie')
}

export function fetchTopRatedTv() {
  return listRequest('/api/tmdb/tv/top-rated', 'tv')
}

export function fetchAiringToday() {
  return listRequest('/api/tmdb/tv/airing-today', 'tv')
}

const SEARCH_ENDPOINTS = {
  all: '/api/tmdb/search/multi',
  movie: '/api/tmdb/search',
  tv: '/api/tmdb/search/tv',
}

export function searchTitles(query, page = 1, media = 'all') {
  const endpoint = SEARCH_ENDPOINTS[media] || SEARCH_ENDPOINTS.all
  return listRequest(`${endpoint}?q=${encodeURIComponent(query)}&page=${page}`, media === 'all' ? 'all' : media)
}

export function fetchTitleDetails(id, mediaType = 'movie') {
  const endpoint = mediaType === 'tv' ? `/api/tmdb/tv/${id}` : `/api/tmdb/movie/${id}`
  return request(endpoint).then((data) => normalizeDetails(data, mediaType))
}

export function fetchSeason(id, season) {
  return request(`/api/tmdb/tv/${id}/season/${season}`)
}

export function fetchWatchProviders(id, region, mediaType = 'movie') {
  const endpoint =
    mediaType === 'tv'
      ? `/api/tmdb/tv/${id}/watch-providers`
      : `/api/tmdb/movie/${id}/watch-providers`
  return request(`${endpoint}?region=${encodeURIComponent(region)}`)
}

export function fetchRegions() {
  return request('/api/tmdb/watch-providers/regions')
}

export function fetchGenres() {
  return request('/api/tmdb/genres')
}

export function fetchGenresTv() {
  return request('/api/tmdb/genres/tv')
}

export function fetchRecommendations() {
  return request('/api/tmdb/recommendations').then((data) => ({
    ...data,
    results: normalizeList(data?.results, 'all'),
  }))
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

export function updateMe(fields) {
  return request('/api/auth/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
}

export function changePassword(payload) {
  return request('/api/auth/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function logoutUser() {
  return request('/api/auth/logout', { method: 'POST' })
}
