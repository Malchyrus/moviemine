import { Router } from 'express'

const router = Router()
const BASE = 'https://api.themoviedb.org/3'
const KEY = process.env.TMDB_API_KEY

async function proxy(res, path, extra = {}) {
  if (!KEY) return res.status(500).json({ error: 'TMDB_API_KEY is not set' })
  const params = new URLSearchParams({ api_key: KEY, language: 'en-US', ...extra })
  try {
    const upstream = await fetch(`${BASE}${path}?${params}`)
    const data = await upstream.json()
    res.status(upstream.status).json(data)
  } catch (e) {
    res.status(502).json({ error: e.message })
  }
}

router.get('/trending', (_req, res) => proxy(res, '/trending/movie/week'))
router.get('/popular', (_req, res) => proxy(res, '/movie/popular'))
router.get('/upcoming', (_req, res) => proxy(res, '/movie/upcoming'))
router.get('/top-rated', (_req, res) => proxy(res, '/movie/top_rated'))
router.get('/genres', (_req, res) => proxy(res, '/genre/movie/list'))

router.get('/search', (req, res) =>
  proxy(res, '/search/movie', {
    query: req.query.q || '',
    page: req.query.page || 1,
    include_adult: 'false',
  }),
)

router.get('/movie/:id', (req, res) =>
  proxy(res, `/movie/${req.params.id}`, {
    append_to_response: 'credits,recommendations,videos',
  }),
)

export default router
