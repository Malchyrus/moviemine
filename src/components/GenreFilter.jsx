import { Check, Minus } from 'lucide-react'
import { useGenres } from '../lib/genres'

export function cycleGenre(included, excluded, id) {
  const nextIn = new Set(included)
  const nextEx = new Set(excluded)

  if (nextIn.has(id)) {
    nextIn.delete(id)
    nextEx.add(id)
  } else if (nextEx.has(id)) {
    nextEx.delete(id)
  } else {
    nextIn.add(id)
  }

  return { included: nextIn, excluded: nextEx }
}

export function matchesGenreFilters(movie, included, excluded) {
  const ids = (movie.genre_ids || []).map(Number)
  const genres = movie.genres || []
  const hasId = (id) => ids.includes(Number(id)) || genres.some((g) => Number(g.id) === Number(id))

  for (const id of excluded) {
    if (hasId(id)) return false
  }
  for (const id of included) {
    if (!hasId(id)) return false
  }

  return true
}

export function normalizeCounts(counts) {
  return counts instanceof Map ? [...counts.entries()] : Object.entries(counts || {})
}

export default function GenreFilter({ counts = {}, included = new Set(), excluded = new Set(), onCycle }) {
  const genres = useGenres()
  const entries = normalizeCounts(counts).sort((a, b) => b[1] - a[1])

  if (entries.length === 0) return null

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-white">Genres</p>
      <p className="mt-0.5 text-[10px] text-neutral-500">
        Click: include · twice: exclude · thrice: clear
      </p>
      <div className="mt-3 space-y-1">
        {entries.map(([id, count]) => {
          const key = Number(id)
          const name = genres[key] || `Genre ${id}`
          const isIn = included.has(key)
          const isEx = excluded.has(key)
          return (
            <button
              key={id}
              type="button"
              onClick={() => onCycle(key)}
              title={`${name}: ${isEx ? 'excluded' : isIn ? 'included' : 'not filtered'}`}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  isIn
                    ? 'border-cyan-500 bg-cyan-500 text-white'
                    : isEx
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : 'border-white/20 text-transparent'
                }`}
              >
                {isIn ? <Check className="h-3 w-3" /> : isEx ? <Minus className="h-3 w-3" /> : null}
              </span>
              <span className="min-w-0 truncate text-xs font-medium text-neutral-300">{name}</span>
              <span className="ml-auto shrink-0 text-[10px] text-neutral-500">{count}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
