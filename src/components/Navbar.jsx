import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clapperboard, Search } from 'lucide-react'
import Button from './ui/Button'

export default function Navbar({ onSearchFocus, libraryCount }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-neutral-950/70 backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_4px_20px_rgba(167,139,250,0.4)] transition-transform group-hover:rotate-6">
            <Clapperboard className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Cine<span className="text-violet-400">Track</span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSearchFocus}>
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>
          <a href="#library" className="relative">
            <Button variant="outline" size="sm">
              My library
              <AnimatePresence>
                {libraryCount > 0 && (
                  <motion.span
                    key={libraryCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-1.5 text-[11px] font-semibold text-white"
                  >
                    {libraryCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </a>
        </div>
      </nav>
    </motion.header>
  )
}
