import { motion } from 'framer-motion'
import { mediaTypeOf } from '../lib/api'
import MovieCard from './MovieCard'
import SkeletonCard from './SkeletonCard'

export default function MovieGrid({ title, movies, loading, onView }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      {title && (
        <h2 className="mb-5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
      )}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {movies.map((movie, i) => (
            <MovieCard key={`${mediaTypeOf(movie)}-${movie.id}`} movie={movie} index={i} onView={onView} />
          ))}
        </motion.div>
      )}
    </section>
  )
}
