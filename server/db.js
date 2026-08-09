import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      poster_path TEXT,
      backdrop_path TEXT,
      vote_average REAL,
      release_date TEXT,
      watched BOOLEAN NOT NULL DEFAULT FALSE,
      rating INTEGER CHECK (rating BETWEEN 1 AND 10),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

export default pool
