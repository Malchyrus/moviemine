import { useState } from 'react'
import { motion } from 'framer-motion'

export default function RatingStars({ value, onChange, size = 'sm', readOnly }) {
  const [hover, setHover] = useState(0)
  const active = hover || value || 0

  const bars = Array.from({ length: 10 }, (_, i) => i + 1)

  const fillClass = (n) =>
    n <= active
      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
      : 'bg-white/10'

  if (readOnly) {
    return (
      <div className="flex items-center gap-1.5" title={`${value}/10`}>
        <div className="flex items-end gap-0.5">
          {bars.map((n) => (
            <span
              key={n}
              className={`w-1 rounded-sm ${n <= active ? 'bg-violet-500' : 'bg-white/10'}`}
              style={{ height: `${4 + n * 1.4}px` }}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-violet-400">{value}/10</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-end gap-1.5">
        {bars.map((n) => (
          <motion.button
            key={n}
            type="button"
            aria-label={`Rate ${n}/10`}
            whileHover={{ scale: 1.25, y: -2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(value === n ? null : n)}
            className={`w-1.5 rounded-full transition-colors duration-150 ${fillClass(n)}`}
            style={{ height: `${5 + n * 2}px` }}
          />
        ))}
      </div>
      <motion.span
        key={active}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-sm font-semibold tabular-nums text-white"
      >
        {active ? (
          <>
            {active}
            <span className="text-neutral-500">/10</span>
          </>
        ) : (
          <span className="font-normal text-neutral-500">Tap to rate</span>
        )}
      </motion.span>
    </div>
  )
}
