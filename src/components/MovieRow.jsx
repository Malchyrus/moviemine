import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'
import SkeletonCard from './SkeletonCard'

export default function MovieRow({ title, movies, loading, onView }) {
  const scrollRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  const scrollBy = (dir) =>
    scrollRef.current?.scrollBy({ left: dir * (scrollRef.current.clientWidth * 0.8), behavior: 'smooth' })

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={!canLeft}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition-colors hover:bg-white/10 disabled:opacity-30"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canRight}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition-colors hover:bg-white/10 disabled:opacity-30"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <motion.div
        ref={scrollRef}
        onScroll={onScroll}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-4 pb-2 sm:-mx-6 sm:px-6"
        style={{ scrollbarWidth: 'thin' }}
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 snap-start sm:w-48">
                <SkeletonCard />
              </div>
            ))
          : movies.map((movie, i) => (
              <div
                key={movie.id}
                className="w-40 shrink-0 snap-start sm:w-48"
              >
                <MovieCard movie={movie} index={i} onView={onView} />
              </div>
            ))}
      </motion.div>
    </section>
  )
}
