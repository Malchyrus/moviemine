import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'

export default function SearchBar({ query, onChange, onSubmit, inputRef }) {
  const localRef = useRef(null)
  const ref = inputRef || localRef

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={onSubmit}
      className="group relative mx-auto w-full max-w-xl"
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500 transition-colors group-focus-within:text-cyan-400" />
      <input
        ref={ref}
        id="search-input"
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search movies…"
        className="h-12 w-full rounded-full border border-white/10 bg-white/5 pl-12 pr-12 text-sm text-white placeholder-neutral-500 backdrop-blur transition-all duration-300 outline-none focus:border-cyan-500/50 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-neutral-400 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.form>
  )
}
