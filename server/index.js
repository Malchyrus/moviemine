import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'
import moviesRouter from './routes/movies.js'
import tmdbRouter from './routes/tmdb.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/movies', moviesRouter)
app.use('/api/tmdb', tmdbRouter)

const port = process.env.PORT || 5000

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`MovieMine API listening on :${port}`)
    })
  })
  .catch((err) => {
    console.error('Database init failed:', err.message)
    process.exit(1)
  })
