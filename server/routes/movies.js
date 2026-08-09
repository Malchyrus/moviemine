import { Router } from 'express'
import pool from '../db.js'

const router = Router()

function rowToEntry(row) {
  return {
    movie: {
      id: row.id,
      title: row.title,
      poster_path: row.poster_path,
      backdrop_path: row.backdrop_path,
      vote_average: row.vote_average,
      release_date: row.release_date,
    },
    watched: row.watched,
    rating: row.rating,
    addedAt: new Date(row.created_at).getTime(),
  }
}

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM movies ORDER BY created_at DESC',
    )
    res.json({ movies: rows.map(rowToEntry) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  const { id, title, poster_path, backdrop_path, vote_average, release_date } =
    req.body || {}
  if (!id || !title) {
    return res.status(400).json({ error: 'id and title are required' })
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO movies (id, title, poster_path, backdrop_path, vote_average, release_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
      [id, title, poster_path ?? null, backdrop_path ?? null, vote_average ?? null, release_date ?? null],
    )
    if (!rows[0]) {
      const existing = await pool.query('SELECT * FROM movies WHERE id = $1', [id])
      return res.status(409).json({
        error: 'already exists',
        entry: existing.rows[0] ? rowToEntry(existing.rows[0]) : null,
      })
    }
    res.status(201).json(rowToEntry(rows[0]))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { watched, rating } = req.body || {}
  try {
    const { rows } = await pool.query(
      `UPDATE movies
       SET watched = COALESCE($2, watched),
           rating = COALESCE($3, rating)
       WHERE id = $1
       RETURNING *`,
      [id, watched ?? null, rating ?? null],
    )
    if (!rows[0]) return res.status(404).json({ error: 'not found' })
    res.json(rowToEntry(rows[0]))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM movies WHERE id = $1', [
      Number(req.params.id),
    ])
    if (!rowCount) return res.status(404).json({ error: 'not found' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
