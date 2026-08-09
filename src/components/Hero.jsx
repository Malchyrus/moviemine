import { motion } from 'framer-motion'
import { Star, TrendingUp } from 'lucide-react'
import Button from './ui/Button'

export default function Hero({ featured, onView }) {
  if (!featured) return null

  const backdrop = featured.backdrop_path

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden">
      {backdrop && (
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.35, scale: 1 }}
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

      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[120px]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur">
            <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
            Trending this week
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          {featured.title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6 flex flex-wrap items-center gap-4"
        >
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {featured.vote_average?.toFixed(1)}
          </span>
          {featured.release_date && (
            <span className="text-sm text-neutral-400">
              {new Date(featured.release_date).getFullYear()}
            </span>
          )}
          {featured.overview && (
            <p className="mt-2 w-full max-w-xl text-base leading-relaxed text-neutral-300 sm:text-lg">
              {featured.overview.slice(0, 220)}
              {featured.overview.length > 220 ? '…' : ''}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Button variant="primary" size="lg" onClick={() => onView(featured)}>
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

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-neutral-500">
        <div className="h-8 w-5 rounded-full border border-neutral-600" />
      </div>
    </section>
  )
}
