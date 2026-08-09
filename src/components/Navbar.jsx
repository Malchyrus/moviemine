import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clapperboard, LogOut, Search, User } from 'lucide-react'
import { useAuth } from '../lib/auth'
import Button from './ui/Button'

export default function Navbar({ onOpenAuth, libraryCount }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function goSearch() {
    navigate('/')
    setTimeout(() => {
      const el = document.getElementById('search-input')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus()
    }, 150)
  }

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
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-500 shadow-[0_4px_20px_rgba(34,211,238,0.4)] transition-transform group-hover:rotate-6">
            <Clapperboard className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Movie<span className="text-cyan-400">Mine</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goSearch}>
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>

          <NavLink to="/library">
            {({ isActive }) => (
              <Button variant={isActive ? 'primary' : 'outline'} size="sm">
                My library
                <AnimatePresence>
                  {libraryCount > 0 && (
                    <motion.span
                      key={libraryCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-1.5 text-[11px] font-semibold text-white"
                    >
                      {libraryCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            )}
          </NavLink>

          {user ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-500">
                  <User className="h-3 w-3 text-white" />
                </span>
                <span className="hidden max-w-24 truncate sm:inline">{user.name}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="accent" size="sm" onClick={onOpenAuth}>
              Log in
            </Button>
          )}
        </div>
      </nav>
    </motion.header>
  )
}
