import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Check, Eye, EyeOff, Star, X, Clock, Calendar, Play } from 'lucide-react'
import { fetchMovieDetails, IMG } from '../lib/api'
import { useLibrary } from '../lib/library'
import { useAuth } from '../lib/auth'
import { useGenres } from '../lib/genres'
import { formatDate, formatRuntime } from '../lib/format'
import Button from './ui/Button'
import RatingStars from './ui/RatingStars'

export default function MovieModal({ movie, onClose, onRequireAuth }) {
  const [details, setDetails] = useState(null)
  const { has, toggle, entry, setWatched, setRating } = useLibrary()
  const { user } = useAuth()
  const genres = useGenres()
  const inList = has(movie.id)
  const watched = entry(movie.id)?.watched || false
  const myRating = entry(movie.id)?.rating || null

  function guarded(action) {
    return (...args) => {
      if (!user) {
        onRequireAuth?.()
        return
      }
      action(...args)
    }
  }

  useEffect(() => {
    fetchMovieDetails(movie.id)
      .then(setDetails)
      .catch(() => setDetails({}))
  }, [movie.id])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const trailer = details?.videos?.results?.find((v) => v.type === 'Trailer' && v.site === 'YouTube')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/15 bg-neutral-900 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9)] ring-1 ring-black/40 sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="relative h-44 w-full shrink-0 bg-neutral-800 sm:h-60">
            {details?.backdrop_path ? (
              <img
                src={IMG.backdrop(details.backdrop_path, 'w1280')}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={IMG.backdrop(movie.backdrop_path || movie.poster_path, 'w780')}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-neutral-950/60 text-neutral-200 backdrop-blur transition-colors hover:bg-neutral-950"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            {watched && (
              <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/80 px-3 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur">
                <Eye className="h-3.5 w-3.5" />
                Watched
              </span>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {details?.genres?.map((g) => (
                <span
                  key={g.id}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300"
                >
                  {g.name}
                </span>
              ))}
            </div>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
              {details?.title || movie.title}
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              {details?.tagline || '—'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-300">
              <span className="flex items-center gap-1.5 font-semibold text-yellow-400">
                <Star className="h-4 w-4 fill-yellow-400" />
                {details?.vote_average?.toFixed(1) ?? movie.vote_average?.toFixed(1)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(details?.release_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatRuntime(details?.runtime)}
              </span>
            </div>

            <p className="mt-5 text-[15px] leading-relaxed text-neutral-300">
              {details?.overview || movie.overview}
            </p>

            <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Your rating
                  </p>
                  <RatingStars
                    value={myRating}
                    onChange={guarded((r) => setRating(movie.id, r))}
                  />
                </div>

                <Button
                  variant={watched ? 'danger' : 'outline'}
                  onClick={guarded(() => setWatched(movie.id, !watched))}
                >
                  {watched ? (
                    <>
                      <EyeOff className="h-4 w-4" /> Mark as unwatched
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" /> Mark as watched
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {trailer && (
                  <Button
                    variant="accent"
                    as="a"
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Trailer
                  </Button>
                )}
                <Button
                  variant={inList ? 'danger' : 'outline'}
                  onClick={guarded(() => toggle(details || movie))}
                >
                  {inList ? (
                    <>
                      <Check className="h-4 w-4" /> Remove from library
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" /> Add to library
                    </>
                  )}
                </Button>
              </div>
            </div>

            {details?.credits?.cast?.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                  Cast
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {details.credits.cast.slice(0, 8).map((c) => (
                    <div key={c.cast_id} className="w-20 shrink-0 text-center">
                      <img
                        src={IMG.profile(c.profile_path)}
                        alt={c.name}
                        className="h-20 w-20 rounded-full object-cover ring-1 ring-white/10"
                      />
                      <p className="mt-2 truncate text-xs font-medium text-neutral-200">
                        {c.name}
                      </p>
                      <p className="truncate text-[10px] text-neutral-500">
                        {c.character}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
