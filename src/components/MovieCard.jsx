import { motion } from 'framer-motion'
import { Bookmark, Check, Clapperboard, Eye, Star } from 'lucide-react'
import { useLibrary } from '../lib/library'
import { imageFallback, mediaTypeOf } from '../lib/api'
import AddToList from './AddToList'

export default function MovieCard({ movie, index = 0, onView }) {
  const { has, toggle, entry } = useLibrary()
  const mediaType = mediaTypeOf(movie)
  const inList = has(movie.id, mediaType)
  const watched = entry(movie.id, mediaType)?.watched || false
  const myRating = entry(movie.id, mediaType)?.rating || null
  const poster = imageFallback(movie)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.4), ease: 'easeOut' }}
      whileHover={{ y: -6 }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
      onClick={() => onView(movie)}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {poster ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${poster}`}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-sm text-neutral-500">
            No poster
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {mediaType === 'tv' && (
            <span className="flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-950/80 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 backdrop-blur">
              <Clapperboard className="h-3 w-3" />
              TV
            </span>
          )}
          {watched && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-950/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur"
            >
              <Eye className="h-3 w-3" />
              Watched
            </motion.span>
          )}
          {myRating != null && (
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-neutral-950/70 px-2.5 py-1 text-[11px] font-bold text-cyan-300 backdrop-blur">
              <Star className="h-3 w-3 fill-cyan-400 text-cyan-400" />
              {myRating}/10
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={inList ? 'Remove from library' : 'Add to library'}
          onClick={(e) => {
            e.stopPropagation()
            toggle(movie)
          }}
          className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-colors ${
            inList
              ? 'border-cyan-400/50 bg-cyan-500/90 hover:bg-cyan-500'
              : 'border-white/10 bg-neutral-950/60 hover:bg-neutral-950'
          }`}
        >
          <motion.span
            key={inList ? 'in' : 'out'}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center"
          >
            {inList ? (
              <Check className="h-4 w-4 text-white" />
            ) : (
              <Bookmark className="h-4 w-4 text-white" />
            )}
          </motion.span>
        </button>

        <div className="absolute right-2.5 top-14">
          <AddToList movie={movie} align="left" />
        </div>
      </div>

      <div className="space-y-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-white">{movie.title}</h3>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-yellow-400">
            <Star className="h-3.5 w-3.5 fill-yellow-400" />
            {Number(movie.vote_average) > 0 ? movie.vote_average.toFixed(1) : 'Unrated'}
          </span>
        </div>
        <p className="text-xs text-neutral-500">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : '—'}
        </p>
      </div>
    </motion.article>
  )
}
