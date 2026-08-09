import { motion } from 'framer-motion'
import { SearchX } from 'lucide-react'

export default function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
      <div className="aspect-[2/3] bg-neutral-800" />
      <div className="space-y-2 p-4">
        <div className="h-3.5 w-3/4 rounded bg-neutral-800" />
        <div className="h-3 w-1/3 rounded bg-neutral-800" />
      </div>
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', message, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-3 py-24 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <SearchX className="h-7 w-7 text-neutral-500" />
      </span>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {message && <p className="max-w-sm text-sm text-neutral-500">{message}</p>}
      {children}
    </motion.div>
  )
}
