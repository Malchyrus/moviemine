import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { LibraryProvider, useLibrary } from './lib/library'
import { GenreProvider } from './lib/genres'
import Navbar from './components/Navbar'
import MovieModal from './components/MovieModal'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'
import Home from './pages/Home'
import Library from './components/Library'

function AppShell() {
  const [selected, setSelected] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const { counts, preferences } = useLibrary()
  const location = useLocation()

  const openAuth = useCallback(() => setAuthOpen(true), [])
  const background = preferences.background

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div
      className="min-h-screen bg-neutral-950"
      style={
        background
          ? {
              backgroundImage: `linear-gradient(rgba(10, 10, 10, 0.55), rgba(10, 10, 10, 0.55)), url(${background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      <Navbar onOpenAuth={openAuth} libraryCount={counts.total} />

      <Routes>
        <Route path="/" element={<Home onView={setSelected} />} />
        <Route
          path="/library"
          element={<Library onView={setSelected} onOpenAuth={openAuth} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />

      <AnimatePresence>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {selected && (
          <MovieModal
            movie={selected}
            onClose={() => setSelected(null)}
            onRequireAuth={openAuth}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <GenreProvider>
        <LibraryProvider>
          <AppShell />
        </LibraryProvider>
      </GenreProvider>
    </AuthProvider>
  )
}
