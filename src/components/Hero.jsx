import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, TrendingUp } from 'lucide-react'
import Button from './ui/Button'

const INTERVAL = 7000

function Slide({ movie, onView }) {
  if (!movie) return null

  const backdrop = movie.backdrop_path

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0"
    >
      {backdrop && (
        <motion.div
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <img
            src={`https://image.tmdb.org/t/p/w1280${backdrop}`}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/60" />
        </motion.div>
      )}

      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-sky-600/20 blur-[120px]" />

      <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col items-start justify-center px-4 pb-16 pt-28 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur">
            <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
            Trending this week
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          {movie.title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6 flex flex-wrap items-center gap-4"
        >
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {Number(movie.vote_average) > 0 ? movie.vote_average.toFixed(1) : 'Unrated'}
          </span>
          {movie.release_date && (
            <span className="text-sm text-neutral-400">
              {new Date(movie.release_date).getFullYear()}
            </span>
          )}
          {movie.overview && (
            <p className="mt-2 w-full max-w-xl text-base leading-relaxed text-neutral-300 sm:text-lg">
              {movie.overview.slice(0, 220)}
              {movie.overview.length > 220 ? '…' : ''}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Button variant="primary" size="lg" onClick={() => onView(movie)}>
            View details
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => document.getElementById('explore')?.scrollIntoView()}
          >
            Explore
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function Hero({ movies, onView }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)

  const count = movies?.length || 0
  const go = useCallback(
    (dir) => {
      if (count === 0) return
      setActive((i) => (i + dir + count) % count)
    },
    [count],
  )

  const clearTimer = () => {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
  }

  useEffect(() => {
    if (paused || count < 2) return
    clearTimer()
    timer.current = setInterval(() => setActive((i) => (i + 1) % count), INTERVAL)
    return clearTimer
  }, [paused, count, active])

  if (count === 0) return null

  const current = movies[active]

  return (
    <section
      className="relative flex min-h-[92vh] items-center overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence>{current && <Slide key={current.id} movie={current} onView={onView} />}</AnimatePresence>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous movie"
            onClick={() => go(-1)}
            className="group absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-neutral-950/40 text-neutral-300 backdrop-blur transition-colors hover:bg-neutral-950/70 hover:text-white sm:left-6"
          >
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <button
            type="button"
            aria-label="Next movie"
            onClick={() => go(1)}
            className="group absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-neutral-950/40 text-neutral-300 backdrop-blur transition-colors hover:bg-neutral-950/70 hover:text-white sm:right-6"
          >
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            {movies.map((m, i) => (
              <button
                key={m.id}
                type="button"
                aria-label={`Show ${m.title}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
