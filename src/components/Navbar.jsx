import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Clapperboard, LogOut, Search, Settings, User } from 'lucide-react'
import { useAuth } from '../lib/auth'
import Button from './ui/Button'

export default function Navbar({ onOpenAuth, libraryCount }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  function goSearch() {
    navigate('/search')
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
            <div className="relative" ref={menuRef}>
              <Button variant="ghost" size="sm" onClick={() => setMenuOpen((o) => !o)}>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-500">
                    <User className="h-3 w-3 text-white" />
                  </span>
                )}
                <span className="hidden max-w-24 truncate sm:inline">{user.name}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                />
              </Button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/95 py-1.5 shadow-2xl backdrop-blur-xl"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <User className="h-4 w-4 text-neutral-500" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Settings className="h-4 w-4 text-neutral-500" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        logout()
                      }}
                      className="flex w-full items-center gap-2.5 border-t border-white/10 px-4 py-2.5 text-left text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <LogOut className="h-4 w-4 text-neutral-500" />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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
